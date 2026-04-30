import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, SlidersHorizontal, Star, Calendar, Film, Tv } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchFilters {
  type: 'all' | 'movie' | 'series';
  genre: string;
  yearFrom: number;
  yearTo: number;
  rating: number;
  sortBy: 'relevance' | 'rating' | 'year' | 'title';
}

interface SearchResult {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  type: 'movie' | 'series';
  year?: number;
  rating: number;
  genre: string;
  description?: string;
}

const GENRES = [
  'Ação', 'Aventura', 'Animação', 'Comédia', 'Crime', 'Documentário', 
  'Drama', 'Família', 'Fantasia', 'História', 'Horror', 'Mistério', 
  'Romance', 'Ficção Científica', 'Suspense', 'Guerra', 'Western'
];

export function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    genre: '',
    yearFrom: 1900,
    yearTo: new Date().getFullYear(),
    rating: 0,
    sortBy: 'relevance'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  }, [recentSearches]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    if (query.trim()) {
      saveRecentSearch(query);
    }

    try {
      let movieResults: SearchResult[] = [];
      let seriesResults: SearchResult[] = [];

      // Search Movies
      if (filters.type === 'all' || filters.type === 'movie') {
        let movieQuery = supabase
          .from('cinema')
          .select('id, titulo, poster, banner, year, rating, category, descricao')
          .gte('year', filters.yearFrom)
          .lte('year', filters.yearTo);
        
        if (query.trim()) {
          movieQuery = movieQuery.ilike('titulo', `%${query}%`);
        }

        if (filters.rating > 0) {
          movieQuery = movieQuery.gte('rating', filters.rating);
        }

        if (filters.genre) {
          movieQuery = movieQuery.ilike('category', `%${filters.genre.toLowerCase()}%`);
        }

        const { data: movies } = await movieQuery.limit(20);
        
        movieResults = (movies || []).map(m => ({
          id: m.id.toString(),
          title: m.titulo,
          poster: m.poster,
          backdrop: m.banner,
          type: 'movie' as const,
          year: m.year,
          rating: parseFloat(m.rating) || 0,
          genre: m.category,
          description: m.descricao
        }));
      }

      // Search Series
      if (filters.type === 'all' || filters.type === 'series') {
        let seriesQuery = supabase
          .from('series')
          .select('id_n, titulo, banner, ano, rating, genero, descricao')
          .gte('ano', filters.yearFrom)
          .lte('ano', filters.yearTo);
        
        if (query.trim()) {
          seriesQuery = seriesQuery.ilike('titulo', `%${query}%`);
        }

        if (filters.rating > 0) {
          seriesQuery = seriesQuery.gte('rating', filters.rating);
        }

        if (filters.genre) {
          seriesQuery = seriesQuery.ilike('genero', `%${filters.genre.toLowerCase()}%`);
        }

        const { data: series } = await seriesQuery.limit(20);
        
        seriesResults = (series || []).map(s => ({
          id: s.id_n.toString(),
          title: s.titulo,
          poster: s.banner,
          backdrop: s.banner,
          type: 'series' as const,
          year: s.ano,
          rating: parseFloat(s.rating) || 0,
          genre: s.genero,
          description: s.descricao
        }));
      }

      // Combine and sort results
      let allResults = [...movieResults, ...seriesResults];
      
      switch (filters.sortBy) {
        case 'rating':
          allResults.sort((a, b) => b.rating - a.rating);
          break;
        case 'year':
          allResults.sort((a, b) => (b.year || 0) - (a.year || 0));
          break;
        case 'title':
          allResults.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters, saveRecentSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    const type = result.type === 'movie' ? 'cinema' : 'series';
    navigate(`/details/${type}/${result.id}`);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      genre: '',
      yearFrom: 1900,
      yearTo: new Date().getFullYear(),
      rating: 0,
      sortBy: 'relevance'
    });
  };

  return (
    <div className="min-h-screen bg-[#000401] text-white pt-14 md:pt-[74px]">
      {/* Header - 10px lower on non-mobile devices */}
      <div className="fixed top-14 md:top-[74px] left-0 right-0 z-40 bg-[#000401]/95 backdrop-blur-md border-b border-white/10">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar filmes, séries..."
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-lg transition-colors ${showFilters ? 'bg-red-600' : 'bg-white/10 hover:bg-white/20'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-2 space-y-4">
                  {/* Type Filter */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, type: 'all' }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        filters.type === 'all' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, type: 'movie' }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                        filters.type === 'movie' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      Filmes
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, type: 'series' }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-2 ${
                        filters.type === 'series' ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Tv className="w-4 h-4" />
                      Séries
                    </button>
                  </div>

                  {/* Genre Filter */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-400 py-2">Gênero:</span>
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => setFilters(f => ({ ...f, genre: f.genre === genre ? '' : genre }))}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          filters.genre === genre ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>

                  {/* Year Range */}
                  <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Ano:</span>
                    <input
                      type="number"
                      value={filters.yearFrom}
                      onChange={(e) => setFilters(f => ({ ...f, yearFrom: parseInt(e.target.value) || 1900 }))}
                      className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={filters.yearTo}
                      onChange={(e) => setFilters(f => ({ ...f, yearTo: parseInt(e.target.value) || new Date().getFullYear() }))}
                      className="w-20 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  {/* Rating Filter */}
                  <div className="flex items-center gap-4">
                    <Star className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Avaliação mínima:</span>
                    <div className="flex gap-2">
                      {[0, 5, 6, 7, 8].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setFilters(f => ({ ...f, rating }))}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            filters.rating === rating ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          {rating === 0 ? 'Qualquer' : `${rating}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="flex items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">Ordenar por:</span>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                      className="bg-white/10 border border-white/20 rounded px-3 py-1 text-sm"
                    >
                      <option value="relevance">Relevância</option>
                      <option value="rating">Avaliação</option>
                      <option value="year">Ano</option>
                      <option value="title">Título</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Limpar filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Buscas recentes</h3>
              <button
                onClick={clearRecentSearches}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Limpar
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(search)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/10 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div>
            <p className="text-gray-400 mb-4">{results.length} resultados encontrados</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={result.poster || '/placeholder-poster.jpg'}
                      alt={result.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.type === 'movie' ? 'bg-blue-600' : 'bg-green-600'
                        }`}>
                          {result.type === 'movie' ? 'Filme' : 'Série'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-2 text-sm font-medium line-clamp-1">{result.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-yellow-400">★ {result.rating.toFixed(1)}</span>
                    {result.year && <span>{result.year}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum resultado encontrado</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Comece a digitar para buscar</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedSearch;
