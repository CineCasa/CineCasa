import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface Lancamento {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  backdrop?: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  category: string;
  description?: string;
  duration?: string;
  userId?: string;
  lastLoaded?: string;
}

interface UseLancamentosReturn {
  lancamentos: Lancamento[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: string | null;
}

const LANCAMENTOS_CACHE_KEY = 'cinecasa_lancamentos_cache';
const LANCAMENTOS_TIMESTAMP_KEY = 'cinecasa_lancamentos_timestamp';

export const useLancamentos = (userId?: string): UseLancamentosReturn => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const previousUserId = useRef<string | undefined>(userId);

  const fetchLancamentos = useCallback(async (forceRefresh = true) => {
    // Forçar atualização sempre em localhost para garantir conteúdo fresco
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Verificar cache por usuário
    const cacheKey = `${LANCAMENTOS_CACHE_KEY}_${userId || 'guest'}`;
    const timestampKey = `${LANCAMENTOS_TIMESTAMP_KEY}_${userId || 'guest'}`;
    
    if (!isLocalhost && !forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      // Se tem cache e é da mesma sessão (não passou mais de 1 hora)
      if (cached && timestamp) {
        const hoursSinceLastLoad = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
        if (hoursSinceLastLoad < 1) {
          setLancamentos(JSON.parse(cached));
          setLastUpdated(new Date(parseInt(timestamp)).toISOString());
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      // Buscar TODOS os filmes da tabela cinema
      const { data: allMovies, error } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Função para validar URLs de imagens
      const isValidImageUrl = (url: string): boolean => {
        if (!url || typeof url !== 'string') return false;
        
        // Domínios de placeholder inválidos
        const invalidDomains = [
          'picsum.photos',
          'placeholder.com',
          'example.com',
          'test.com',
          'fake.com',
          'invalid.com',
          'loremflickr.com',
          'dummyimage.com'
        ];

        try {
          const urlObj = new URL(url);
          if (invalidDomains.some(domain => urlObj.hostname.includes(domain))) {
            return false;
          }
        } catch (e) {
          return false;
        }

        // Padrões de placeholder
        const placeholderPatterns = [
          /placeholder/i,
          /dummy/i,
          /test/i,
          /sample/i,
          /lorem/i,
          /picsum/i
        ];

        if (placeholderPatterns.some(pattern => pattern.test(url))) {
          return false;
        }

        // URLs de localhost ou IP
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          return false;
        }

        return true;
      };

      // Filtrar filmes de Lançamento 2026 e 2025 por year ou category
      const releases2026: any[] = [];
      const releases2025: any[] = [];

      // REMOVER COLEÇÕES - mostrar apenas filmes individuais
      const filteredMovies = (allMovies || []).filter(isNotCollection);
      
      console.log('📊 Total de filmes carregados:', allMovies?.length || 0);
      console.log('📊 Filmes após remover coleções:', filteredMovies.length);

      filteredMovies.forEach((item: any) => {
        const isImageValid = isValidImageUrl(item.capa) || isValidImageUrl(item.poster);
        
        // Verificar se é lançamento 2026 ou 2025 (aceita year como string ou número)
        const itemYear = String(item.year || item.ano || '');
        const is2026 = itemYear === '2026' || itemYear.includes('2026') || 
                       item.category?.includes('Lançamento 2026') ||
                       item.genero?.includes('Lançamento 2026');
        
        const is2025 = itemYear === '2025' || itemYear.includes('2025') ||
                       item.category?.includes('Lançamento 2025') ||
                       item.genero?.includes('Lançamento 2025');

        if (is2026) {
          releases2026.push(item);
          console.log('✅ 2026 encontrado:', item.titulo, '- year:', item.year, 'category:', item.category);
        } else if (is2025) {
          releases2025.push(item);
          console.log('✅ 2025 encontrado:', item.titulo, '- year:', item.year, 'category:', item.category);
        }
      });

      console.log(`📈 Resultado: ${releases2026.length} filmes 2026, ${releases2025.length} filmes 2025`);

      // Mapear para o formato Lancamento
      const mapMovie = (item: any, category: string): Lancamento => ({
        id: item.id_n?.toString() || item.id?.toString() || `cinema-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: isValidImageUrl(item.capa) ? item.capa : (isValidImageUrl(item.poster) ? item.poster : `https://picsum.photos/seed/fallback-${item.id}/300/450.jpg`),
        backdrop: item.banner || item.backdrop,
        type: 'movie' as const,
        year: item.ano || item.year || category,
        rating: item.rating,
        category: category,
        description: item.description || item.description,
        duration: item.duration,
        userId: userId,
        lastLoaded: new Date().toISOString(),
      });

      const filmes2026 = releases2026.map(item => mapMovie(item, 'Lançamento 2026'));
      const filmes2025 = releases2025.map(item => mapMovie(item, 'Lançamento 2025'));

      // Combinar e embaralhar: pegar até 5 aleatórios
      const allReleases = [...filmes2026, ...filmes2025];
      
      // Remover duplicados (filmes que estão em ambas categorias)
      const uniqueReleases = allReleases.filter((movie, index, self) =>
        index === self.findIndex((m) => m.id === movie.id)
      );
      
      // Embaralhar (Fisher-Yates)
      for (let i = uniqueReleases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueReleases[i], uniqueReleases[j]] = [uniqueReleases[j], uniqueReleases[i]];
      }
      
      // Pegar 5 aleatórios
      const combined = uniqueReleases.slice(0, 5);
      
      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify(combined));
      localStorage.setItem(timestampKey, Date.now().toString());
      
      setLancamentos(combined);
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      setError('Erro ao carregar lançamentos');
      console.error('Error loading lançamentos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    await fetchLancamentos(true);
  }, [fetchLancamentos]);

  // Carregar na montagem
  useEffect(() => {
    fetchLancamentos();
  }, []);

  // Recarregar quando o usuário mudar
  useEffect(() => {
    if (previousUserId.current !== userId) {
      previousUserId.current = userId;
      fetchLancamentos(true);
    }
  }, [userId, fetchLancamentos]);

  return {
    lancamentos,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
};

export default useLancamentos;
