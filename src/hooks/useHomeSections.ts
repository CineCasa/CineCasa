import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/data/content";
import { useAuth } from "@/components/AuthProvider";

interface HomeSection {
  id: string;
  title: string;
  items: ContentItem[];
  type: 'continue-watching' | 'releases' | 'personalized' | 'finance' | 'blackness' | 'romance' | 'trending' | 'kids' | 'top5' | 'oscar' | 'relaxing';
}

export const useHomeSections = () => {
  const { user } = useAuth();
  
  // Forçar atualização sempre em localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return useQuery({
    queryKey: ["home-sections", user?.id],
    queryFn: async (): Promise<HomeSection[]> => {
      // Buscar todos os dados das tabelas
      const fetchAllRecords = async (table: string) => {
        let allData: any[] = [];
        let from = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table as any)
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
        fetchAllRecords("cinema"),
        fetchAllRecords("series"),
        fetchAllRecords("filmes_kids"),
        fetchAllRecords("series_kids")
      ]);

      // Função para converter dados para ContentItem
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

      // Combinar todos os conteúdos
      const allContent: ContentItem[] = [
        ...cinema.map(item => mapToContentItem(item, 'cinema')),
        ...series.map(item => mapToContentItem(item, 'series')),
        ...filmesKids.map(item => mapToContentItem(item, 'kids-movie')),
        ...seriesKids.map(item => mapToContentItem(item, 'kids-series'))
      ];

      // Função para embaralhar e pegar N itens
      const getRandomItems = (items: ContentItem[], count: number): ContentItem[] => {
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      };

      // Função para filtrar por categoria
      const filterByCategory = (items: ContentItem[], categories: string[]): ContentItem[] => {
        return items.filter(item => 
          categories.some(cat => 
            item.category.toLowerCase().includes(cat.toLowerCase()) ||
            item.genre.some(g => g.toLowerCase().includes(cat.toLowerCase()))
          )
        );
      };

      const sections: HomeSection[] = [];

      // 1. Continuar Assistindo (simulado - implementar com dados reais do usuário)
      const continueWatching = allContent.filter(item => item.type === "series").slice(0, 3);
      if (continueWatching.length > 0) {
        sections.push({
          id: 'continue-watching',
          title: 'Continuar Assistindo',
          items: continueWatching,
          type: 'continue-watching'
        });
      }

      // 2. Lançamentos & Novidades
      const releases = allContent.filter(item => item.year >= 2025);
      if (releases.length > 0) {
        sections.push({
          id: 'releases',
          title: 'Lançamentos & Novidades',
          items: getRandomItems(releases, 5),
          type: 'releases'
        });
      }

      // 3. Exclusivos para Você (baseado no tipo de conteúdo mais visto)
      const personalized = getRandomItems(allContent, 5);
      sections.push({
        id: 'personalized',
        title: 'Exclusivos para Você',
        items: personalized,
        type: 'personalized'
      });

      // 4. Dinheiro Importa!
      const financeCategories = ['finanças', 'dinheiro', 'negócios', 'conquista', 'sucesso'];
      const financeContent = filterByCategory(allContent, financeCategories);
      if (financeContent.length > 0) {
        sections.push({
          id: 'finance',
          title: 'Dinheiro Importa!',
          items: getRandomItems(financeContent, 5),
          type: 'finance'
        });
      }

      // 5. Negritude em Alta
      const blacknessContent = filterByCategory(allContent, ['negritude']);
      if (blacknessContent.length > 0) {
        sections.push({
          id: 'blackness',
          title: 'Negritude em Alta',
          items: getRandomItems(blacknessContent, 5),
          type: 'blackness'
        });
      }

      // 6. Romances para se Inspirar
      const romanceContent = filterByCategory(allContent, ['romance']);
      if (romanceContent.length > 0) {
        sections.push({
          id: 'romance',
          title: 'Romances para se Inspirar',
          items: getRandomItems(romanceContent, 5),
          type: 'romance'
        });
      }

      // 7. Prepare a Pipoca (séries em alta)
      const trendingSeries = allContent.filter(item => item.type === "series");
      if (trendingSeries.length > 0) {
        sections.push({
          id: 'trending',
          title: 'Prepare a Pipoca',
          items: getRandomItems(trendingSeries, 5),
          type: 'trending'
        });
      }

      // 8. Como é bom ser criança
      const kidsContent = allContent.filter(item => 
        item.category.toLowerCase().includes('infantil') ||
        item.category.toLowerCase().includes('animação') ||
        item.genre.some(g => g.toLowerCase().includes('infantil') || g.toLowerCase().includes('animação'))
      );
      if (kidsContent.length > 0) {
        sections.push({
          id: 'kids',
          title: 'Como é bom ser criança',
          items: getRandomItems(kidsContent, 5),
          type: 'kids'
        });
      }

      // 9. Top 5 dos Streamings (simulado)
      const topContent = getRandomItems(allContent.filter(item => item.rating !== "N/A"), 5);
      if (topContent.length > 0) {
        sections.push({
          id: 'top5',
          title: 'Top 5 dos Streamings',
          items: topContent,
          type: 'top5'
        });
      }

      // 10. Vencedores de Oscar
      const oscarWinners = getRandomItems(allContent.filter(item => parseFloat(item.rating) >= 8.0), 5);
      if (oscarWinners.length > 0) {
        sections.push({
          id: 'oscar',
          title: 'Vencedores de Oscar',
          items: oscarWinners,
          type: 'oscar'
        });
      }

      // 11. Travesseiro e Edredom
      const relaxingCategories = ['drama', 'romance', 'família', 'musical'];
      const relaxingContent = filterByCategory(allContent, relaxingCategories);
      if (relaxingContent.length > 0) {
        sections.push({
          id: 'relaxing',
          title: 'Travesseiro e Edredon',
          items: getRandomItems(relaxingContent, 5),
          type: 'relaxing'
        });
      }

      return sections;
    },
    // Forçar atualização sempre em localhost, cache normal em produção
    staleTime: isLocalhost ? 0 : 5 * 60 * 1000, // 0 em localhost, 5 minutos em produção
    refetchOnWindowFocus: false,
    refetchOnMount: isLocalhost ? 'always' : false
  });
};
