import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const usePreparePipoca = () => {
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        // Fetch all series to get unique series names
        const { data: allSeries } = await supabase
          .from('series')
          .select('*')
          .order('rating', { ascending: false });
        
        if (!allSeries || allSeries.length === 0) {
          setSeries([]);
          return;
        }

        // Group series by name to avoid duplicates (same series, different seasons)
        const seriesByName = new Map();
        allSeries.forEach((item: any) => {
          const seriesName = item.titulo?.toLowerCase().trim();
          if (seriesName && !seriesByName.has(seriesName)) {
            seriesByName.set(seriesName, item);
          }
        });

        // Convert to array and shuffle randomly
        const uniqueSeries = Array.from(seriesByName.values());
        
        // Fisher-Yates shuffle algorithm for true randomness
        for (let i = uniqueSeries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [uniqueSeries[i], uniqueSeries[j]] = [uniqueSeries[j], uniqueSeries[i]];
        }

        // Take first 5 series
        const selectedSeries = uniqueSeries.slice(0, 5);
        
        const mapped = selectedSeries.map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'series',
        }));
        
        setSeries(mapped);
      } catch (err) {
        console.log('[usePreparePipoca] Erro:', err);
        setSeries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeries();
  }, []);

  return { series, isLoading, items: series };
};

export default usePreparePipoca;
