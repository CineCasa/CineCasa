import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'title' | 'genre' | 'actor' | 'director' | 'keyword';
  category?: string;
  count?: number;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  backdropPath?: string;
  genre?: string;
  year?: number;
  rating?: number;
  duration?: number;
  contentType: 'movie' | 'series';
  matchType: 'exact' | 'partial' | 'semantic';
  matchScore: number;
  highlightedFields: string[];
  metadata?: {
    actors?: string[];
    director?: string;
    keywords?: string[];
    tags?: string[];
  };
}

interface SearchFilters {
  query: string;
  genres: string[];
  yearRange: [number, number];
  ratingRange: [number, number];
  contentType: 'all' | 'movie' | 'series';
  durationRange: string;
  country: string;
  language: string;
  sortBy: 'relevance' | 'rating' | 'year' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface UseAdvancedSearchOptions {
  userId?: string;
  enableSuggestions?: boolean;
  enableSemanticSearch?: boolean;
  enableHistory?: boolean;
  debounceMs?: number;
  maxSuggestions?: number;
  maxResults?: number;
}

export function useAdvancedSearch({
  userId,
  enableSuggestions = true,
  enableSemanticSearch = true,
  enableHistory = true,
  debounceMs = 300,
  maxSuggestions = 10,
  maxResults = 50,
}: UseAdvancedSearchOptions = {}) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    genres: [],
    yearRange: [1900, new Date().getFullYear()],
    ratingRange: [0, 10],
    contentType: 'all',
    durationRange: 'all',
    country: 'all',
    language: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  // Debounce para query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Query para sugestões
  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery, maxSuggestions],
    queryFn: async (): Promise<SearchSuggestion[]> => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) return [];

      try {
        const suggestions: SearchSuggestion[] = [];

        // Sugestões de títulos
        const { data: titleSuggestions } = await supabase
          .from('cinema')
          .select('title, id')
          .ilike('title', `%${debouncedQuery}%`)
          .limit(maxSuggestions / 2);

        if (titleSuggestions) {
          suggestions.push(...titleSuggestions.map(item => ({
            id: `title_${item.id}`,
            text: item.title,
            type: 'title',
            category: 'movie',
          })));
        }

        // Sugestões de gêneros
        const { data: genreSuggestions } = await supabase
          .from('cinema')
          .select('genre')
          .ilike('genre', `%${debouncedQuery}%`)
          .limit(maxSuggestions / 4);

        if (genreSuggestions) {
          const uniqueGenres = [...new Set(genreSuggestions.map(item => item.genre))];
          suggestions.push(...uniqueGenres.map(genre => ({
            id: `genre_${genre}`,
            text: genre,
            type: 'genre',
            category: 'genre',
          })));
        }

        // Sugestões de keywords (se disponível)
        if (enableSemanticSearch) {
          const keywords = await getKeywordSuggestions(debouncedQuery);
          suggestions.push(...keywords);
        }

        return suggestions.slice(0, maxSuggestions);
      } catch (error) {
        console.error('❌ Erro ao buscar sugestões:', error);
        return [];
      }
    },
    enabled: enableSuggestions && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Query principal de busca
  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['search', filters.query, filters, maxResults],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!filters.query.trim()) return [];

      try {
        let query = supabase.from('cinema').select('*');

        // Construir query de busca
        const searchTerms = filters.query.split(' ').filter(term => term.trim());
        
        if (searchTerms.length > 0) {
          // Busca em múltiplos campos
          const searchConditions = searchTerms.map(term => 
            `title.ilike.%${term}%,description.ilike.%${term}%`
          ).join(' or ');

          query = query.or(searchConditions);
        }

        // Aplicar filtros
        if (filters.genres.length > 0) {
          query = query.in('genre', filters.genres);
        }

        if (filters.yearRange[0] > 1900) {
          query = query.gte('year', filters.yearRange[0]);
        }

        if (filters.yearRange[1] < new Date().getFullYear()) {
          query = query.lte('year', filters.yearRange[1]);
        }

        if (filters.ratingRange[0] > 0) {
          query = query.gte('rating', filters.ratingRange[0]);
        }

        if (filters.ratingRange[1] < 10) {
          query = query.lte('rating', filters.ratingRange[1]);
        }

        // Ordenação
        const orderColumn = filters.sortBy === 'relevance' ? 'view_count' :
                          filters.sortBy === 'rating' ? 'rating' :
                          filters.sortBy === 'year' ? 'year' :
                          'view_count';

        query = query.order(orderColumn, { ascending: filters.sortOrder === 'asc' });

        // Limitar resultados
        query = query.limit(maxResults);

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro na busca:', error);
          throw error;
        }

        // Processar resultados
        return (data || []).map(item => {
          const matchInfo = analyzeMatch(item, filters.query);
          
          return {
            id: item.id,
            title: item.title,
            description: item.description,
            coverImage: item.cover_image,
            backdropPath: item.backdrop_path,
            genre: item.genre,
            year: item.year,
            rating: item.rating,
            duration: item.duration,
            contentType: 'movie',
            ...matchInfo,
          };
        });
      } catch (error) {
        console.error('❌ Erro na busca avançada:', error);
        throw error;
      }
    },
    enabled: filters.query.trim().length > 0,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para analisar correspondência
  const analyzeMatch = useCallback((item: any, query: string) => {
    const queryLower = query.toLowerCase();
    const titleLower = (item.title || '').toLowerCase();
    const descriptionLower = (item.description || '').toLowerCase();
    
    let matchType: 'exact' | 'partial' | 'semantic' = 'semantic';
    let matchScore = 0;
    let highlightedFields: string[] = [];

    // Busca exata no título
    if (titleLower === queryLower) {
      matchType = 'exact';
      matchScore = 100;
      highlightedFields = ['title'];
    }
    // Busca parcial no título
    else if (titleLower.includes(queryLower)) {
      matchType = 'partial';
      matchScore = 80;
      highlightedFields = ['title'];
    }
    // Busca na descrição
    else if (descriptionLower.includes(queryLower)) {
      matchType = 'partial';
      matchScore = 60;
      highlightedFields = ['description'];
    }
    // Busca semântica (placeholder)
    else if (enableSemanticSearch) {
      matchScore = calculateSemanticScore(item, query);
      highlightedFields = ['title', 'description'];
    }

    return {
      matchType,
      matchScore,
      highlightedFields,
    };
  }, [enableSemanticSearch]);

  // Função para calcular score semântico
  const calculateSemanticScore = useCallback((item: any, query: string): number => {
    // Implementação simplificada - em produção usaria NLP/embeddings
    let score = 30; // Base score para semantic
    
    // Boost por gênero relevante
    const relevantGenres = {
      'action': ['action', 'thriller', 'adventure'],
      'comedy': ['comedy', 'romance'],
      'drama': ['drama', 'romance'],
      'horror': ['horror', 'thriller'],
      'scifi': ['science fiction', 'fantasy'],
    };

    const queryLower = query.toLowerCase();
    const itemGenre = (item.genre || '').toLowerCase();

    for (const [key, genres] of Object.entries(relevantGenres)) {
      if (queryLower.includes(key) && genres.includes(itemGenre)) {
        score += 20;
        break;
      }
    }

    return score;
  }, []);

  // Função para sugestões de keywords
  const getKeywordSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    // Em produção, isso usaria um sistema de embeddings ou NLP
    const keywordMap: Record<string, string[]> = {
      'ação': ['action', 'adventure', 'thriller'],
      'comédia': ['comedy', 'funny', 'humor'],
      'drama': ['drama', 'emotional', 'serious'],
      'terror': ['horror', 'scary', 'dark'],
      'ficção': ['scifi', 'science fiction', 'future'],
      'romance': ['romance', 'love', 'relationship'],
    };

    const suggestions: SearchSuggestion[] = [];
    
    for (const [key, keywords] of Object.entries(keywordMap)) {
      if (query.toLowerCase().includes(key)) {
        suggestions.push(...keywords.map(keyword => ({
          id: `keyword_${keyword}`,
          text: keyword,
          type: 'keyword',
          category: 'keyword',
        })));
      }
    }

    return suggestions.slice(0, 5);
  }, []);

  // Carregar histórico de busca
  useEffect(() => {
    if (!enableHistory) return;

    const saved = localStorage.getItem(`search_history_${userId}`);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
      }
    }
  }, [userId, enableHistory]);

  // Salvar histórico de busca
  const saveSearchHistory = useCallback((query: string) => {
    if (!enableHistory || !query.trim()) return;

    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 20);
    setSearchHistory(newHistory);
    
    try {
      localStorage.setItem(`search_history_${userId}`, JSON.stringify(newHistory));
    } catch (error) {
      console.error('❌ Erro ao salvar histórico:', error);
    }
  }, [searchHistory, userId, enableHistory]);

  // Funções de manipulação
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, query }));
    saveSearchHistory(query);
    setShowSuggestions(false);
  }, [saveSearchHistory]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setFilters(prev => ({ ...prev, query: suggestion.text }));
    setShowSuggestions(false);
    saveSearchHistory(suggestion.text);
  }, [saveSearchHistory]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: searchQuery,
      genres: [],
      yearRange: [1900, new Date().getFullYear()],
      ratingRange: [0, 10],
      contentType: 'all',
      durationRange: 'all',
      country: 'all',
      language: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  }, [searchQuery]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    if (enableHistory && userId) {
      localStorage.removeItem(`search_history_${userId}`);
    }
  }, [userId, enableHistory]);

  // Memoizar sugestões processadas
  const processedSuggestions = useMemo(() => {
    if (!suggestionsData) return [];

    // Combinar com histórico
    const combined = [
      ...searchHistory.slice(0, 5).map(term => ({
        id: `history_${term}`,
        text: term,
        type: 'keyword' as const,
        category: 'history',
      })),
      ...suggestionsData,
    ];

    // Remover duplicados e limitar
    return combined
      .filter((suggestion, index, arr) => 
        arr.findIndex(item => item.text.toLowerCase() === suggestion.text.toLowerCase()) === index
      )
      .slice(0, maxSuggestions);
  }, [suggestionsData, searchHistory, maxSuggestions]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!searchResults) return {
      total: 0,
      exactMatches: 0,
      partialMatches: 0,
      avgScore: 0,
    };

    const total = searchResults.length;
    const exactMatches = searchResults.filter(r => r.matchType === 'exact').length;
    const partialMatches = searchResults.filter(r => r.matchType === 'partial').length;
    const avgScore = searchResults.reduce((sum, r) => sum + r.matchScore, 0) / total;

    return {
      total,
      exactMatches,
      partialMatches,
      avgScore,
    };
  }, [searchResults]);

  return {
    // Dados
    searchQuery,
    searchResults,
    suggestions: processedSuggestions,
    searchHistory,
    filters,
    stats,
    
    // Estados
    isLoading,
    suggestionsLoading,
    error,
    showSuggestions,
    hasResults: searchResults.length > 0,
    isEmpty: searchResults.length === 0 && searchQuery.trim().length > 0,
    hasQuery: searchQuery.trim().length > 0,
    
    // Ações
    handleSearch,
    handleSuggestionClick,
    updateFilters,
    clearFilters,
    clearHistory,
    setShowSuggestions,
    refetch,
  };
}

// Hook para busca instantânea
export function useInstantSearch(
  onSearch: (query: string) => void,
  options: Partial<UseAdvancedSearchOptions> = {}
) {
  const { handleSearch, suggestions, showSuggestions, setShowSuggestions } = useAdvancedSearch(options);

  const handleInstantSearch = useCallback((query: string) => {
    handleSearch(query);
  }, [handleSearch]);

  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    handleSuggestionClick(suggestion);
  }, [handleSuggestionClick]);

  return {
    handleInstantSearch,
    selectSuggestion,
    suggestions,
    showSuggestions,
    setShowSuggestions,
  };
}
