import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OscarWinner {
  id: string;
  tmdbId: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  oscarYear?: string;
  award?: string;
}

// TMDB IDs de filmes vencedores do Oscar de Melhor Filme desde 2000
// Lista curada dos verdadeiros vencedores do Academy Award
const OSCAR_BEST_PICTURE_WINNERS = [
  '872585',   // Oppenheimer (2024)
  '505642',   // Everything Everywhere All at Once (2023)
  '776503',   // CODA (2022)
  '583406',   // Nomadland (2021)
  '530426',   // Parasite (2020)
  '490132',   // Green Book (2019)
  '359940',   // The Shape of Water (2018)
  '376867',   // Moonlight (2017)
  '314365',   // Spotlight (2016)
  '205775',   // Birdman (2015)
  '76203',    // 12 Years a Slave (2014)
  '61979',    // Argo (2013)
  '74643',    // The Artist (2012)
  '45269',    // The King's Speech (2011)
  '12107',    // The Hurt Locker (2010)
  '12405',    // Slumdog Millionaire (2009)
  '7345',     // No Country for Old Men (2008)
  '1640',     // The Departed (2007)
  '142',      // Crash (2006)
  '1644',     // Million Dollar Baby (2005)
  '453',      // The Lord of the Rings: The Return of the King (2004)
  '2216',     // Chicago (2003)
  '424',      // A Beautiful Mind (2002)
  '1577',     // Gladiator (2001)
  '1934',     // American Beauty (2000)
];

// Palavras-chave para buscar filmes premiados
const AWARD_KEYWORDS = [
  'oscar', 'academy award', 'winner', 'premiado', 'melhor filme',
  'best picture', 'golden globe', 'bafta', 'critics choice'
];

export const useOscarWinners = () => {
  const [oscarWinners, setOscarWinners] = useState<OscarWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOscarWinners = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[useOscarWinners] Buscando vencedores do Oscar 2000+...');

      // Estratégia 1: Buscar por TMDB IDs conhecidos de vencedores
      const batchSize = 20;
      const moviePromises = [];
      
      for (let i = 0; i < OSCAR_BEST_PICTURE_WINNERS.length; i += batchSize) {
        const batch = OSCAR_BEST_PICTURE_WINNERS.slice(i, i + batchSize);
        moviePromises.push(
          supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, poster, year, rating, genero, description, category')
            .in('tmdb_id', batch)
            .gte('year', '2000')
        );
      }

      // Estratégia 2: Buscar filmes com rating >= 8.0 e palavras-chave de prêmios
      const oscarKeywords = AWARD_KEYWORDS.map(kw => 
        `genero.ilike.%${kw}%,titulo.ilike.%${kw}%,description.ilike.%${kw}%,category.ilike.%${kw}%`
      ).join(',');

      const [knownWinnersResult, ...additionalResults] = await Promise.all([
        ...moviePromises,
        // Busca adicional por filmes de alta qualidade com palavras-chave
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, description, category')
          .gte('year', '2000')
          .gte('rating', '8.5')
          .or(`(${oscarKeywords})`)
          .limit(30),
        // Busca em séries também - usar apenas genero (category nao existe)
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, banner, ano, genero, descricao')
          .ilike('genero', '%documentario%')
          .not('banner', 'is', null)
          .limit(30)
      ]);

      // Combinar todos os resultados
      const allMovies: any[] = [];
      
      // Adicionar filmes conhecidos
      if (knownWinnersResult && knownWinnersResult.data) {
        allMovies.push(...knownWinnersResult.data);
      }
      
      // Adicionar resultados adicionais
      additionalResults.forEach(result => {
        if (result && result.data) {
          allMovies.push(...result.data);
        }
      });

      console.log('[useOscarWinners] Total encontrado:', allMovies.length);

      // Processar e formatar filmes
      const processedWinners: OscarWinner[] = allMovies
        .map((item: any) => ({
          id: item.id?.toString() || item.id_n?.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster || '/api/placeholder/300/450', // Fallback para poster
          type: (item.ano ? 'series' : 'movie') as 'movie' | 'series',
          year: item.year || item.ano,
          rating: item.rating || 'N/A', // Fallback para rating
          oscarYear: item.year || item.ano,
          award: 'Oscar Winner',
        }))
        .filter(item => item.id && item.tmdbId); // Remover inválidos

      // Remover duplicados baseado no tmdbId
      const uniqueWinners = processedWinners.filter((item, index, self) =>
        index === self.findIndex((t) => t.tmdbId === item.tmdbId)
      );
      
      console.log('[useOscarWinners] Únicos após filtro:', uniqueWinners.length);
      console.log('[useOscarWinners] Filmes encontrados:', uniqueWinners.map(s => `${s.title} (${s.year})`));

      // Se não tivermos 5 vencedores, buscar filmes de alta qualidade (rating >= 8.5) como fallback
      if (uniqueWinners.length < 5) {
        console.log('[useOscarWinners] Buscando filmes adicionais de alta qualidade...');
        const { data: highRatedMovies, error: highRatedError } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating')
          .gte('rating', '8.0')
          .not('tmdb_id', 'in', `(${uniqueWinners.map(w => w.tmdbId).join(',')})`)
          .limit(10);

        if (highRatedMovies) {
          const additionalMovies: OscarWinner[] = highRatedMovies
            .map((item: any) => ({
              id: item.id?.toString(),
              tmdbId: item.tmdb_id?.toString() || '',
              title: item.titulo,
              poster: item.poster,
              type: 'movie' as const,
              year: item.year?.toString() || 'N/A',
              rating: item.rating || 'N/A',
              oscarYear: item.year?.toString(),
              award: 'Acclaimed Film',
            }))
            .filter(item => item.id && item.tmdbId && item.poster);

          uniqueWinners.push(...additionalMovies);
        }
      }

      // Fisher-Yates shuffle para randomização a cada reinício
      const shuffled = [...uniqueWinners];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Retornar TODOS os vencedores (sem limite)
      setOscarWinners(shuffled);
    } catch (err) {
      console.error('[useOscarWinners] Erro ao buscar vencedores:', err);
      setOscarWinners([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOscarWinners();
  }, [fetchOscarWinners]);

  return { oscarWinners, isLoading, refetch: fetchOscarWinners };
};

export default useOscarWinners;
