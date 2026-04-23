import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/data/content";
import { useAuth } from "@/components/AuthProvider";
import { streamingService } from "@/services/streamingService";

interface DynamicSection {
  id: string;
  title: string;
  type: string;
  max_items: number;
  filter_config: any;
  sort_order: number;
  is_active: boolean;
}

interface UserProgress {
  content_id: string;
  progress_seconds: number;
  total_seconds: number;
  percentage_completed: number;
  last_watched_at: string;
}

interface UserPreference {
  category: string;
  view_count: number;
  total_watch_time: number;
}

export const useDynamicHomeSections = () => {
  const { user } = useAuth();
  
  // Forçar atualização sempre em localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return useQuery({
    queryKey: ["dynamic-home-sections", user?.id],
    queryFn: async () => {
      // 1. Buscar configurações das seções
      const { data: sections, error: sectionsError } = await (supabase as any)
        .from('home_sections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (sectionsError) throw sectionsError;

      // 2. Buscar conteúdo das tabelas principais
      const fetchAllContent = async (table: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await (supabase as any)
            .from(table)
            .select("*")
            .range(from, from + limit - 1);
          
          if (error) break;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += limit;
            hasMore = data.length === limit;
          } else {
            hasMore = false;
          }
        }
        return allData;
      };

      const [cinema, series, filmesKids, seriesKids] = await Promise.all([
        fetchAllContent("cinema"),
        fetchAllContent("series"),
        fetchAllContent("filmes_kids"),
        fetchAllContent("series_kids")
      ]);

      // 3. Buscar dados do usuário (progresso e preferências)
      let userProgress: UserProgress[] = [];
      let userPreferences: UserPreference[] = [];

      if (user) {
        const [progressData, preferencesData] = await Promise.all([
          (supabase as any).from('user_progress').select('*').eq('user_id', user.id),
          (supabase as any).from('user_preferences').select('*').eq('user_id', user.id)
        ]);
        
        userProgress = (progressData.data || []) as UserProgress[];
        userPreferences = (preferencesData.data || []) as UserPreference[];
      }

      // 4. Buscar conteúdo externo
      const { data: externalContent } = await (supabase as any)
        .from('external_content')
        .select('*')
        .eq('is_available', false);

      // 5. Converter para ContentItem
      const mapToContentItem = (item: any, prefix: string): ContentItem => {
        const isMovie = prefix.includes('cinema') || prefix.includes('kids-movie');
        const isSeries = prefix.includes('series') || prefix.includes('kids-series');
        
        return {
          id: `${prefix}-${item.id}`,
          tmdbId: item.tmdb_id,
          title: item.titulo,
          image: item.poster || `https://via.placeholder.com/300x450?text=${encodeURIComponent(item.titulo)}`,
          backdrop: item.poster || "",
          year: parseInt(item.year || "0"),
          rating: item.rating || "N/A",
          duration: "",
          genre: (item.genero || item.category || "").split(",").map((g: string) => g.trim()).filter((g: string) => g.length > 0),
          category: item.category || item.genero || "Ação",
          description: item.description || "",
          type: isSeries ? "series" : "movie",
          trailer: item.trailer,
          url: item.url,
          identificadorArchive: item.identificador_archive
        };
      };

      const allContent: ContentItem[] = [
        ...cinema.map(item => mapToContentItem(item, 'cinema')),
        ...series.map(item => mapToContentItem(item, 'series')),
        ...filmesKids.map(item => mapToContentItem(item, 'kids-movie')),
        ...seriesKids.map(item => mapToContentItem(item, 'kids-series'))
      ];

      // 6. Funções de filtro
      const filterByConfig = (content: ContentItem[], config: any): ContentItem[] => {
        let filtered = [...content];

        if (config.categories && Array.isArray(config.categories)) {
          filtered = filtered.filter(item => 
            config.categories.some((cat: string) => 
              item.category.toLowerCase().includes(cat.toLowerCase()) ||
              item.genre.some(g => g.toLowerCase().includes(cat.toLowerCase()))
            )
          );
        }

        if (config.years && Array.isArray(config.years)) {
          filtered = filtered.filter(item => config.years.includes(item.year));
        }

        if (config.content_types && Array.isArray(config.content_types)) {
          filtered = filtered.filter(item => config.content_types.includes(item.type));
        }

        if (config.min_rating) {
          filtered = filtered.filter(item => {
            const rating = parseFloat(item.rating);
            return !isNaN(rating) && rating >= config.min_rating;
          });
        }

        return filtered;
      };

      const getContinueWatching = (): ContentItem[] => {
        if (!user) return [];

        return userProgress
          .sort((a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime())
          .map(progress => allContent.find(item => item.id === progress.content_id))
          .filter(item => item !== undefined) as ContentItem[];
      };

      const getPersonalized = (): ContentItem[] => {
        if (!user || userPreferences.length === 0) {
          // Se não há preferências, retornar conteúdo popular
          return allContent
            .filter(item => parseFloat(item.rating) >= 7.0)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        }

        // Encontrar categorias mais vistas
        const topCategories = userPreferences
          .sort((a, b) => b.view_count - a.view_count)
          .map(pref => pref.category);

        return filterByConfig(allContent, { categories: topCategories })
          .sort(() => Math.random() - 0.5);
      };

      const getTopStreaming = async (): Promise<ContentItem[]> => {
        try {
          const topContent = await streamingService.getTopStreamingContent();
          
          return topContent.map(item => ({
            id: `external-${item.id}`,
            title: item.title,
            image: item.posterUrl,
            backdrop: item.backdropUrl,
            year: item.year,
            rating: item.rating,
            duration: "",
            genre: [item.category],
            category: item.category,
            description: item.description,
            type: item.type,
            url: undefined,
            trailer: undefined
          }));
        } catch (error) {
          console.error('Error fetching top streaming content:', error);
          return [];
        }
      };

      const getRandomItems = (items: ContentItem[], count?: number): ContentItem[] => {
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return count ? shuffled.slice(0, count) : shuffled;
      };

      // 7. Montar seções finais
      const finalSections = [];

      for (const section of sections || []) {
        let items: ContentItem[] = [];

        switch (section.type) {
          case 'continue-watching':
            items = getContinueWatching();
            break;
          case 'personalized':
            items = getPersonalized();
            break;
          case 'top5':
            items = await getTopStreaming();
            break;
          case 'releases':
            items = filterByConfig(allContent, section.filter_config);
            items = getRandomItems(items, section.max_items);
            break;
          default:
            items = filterByConfig(allContent, section.filter_config);
            items = getRandomItems(items, section.max_items);
        }

        if (items.length > 0) {
          finalSections.push({
            id: section.id,
            title: section.title,
            items: items,
            type: section.type
          });
        }
      }

      return finalSections;
    },
    // Forçar atualização sempre em localhost, cache normal em produção
    staleTime: isLocalhost ? 0 : 5 * 60 * 1000, // 0 em localhost, 5 minutos em produção
    refetchOnWindowFocus: false,
    refetchOnMount: isLocalhost ? 'always' : false
  });
};
