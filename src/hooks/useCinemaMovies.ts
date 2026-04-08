import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CinemaMovie, CATEGORY_MAPPING } from '@/data/movieCategories';

interface CategorizedMovies {
  [categoryId: string]: CinemaMovie[];
}

export function useCinemaMovies() {
  const [movies, setMovies] = useState<CinemaMovie[]>([]);
  const [categorizedMovies, setCategorizedMovies] = useState<CategorizedMovies>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar filmes do cinema:', error);
        return;
      }

      const moviesData = (data || []) as CinemaMovie[];
      setMovies(moviesData);

      // Organizar filmes por categoria (suporta múltiplas categorias)
      const categorized: CategorizedMovies = {};
      
      moviesData.forEach(movie => {
        if (movie.category) {
          // Dividir categorias se houver múltiplas (separadas por vírgula, pipe, etc)
          const categories = movie.category.split(/[,|;/]/).map(c => c.trim());
          
          categories.forEach(cat => {
            const categoryId = CATEGORY_MAPPING[cat];
            if (categoryId) {
              if (!categorized[categoryId]) {
                categorized[categoryId] = [];
              }
              // Evitar duplicados na mesma categoria
              if (!categorized[categoryId].find(m => m.id === movie.id)) {
                categorized[categoryId].push(movie);
              }
            }
          });
        }
      });

      setCategorizedMovies(categorized);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Buscar filmes por categoria específica
  const getMoviesByCategory = useCallback((categoryId: string): CinemaMovie[] => {
    return categorizedMovies[categoryId] || [];
  }, [categorizedMovies]);

  // Buscar filmes por ano de lançamento
  const getMoviesByYear = useCallback((year: string): CinemaMovie[] => {
    return movies.filter(m => m.year === year);
  }, [movies]);

  return {
    movies,
    categorizedMovies,
    isLoading,
    getMoviesByCategory,
    getMoviesByYear,
    refresh: fetchMovies,
  };
}
