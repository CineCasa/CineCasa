import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DiscoveryItem {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  backdropPath?: string;
  genre?: string;
  year?: number;
  rating?: number;
  duration?: number;
  viewCount?: number;
  popularity?: number;
  tags?: string[];
  category: string;
  subcategory?: string;
  metadata?: {
    isNew?: boolean;
    isTrending?: boolean;
    isExclusive?: boolean;
    isAwardWinner?: boolean;
    releaseDate?: string;
    originalLanguage?: string;
    countries?: string[];
  };
}

interface UseContentDiscoveryOptions {
  userId?: string;
  categories?: string[];
  genres?: string[];
  yearRange?: [number, number];
  ratingRange?: [number, number];
  sortBy?: 'popularity' | 'rating' | 'year' | 'recent' | 'trending';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeFilters?: boolean;
}

interface FilterOptions {
  genres: string[];
  years: number[];
  ratings: number[];
  durations: string[];
  countries: string[];
  languages: string[];
  tags: string[];
}

export function useContentDiscovery({
  userId,
  categories = ['all'],
  genres = [],
  yearRange,
  ratingRange = [0, 10],
  sortBy = 'popularity',
  sortOrder = 'desc',
  limit = 50,
  includeFilters = true,
}: UseContentDiscoveryOptions = {}) {
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    genres: [],
    years: [],
    ratings: [],
    durations: [],
    countries: [],
    languages: [],
    tags: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);

  // Query para conteúdo principal
  const { data: content, isLoading, error, refetch } = useQuery({
    queryKey: ['content-discovery', selectedCategory, activeFilters, sortBy, sortOrder, currentPage, limit],
    queryFn: async (): Promise<DiscoveryItem[]> => {
      try {
        let query = supabase.from('cinema').select('*');

        // Aplicar filtros
        if (activeFilters.genres.length > 0) {
          query = query.in('genre', activeFilters.genres);
        }

        if (activeFilters.years.length > 0) {
          query = query.in('year', activeFilters.years);
        }

        if (activeFilters.ratings.length > 0) {
          query = query.in('rating', activeFilters.ratings);
        }

        // Aplicar ordenação
        const orderColumn = sortBy === 'popularity' ? 'view_count' : 
                          sortBy === 'rating' ? 'rating' : 
                          sortBy === 'year' ? 'year' : 
                          sortBy === 'recent' ? 'created_at' : 
                          'view_count';
        
        query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

        // Aplicar paginação
        const from = currentPage * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar conteúdo:', error);
          throw error;
        }

        // Processar dados
        return (data || []).map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          coverImage: item.cover_image,
          backdropPath: item.backdrop_path,
          genre: item.genre,
          year: item.year,
          rating: item.rating,
          duration: item.duration,
          viewCount: item.view_count,
          popularity: item.view_count,
          tags: item.tags || [],
          category: categorizeContent(item),
          metadata: {
            isNew: isNewContent(item),
            isTrending: isTrendingContent(item),
            isExclusive: item.is_exclusive,
            isAwardWinner: item.awards && item.awards.length > 0,
            releaseDate: item.release_date,
            originalLanguage: item.original_language,
            countries: item.countries,
          },
        }));
      } catch (error) {
        console.error('❌ Erro na descoberta de conteúdo:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para categorias especiais
  const { data: categoriesData } = useQuery({
    queryKey: ['discovery-categories'],
    queryFn: async () => {
      const [
        trendingResult,
        newReleasesResult,
        awardWinnersResult,
        exclusiveResult,
        popularResult,
      ] = await Promise.all([
        // Em alta
        supabase
          .from('cinema')
          .select('*')
          .order('view_count', { ascending: false })
          .limit(20),

        // Lançamentos
        supabase
          .from('cinema')
          .select('*')
          .gte('release_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('release_date', { ascending: false })
          .limit(20),

        // Premiados
        supabase
          .from('cinema')
          .select('*')
          .not('awards', 'is', null)
          .order('rating', { ascending: false })
          .limit(15),

        // Exclusivos
        supabase
          .from('cinema')
          .select('*')
          .eq('is_exclusive', true)
          .order('created_at', { ascending: false })
          .limit(15),

        // Populares
        supabase
          .from('cinema')
          .select('*')
          .gte('rating', 8)
          .order('rating', { ascending: false })
          .limit(20),
      ]);

      return {
        trending: trendingResult.data || [],
        newReleases: newReleasesResult.data || [],
        awardWinners: awardWinnersResult.data || [],
        exclusive: exclusiveResult.data || [],
        popular: popularResult.data || [],
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query para opções de filtros
  const { data: filterOptions } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const [genresResult, yearsResult] = await Promise.all([
        // Gêneros disponíveis
        supabase
          .from('cinema')
          .select('genre')
          .not('genre', 'is', null),

        // Anos disponíveis
        supabase
          .from('cinema')
          .select('year')
          .not('year', 'is', null)
          .order('year', { ascending: false }),
      ]);

      // Processar gêneros únicos
      const genres = [...new Set((genresResult.data || []).map(item => item.genre))];
      
      // Processar anos únicos
      const years = [...new Set((yearsResult.data || []).map(item => item.year))]
        .sort((a, b) => b - a)
        .slice(0, 20);

      return {
        genres,
        years,
        ratings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        durations: ['< 1h', '1-2h', '2-3h', '> 3h'],
        countries: ['Brasil', 'EUA', 'Reino Unido', 'França', 'Japão', 'Coreia'],
        languages: ['Português', 'Inglês', 'Espanhol', 'Francês', 'Japonês', 'Coreano'],
        tags: ['Ação', 'Comédia', 'Drama', 'Terror', 'Ficção Científica', 'Romance'],
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    cacheTime: 24 * 60 * 1000, // 24 horas
  });

  // Funções utilitárias
  const categorizeContent = useCallback((item: any): string => {
    if (item.view_count > 10000) return 'trending';
    if (isNewContent(item)) return 'new';
    if (item.awards && item.awards.length > 0) return 'award-winning';
    if (item.is_exclusive) return 'exclusive';
    if (item.rating >= 8.5) return 'highly-rated';
    return 'regular';
  }, []);

  const isNewContent = useCallback((item: any): boolean => {
    if (!item.release_date) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(item.release_date) > thirtyDaysAgo;
  }, []);

  const isTrendingContent = useCallback((item: any): boolean => {
    return item.view_count > 5000;
  }, []);

  // Funções de manipulação de filtros
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(0); // Resetar paginação
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({
      genres: [],
      years: [],
      ratings: [],
      durations: [],
      countries: [],
      languages: [],
      tags: [],
    });
    setCurrentPage(0);
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setActiveFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
    setCurrentPage(0);
  }, []);

  const toggleYear = useCallback((year: number) => {
    setActiveFilters(prev => ({
      ...prev,
      years: prev.years.includes(year)
        ? prev.years.filter(y => y !== year)
        : [...prev.years, year],
    }));
    setCurrentPage(0);
  }, []);

  const setRatingRange = useCallback((min: number, max: number) => {
    setActiveFilters(prev => ({
      ...prev,
      ratings: Array.from({ length: max - min + 1 }, (_, i) => min + i),
    }));
    setCurrentPage(0);
  }, []);

  // Funções de paginação
  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, page));
  }, []);

  // Busca
  const search = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      refetch();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro na busca:', error);
        throw error;
      }

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        coverImage: item.cover_image,
        backdropPath: item.backdrop_path,
        genre: item.genre,
        year: item.year,
        rating: item.rating,
        viewCount: item.view_count,
        category: 'search-result',
        metadata: {
          isNew: isNewContent(item),
          isTrending: isTrendingContent(item),
        },
      }));
    } catch (error) {
      console.error('❌ Erro na busca de conteúdo:', error);
      throw error;
    }
  }, [refetch, limit, isNewContent, isTrendingContent]);

  // Memoizar conteúdo processado
  const processedContent = useMemo(() => {
    if (!content) return [];

    return content.map(item => ({
      ...item,
      // Adicionar score de relevância baseado nos filtros ativos
      relevanceScore: calculateRelevanceScore(item, activeFilters, searchQuery),
    }));
  }, [content, activeFilters, searchQuery]);

  const calculateRelevanceScore = useCallback((
    item: DiscoveryItem,
    filters: FilterOptions,
    query: string
  ): number => {
    let score = 0;

    // Score por gênero
    if (filters.genres.includes(item.genre || '')) {
      score += 30;
    }

    // Score por ano
    if (filters.years.includes(item.year || 0)) {
      score += 20;
    }

    // Score por rating
    if (filters.ratings.some(rating => 
        item.rating && item.rating >= rating - 0.5 && item.rating <= rating + 0.5)) {
      score += 15;
    }

    // Score por busca
    if (query && item.title.toLowerCase().includes(query.toLowerCase())) {
      score += 50;
    }
    if (query && item.description && item.description.toLowerCase().includes(query.toLowerCase())) {
      score += 25;
    }

    return score;
  }, []);

  // Estatísticas
  const stats = useMemo(() => {
    if (!content) return {
      total: 0,
      activeFilters: 0,
      categories: {},
    };

    const total = content.length;
    const activeFiltersCount = Object.values(activeFilters).filter(arr => arr.length > 0).length;
    const categories = content.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      activeFilters: activeFiltersCount,
      categories,
    };
  }, [content, activeFilters]);

  return {
    // Dados
    content: processedContent,
    categories: categoriesData,
    filterOptions,
    isLoading,
    error,
    stats,
    
    // Estado dos filtros
    activeFilters,
    searchQuery,
    selectedCategory,
    currentPage,
    
    // Ações
    updateFilters,
    clearFilters,
    toggleGenre,
    toggleYear,
    setRatingRange,
    search,
    
    // Paginação
    nextPage,
    prevPage,
    goToPage,
    refetch,
    
    // Estados
    hasContent: content.length > 0,
    isEmpty: content.length === 0,
    hasActiveFilters: Object.values(activeFilters).some(arr => arr.length > 0),
    isSearching: searchQuery.trim().length > 0,
  };
}

// Hook para conteúdo específico por categoria
export function useCategoryContent(
  category: string,
  options: Partial<UseContentDiscoveryOptions> = {}
) {
  const { content, isLoading, error } = useContentDiscovery({
    categories: [category],
    ...options,
  });

  const categoryContent = useMemo(() => {
    if (!content) return [];
    return content.filter(item => item.category === category);
  }, [content, category]);

  return {
    content: categoryContent,
    isLoading,
    error,
    hasContent: categoryContent.length > 0,
  };
}
