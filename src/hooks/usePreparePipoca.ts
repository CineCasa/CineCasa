import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SeriePipoca {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'series';
  year: string;
  rating: string;
}

interface UsePreparePipocaReturn {
  series: SeriePipoca[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const usePreparePipoca = (userId?: string): UsePreparePipocaReturn => {
  const [series, setSeries] = useState<SeriePipoca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchSeries = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🍿 [PreparePipoca] Buscando séries...');
      
      // Buscar séries do banco - sem limite para pegar todas
      const { data, error } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, capa, ano, rating, genero, description, category');

      if (error) {
        console.error('❌ [PreparePipoca] Erro:', error);
        throw error;
      }

      console.log('📺 [PreparePipoca] Total séries:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('⚠️ [PreparePipoca] Nenhuma série encontrada');
        setSeries([]);
        return;
      }

      // Extrair título base (sem temporada)
      const getBaseTitle = (title: string): string => {
        return title
          .replace(/\s*T\d+.*$/i, '')
          .replace(/\s*[-:]?\s*Temporada\s*\d+.*/i, '')
          .replace(/\s*[-:]?\s*Season\s*\d+.*/i, '')
          .replace(/\s*\d+ª?\s*Temporada.*/i, '')
          .trim()
          .toLowerCase();
      };

      // Agrupar por título base
      const grouped = new Map<string, any[]>();
      data.forEach(serie => {
        const base = getBaseTitle(serie.titulo || '');
        if (!grouped.has(base)) grouped.set(base, []);
        grouped.get(base)?.push(serie);
      });

      console.log('🎬 [PreparePipoca] Séries únicas:', grouped.size);

      // Pegar TODOS os títulos base (sem limite)
      const uniqueTitles = Array.from(grouped.keys());
      const shuffled = uniqueTitles.sort(() => Math.random() - 0.5);
      const selected = shuffled;

      // Formatar resultado
      const result: SeriePipoca[] = selected.map(baseTitle => {
        const variations = grouped.get(baseTitle) || [];
        const serie = variations[Math.floor(Math.random() * variations.length)];
        return {
          id: String(serie.id_n || serie.id || `series-${Math.random()}`),
          tmdbId: serie.tmdb_id,
          title: serie.titulo,
          poster: serie.capa || '/api/placeholder/300/450', // Fallback para poster
          type: 'series',
          year: serie.ano || serie.year || '2024',
          rating: serie.rating || 'N/A',
        };
      });

      console.log('✅ [PreparePipoca] Selecionadas:', result.length, result.map(s => s.title));
      setSeries(result);
    } catch (err) {
      console.error('💥 [PreparePipoca] Erro fatal:', err);
      setSeries([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSeries();
  }, [fetchSeries]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchSeries();
    }
  }, [fetchSeries]);

  return {
    series,
    isLoading,
    refresh,
  };
};

export default usePreparePipoca;
