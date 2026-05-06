import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useNovidades = (email?: string) => {
  const [novidades, setNovidades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNovidades = async () => {
      try {
        // Buscar filmes das categorias "Lançamento 2026" e "Lançamento 2025"
        const { data: filmesData } = await supabase
          .from('cinema')
          .select('*')
          .in('genre', ['Lançamento 2026', 'Lançamento 2025'])
          .order('created_at', { ascending: false })
          .limit(15);

        // Buscar séries das categorias "Lançamento 2026" e "Lançamento 2025"
        const { data: seriesData } = await supabase
          .from('series')
          .select('*')
          .in('genero', ['Lançamento 2026', 'Lançamento 2025'])
          .order('created_at', { ascending: false })
          .limit(15);

        // Combinar filmes e séries
        const filmesMapped = (filmesData || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
          genre: item.genre,
          created_at: item.created_at
        }));

        const seriesMapped = (seriesData || []).map((item: any) => ({
          id: item.id_n,
          title: item.titulo,
          poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'series',
          genre: item.genero,
          created_at: item.created_at
        }));

        // Combinar e ordenar por data de criação
        const allNovidades = [...filmesMapped, ...seriesMapped]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20);

        setNovidades(allNovidades);
      } catch (err) {
        console.log('[useNovidades] Erro:', err);
        setNovidades([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNovidades();
  }, [email]);

  return { novidades, isLoading };
};

export default useNovidades;
