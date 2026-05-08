import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

/**
 * Hook que lê a tabela home_sections e monta os carrosséis dinamicamente.
 * Cada seção tem um tipo que determina como buscar os dados:
 * - categoria/genero: filtra cinema/series por category/genero
 * - lancamentos: ordena por year/ano DESC
 * - recomendados: baseado em user_genre_preferences
 * - continuar: user_progress
 * - watchlist: watchlist do usuário
 * - top10: top por rating
 */

export interface HomeSection {
  id: string;
  nome: string;
  tipo: string;
  query: string | null;
  ordem: number;
  ativo: boolean;
  items: ContentItem[];
  loading: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  rating?: string;
  year?: string;
  genre?: string;
}

export function useDynamicHome() {
  const { user } = useAuth();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroContent, setHeroContent] = useState<ContentItem | null>(null);

  const fetchItemsForSection = useCallback(async (section: { tipo: string; query: string | null }): Promise<ContentItem[]> => {
    try {
      switch (section.tipo) {
        case 'lancamentos': {
          const [movies, series] = await Promise.all([
            supabase.from('cinema').select('id,titulo,poster,year,rating,category').order('year', { ascending: false }).limit(15),
            supabase.from('series').select('id_n,titulo,capa,ano,rating,genero').order('ano', { ascending: false }).limit(10),
          ]);
          const m = (movies.data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const, rating: i.rating, year: i.year, genre: i.category }));
          const s = (series.data || []).map((i: any) => ({ id: i.id_n.toString(), title: i.titulo, poster: i.capa || '', type: 'series' as const, rating: i.rating?.toString(), year: i.ano, genre: i.genero }));
          return [...m, ...s].sort(() => Math.random() - 0.5).slice(0, 20);
        }

        case 'top10': {
          const { data } = await supabase.from('cinema').select('id,titulo,poster,year,rating,category').order('rating', { ascending: false }).limit(10);
          return (data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const, rating: i.rating, year: i.year, genre: i.category }));
        }

        case 'continuar': {
          if (!user?.id) return [];
          const { data: prog } = await supabase.from('user_progress').select('content_id,content_type,title').eq('user_id', user.id).gt('progress', 1).lt('progress', 95).order('updated_at', { ascending: false }).limit(10);
          return (prog || []).map((p: any) => ({ id: p.content_id, title: p.title || '', poster: '', type: p.content_type === 'series' ? 'series' as const : 'movie' as const }));
        }

        case 'watchlist': {
          if (!user?.id) return [];
          const { data } = await supabase.from('watchlist').select('content_id,content_type,titulo,poster').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
          return (data || []).map((w: any) => ({ id: w.content_id.toString(), title: w.titulo, poster: w.poster || '', type: w.content_type === 'series' ? 'series' as const : 'movie' as const }));
        }

        case 'recomendados': {
          if (!user?.id) {
            const { data } = await supabase.from('cinema').select('id,titulo,poster,year,rating,category').order('rating', { ascending: false }).limit(20);
            return (data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const, rating: i.rating, year: i.year }));
          }
          // Buscar preferências de gênero
          const { data: prefs } = await supabase.from('user_genre_preferences').select('genre').eq('user_id', user.id).order('score', { ascending: false }).limit(3);
          const topGenres = (prefs || []).map((p: any) => p.genre);
          if (!topGenres.length) {
            const { data } = await supabase.from('cinema').select('id,titulo,poster,year,rating').order('rating', { ascending: false }).limit(20);
            return (data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const }));
          }
          const { data } = await supabase.from('cinema').select('id,titulo,poster,year,rating,category').in('category', topGenres).limit(20);
          return (data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const, rating: i.rating, year: i.year }));
        }

        default: {
          // tipo "categoria" ou qualquer outro — usa o campo query como filtro
          const q = section.query || '';
          const [movies, series] = await Promise.all([
            supabase.from('cinema').select('id,titulo,poster,year,rating,category').ilike('category', `%${q}%`).limit(15),
            supabase.from('series').select('id_n,titulo,capa,ano,rating,genero').ilike('genero', `%${q}%`).limit(10),
          ]);
          const m = (movies.data || []).map((i: any) => ({ id: i.id.toString(), title: i.titulo, poster: i.poster || '', type: 'movie' as const, rating: i.rating, year: i.year, genre: i.category }));
          const s = (series.data || []).map((i: any) => ({ id: i.id_n.toString(), title: i.titulo, poster: i.capa || '', type: 'series' as const, rating: i.rating?.toString(), year: i.ano }));
          return [...m, ...s].slice(0, 20);
        }
      }
    } catch {
      return [];
    }
  }, [user?.id]);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Buscar seções ativas
      const { data: sectionsData } = await supabase
        .from('home_sections')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (!sectionsData?.length) {
        // Fallback: seções padrão se tabela estiver vazia
        const fallback = [
          { id: 'default-1', nome: 'Em Alta', tipo: 'lancamentos', query: null, ordem: 0, ativo: true },
          { id: 'default-2', nome: 'Ação', tipo: 'categoria', query: 'Ação', ordem: 1, ativo: true },
          { id: 'default-3', nome: 'Top 10', tipo: 'top10', query: null, ordem: 2, ativo: true },
        ];
        const loaded = await Promise.all(fallback.map(async s => ({ ...s, items: await fetchItemsForSection(s), loading: false })));
        setSections(loaded);
        if (loaded[0]?.items[0]) setHeroContent(loaded[0].items[0]);
        return;
      }

      // 2. Inicializar seções com loading
      setSections(sectionsData.map(s => ({ ...s, items: [], loading: true })));

      // 3. Carregar items de cada seção
      const loaded = await Promise.all(
        sectionsData.map(async (s: any) => ({
          ...s,
          items: await fetchItemsForSection(s),
          loading: false,
        }))
      );

      setSections(loaded);

      // 4. Hero: primeiro item da primeira seção com itens
      const firstWithItems = loaded.find(s => s.items.length > 0);
      if (firstWithItems?.items[0]) setHeroContent(firstWithItems.items[0]);
    } catch (err) {
      console.error('[useDynamicHome]', err);
    } finally {
      setLoading(false);
    }
  }, [fetchItemsForSection]);

  useEffect(() => { loadHome(); }, [loadHome]);

  return { sections, loading, heroContent, refresh: loadHome };
}
