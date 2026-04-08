import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDynamicHomeSections } from './useDynamicHomeSections';

export const useRealtimeSections = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: sections, refetch } = useDynamicHomeSections();

  useEffect(() => {
    // Escutar mudanças nas tabelas principais
    const channels = [
      supabase
        .channel('cinema_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cinema' },
          () => {
            console.log('Cinema table changed, refetching sections...');
            refetch();
          }
        )
        .subscribe(),

      supabase
        .channel('series_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'series' },
          () => {
            console.log('Series table changed, refetching sections...');
            refetch();
          }
        )
        .subscribe(),

      supabase
        .channel('filmes_kids_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'filmes_kids' },
          () => {
            console.log('Filmes Kids table changed, refetching sections...');
            refetch();
          }
        )
        .subscribe(),

      supabase
        .channel('series_kids_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'series_kids' },
          () => {
            console.log('Series Kids table changed, refetching sections...');
            refetch();
          }
        )
        .subscribe(),

      supabase
        .channel('home_sections_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'home_sections' },
          () => {
            console.log('Home sections configuration changed, refetching...');
            refetch();
          }
        )
        .subscribe()
    ];

    // Cleanup
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [refetch]);

  const forceRefresh = async () => {
    setIsUpdating(true);
    try {
      await refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    sections,
    isUpdating,
    forceRefresh
  };
};
