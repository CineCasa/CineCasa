import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, Film, Tv, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  poster: string | null;
  type: 'movie' | 'series';
  year: string | null;
  rating: string | null;
  genre: string | null;
}

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export default function Search() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debouncedQuery = useDebounce(query, 350);

  // Focar no input ao abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchContent = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const term = `%${q.trim()}%`;

      const [moviesRes, seriesRes] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, titulo, poster, year, rating, category')
          .ilike('titulo', term)
          .limit(15),
        supabase
          .from('series')
          .select('id_n, titulo, capa, ano, rating, genero')
          .ilike('titulo', term)
          .limit(15),
      ]);

      const movies: SearchResult[] = (moviesRes.data || []).map((m: any) => ({
        id: m.id.toString(),
        title: m.titulo,
        poster: m.poster,
        type: 'movie' as const,
        year: m.year,
        rating: m.rating,
        genre: m.category,
      }));

      const series: SearchResult[] = (seriesRes.data || []).map((s: any) => ({
        id: s.id_n.toString(),
        title: s.titulo,
        poster: s.capa,
        type: 'series' as const,
        year: s.ano,
        rating: s.rating ? String(s.rating) : null,
        genre: s.genero,
      }));

      // Intercalar filmes e séries nos resultados
      const combined: SearchResult[] = [];
      const maxLen = Math.max(movies.length, series.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies[i]) combined.push(movies[i]);
        if (series[i]) combined.push(series[i]);
      }

      setResults(combined);
    } catch (err) {
      console.error('[Search] Erro ao buscar:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchContent(debouncedQuery);
  }, [debouncedQuery, searchContent]);

  const handleCardClick = (item: SearchResult) => {
    navigate(`/details/${item.type === 'movie' ? 'cinema' : 'series'}/${item.id}`);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header com barra de busca */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10 px-4 py-4 pt-16 md:pt-4">
        <div className="max-w-2xl mx-auto relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes e séries..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00d9ff] focus:bg-white/15 transition-all text-base"
          />
          {query && (
            <button
              onClick={clearQuery}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Estado inicial */}
        {!hasSearched && !query && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <SearchIcon className="w-16 h-16 text-gray-600" />
            <p className="text-gray-400 text-lg">Digite para buscar filmes e séries</p>
            <p className="text-gray-600 text-sm">Mínimo de 2 caracteres</p>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-800 rounded-lg mb-2" />
                <div className="h-3 bg-gray-800 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Resultados */}
        {!isLoading && hasSearched && (
          <AnimatePresence mode="wait">
            {results.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-gray-400 text-sm mb-4">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} para "{debouncedQuery}"
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((item) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.04 }}
                      onClick={() => handleCardClick(item)}
                      className="cursor-pointer group"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                        {item.poster ? (
                          <img
                            src={tmdbImageUrl(item.poster, 'w342')}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            {item.type === 'movie' ? (
                              <Film className="w-10 h-10 text-gray-500" />
                            ) : (
                              <Tv className="w-10 h-10 text-gray-500" />
                            )}
                          </div>
                        )}
                        {/* Badge tipo */}
                        <div className="absolute top-2 left-2 z-20">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'movie'
                              ? 'bg-blue-600/90 text-white'
                              : 'bg-purple-600/90 text-white'
                          }`}>
                            {item.type === 'movie' ? 'Filme' : 'Série'}
                          </span>
                        </div>
                        {/* Overlay hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-y-4 border-y-transparent border-l-[8px] border-l-black ml-1" />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {item.year && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.year}
                          </span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            {parseFloat(item.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 gap-4"
              >
                <SearchIcon className="w-16 h-16 text-gray-600" />
                <p className="text-gray-300 text-lg font-medium">
                  Nenhum resultado para "{debouncedQuery}"
                </p>
                <p className="text-gray-500 text-sm">Tente outro título ou verifique a ortografia</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
