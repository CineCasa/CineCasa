import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl, fetchTmdbDetails } from '@/services/tmdb';

export interface Serie {
  id: number;
  tmdb_id: string | null;
  titulo: string;
  descricao: string | null;
  ano: string | null;
  capa: string | null;
  banner: string | null;
  trailer: string | null;
  genero: string | null;
  classificacao?: string | null;
  elenco?: string | null;
  diretor?: string | null;
  pais?: string | null;
  backdrop_tmdb?: string | null;
  poster_tmdb?: string | null;
  rating_tmdb?: string | null;
}

export interface Temporada {
  id: number;
  serie_id: number;
  numero_temporada: number;
  titulo?: string;
  capa?: string;
  banner?: string;
}

export interface Episodio {
  id: number;
  temporada_id: number;
  numero_episodio: number;
  titulo: string;
  descricao?: string;
  duracao?: string;
  arquivo?: string;
  imagem_185?: string;
  imagem_342?: string;
  imagem_500?: string;
  banner?: string;
}

interface SeriesByGenre {
  [key: string]: Serie[];
}

export function useSeriesData() {
  const [series, setSeries] = useState<Serie[]>([]);
  const [seriesByGenre, setSeriesByGenre] = useState<SeriesByGenre>({});
  const [heroSerie, setHeroSerie] = useState<Serie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSeries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar todas as séries do banco
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .order('titulo', { ascending: true });

      if (seriesError) {
        throw new Error(`Erro ao buscar séries: ${seriesError.message}`);
      }

      if (!seriesData || seriesData.length === 0) {
        setSeries([]);
        setSeriesByGenre({});
        setHeroSerie(null);
        return;
      }

      // Mapear dados do banco
      let mappedSeries: Serie[] = seriesData.map((s: any) => ({
        id: s.id_n,
        tmdb_id: s.tmdb_id,
        titulo: s.titulo,
        descricao: s.descricao,
        year: s.year || s.ano?.toString(),
        capa: s.capa,
        banner: s.banner,
        trailer: s.trailer,
        genero: s.genero,
        classificacao: s.classificacao,
        elenco: null,
        diretor: null,
        pais: null,
      }));

      // Buscar dados do TMDB para cada série (em batches)
      const seriesWithTmdb = await Promise.all(
        mappedSeries.map(async (serie) => {
          if (!serie.tmdb_id) return serie;
          try {
            const tmdbData = await fetchTmdbDetails(serie.tmdb_id, 'tv');
            if (tmdbData) {
              return {
                ...serie,
                backdrop_tmdb: tmdbData.backdrop_path,
                poster_tmdb: tmdbData.poster_path,
                rating_tmdb: tmdbData.vote_average?.toFixed(1),
                descricao: serie.descricao || tmdbData.overview,
              };
            }
          } catch (e) {
            console.warn(`Erro ao buscar TMDB para série ${serie.id}:`, e);
          }
          return serie;
        })
      );

      setSeries(seriesWithTmdb);

      // Agrupar por gênero
      const grouped: SeriesByGenre = {};
      seriesWithTmdb.forEach((serie) => {
        if (serie.genero) {
          const genres = serie.genero.split(',').map(g => g.trim()).filter(g => g.length > 0);
          genres.forEach((genre) => {
            if (!grouped[genre]) {
              grouped[genre] = [];
            }
            // Evitar duplicatas na mesma categoria
            if (!grouped[genre].find(s => s.id === serie.id)) {
              grouped[genre].push(serie);
            }
          });
        }
      });

      setSeriesByGenre(grouped);

      // Selecionar série aleatória para o hero
      if (seriesWithTmdb.length > 0) {
        const randomIndex = Math.floor(Math.random() * seriesWithTmdb.length);
        setHeroSerie(seriesWithTmdb[randomIndex]);
      }

    } catch (err) {
      console.error('Erro em useSeriesData:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  useEffect(() => {
    fetchAllSeries();
  }, [fetchAllSeries]);

  const getFirstEpisode = useCallback(async (serieId: number): Promise<Episodio | null> => {
    try {
      // Buscar temporadas da série
      const { data: tempsData, error: tempsError } = await supabase
        .from('temporadas')
        .select('*')
        .eq('serie_id', serieId)
        .order('numero_temporada', { ascending: true })
        .limit(1);

      if (tempsError || !tempsData || tempsData.length === 0) {
        return null;
      }

      const primeiraTemporada = tempsData[0];

      // Buscar primeiro episódio da temporada
      const { data: epsData, error: epsError } = await supabase
        .from('episodios')
        .select('*')
        .eq('temporada_id', primeiraTemporada.id)
        .order('numero_episodio', { ascending: true })
        .limit(1);

      if (epsError || !epsData || epsData.length === 0) {
        return null;
      }

      const ep = epsData[0];
      return {
        id: ep.id,
        temporada_id: ep.temporada_id,
        numero_episodio: ep.numero_episodio,
        titulo: ep.titulo,
        descricao: ep.descricao,
        duracao: ep.duracao,
        arquivo: ep.arquivo,
        imagem_185: ep.imagem_185,
        imagem_342: ep.imagem_342,
        imagem_500: ep.imagem_500,
        banner: ep.banner,
      };
    } catch (err) {
      console.error('Erro ao buscar primeiro episódio:', err);
      return null;
    }
  }, []);

  const getAllGenres = useCallback((): string[] => {
    return Object.keys(seriesByGenre).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [seriesByGenre]);

  return {
    series,
    seriesByGenre,
    heroSerie,
    isLoading,
    error,
    getFirstEpisode,
    getAllGenres,
    refetch: fetchAllSeries,
  };
}
