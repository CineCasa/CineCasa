import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useLancamentos = (email?: string) => {
  const [lancamentos, setLancamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLancamentos = async () => {
      try {
        // Buscar filmes das categorias "Lançamento 2026" e "Lançamento 2025"
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .in('genre', ['Lançamento 2026', 'Lançamento 2025'])
          .order('created_at', { ascending: false })
          .limit(20);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
          genre: item.genre, // Adicionar genre para identificar o tipo de lançamento
        }));
        
        setLancamentos(mapped);
      } catch (err) {
        console.log('[useLancamentos] Erro:', err);
        setLancamentos([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLancamentos();
  }, [email]);

  return { lancamentos, isLoading };
};

export default useLancamentos;
