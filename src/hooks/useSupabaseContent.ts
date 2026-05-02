import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  year: string;
  rating: string;
  type: 'movie' | 'series';
  genre?: string;
  description?: string;
}

export const useSupabaseContent = (limit: number = 20) => {
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch movies
        const { data: moviesData, error: moviesError } = await supabase
          .from('cinema')
          .select('*')
          .limit(limit);
        
        if (moviesError) throw moviesError;
        
        const mappedMovies: ContentItem[] = (moviesData || []).map((item: any) => ({
          id: item.id?.toString() || '',
          title: item.titulo || 'Sem título',
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          backdrop: item.banner ? tmdbImageUrl(item.banner, 'original') : '',
          year: item.year || '',
          rating: item.rating || 'N/A',
          type: 'movie',
          genre: item.genre || '',
          description: item.description || '',
        }));
        
        // Fetch series
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('*')
          .limit(limit);
        
        if (seriesError) throw seriesError;
        
        const mappedSeries: ContentItem[] = (seriesData || []).map((item: any) => ({
          id: item.id?.toString() || '',
          title: item.titulo || 'Sem título',
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          backdrop: item.banner ? tmdbImageUrl(item.banner, 'original') : '',
          year: item.year || '',
          rating: item.rating || 'N/A',
          type: 'series',
          genre: item.genre || '',
          description: item.description || '',
        }));
        
        setMovies(mappedMovies);
        setSeries(mappedSeries);
      } catch (err: any) {
        console.error('[useSupabaseContent] Erro:', err);
        setError(err.message || 'Erro ao carregar conteúdo');
        setMovies([]);
        setSeries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [limit]);

  return { movies, series, isLoading, error };
};

export default useSupabaseContent;
