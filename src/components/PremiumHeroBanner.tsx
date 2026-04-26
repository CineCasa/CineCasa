import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabaseClient } from '../lib/supabase';

interface BannerContent {
  id: string;
  title: string;
  poster: string;
  year: string;
  description?: string;
  trailer?: string;
  rating?: string;
  genre?: string;
  duration?: string;
  country?: string;
}

// Fisher-Yates shuffle algorithm for better randomization
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to convert country code to flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) return '🌍';
  const code = countryCode.toUpperCase();
  // If it's already a flag emoji or longer than 2 chars, return as is
  if (code.length > 2) {
    // Try to match common country names to codes
    const countryMap: Record<string, string> = {
      'USA': 'US', 'UNITED STATES': 'US', 'ESTADOS UNIDOS': 'US',
      'UK': 'GB', 'UNITED KINGDOM': 'GB', 'REINO UNIDO': 'GB',
      'BRAZIL': 'BR', 'BRASIL': 'BR',
      'FRANCE': 'FR', 'FRANÇA': 'FR',
      'GERMANY': 'DE', 'ALEMANHA': 'DE',
      'ITALY': 'IT', 'ITÁLIA': 'IT',
      'SPAIN': 'ES', 'ESPANHA': 'ES',
      'JAPAN': 'JP', 'JAPÃO': 'JP',
      'CHINA': 'CN',
      'KOREA': 'KR', 'SOUTH KOREA': 'KR',
      'INDIA': 'IN',
      'MEXICO': 'MX', 'MÉXICO': 'MX',
      'ARGENTINA': 'AR',
      'CANADA': 'CA',
      'AUSTRALIA': 'AU',
      'RUSSIA': 'RU', 'RÚSSIA': 'RU',
    };
    const mappedCode = countryMap[code];
    if (!mappedCode) return '🌍';
    return String.fromCodePoint(...[...mappedCode].map(c => 127397 + c.charCodeAt(0)));
  }
  // Convert 2-letter code to flag emoji
  return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
};

interface PremiumHeroBannerProps {
  contentType?: 'movies' | 'series' | 'all';
}

const PremiumHeroBanner: React.FC<PremiumHeroBannerProps> = ({ 
  contentType = 'all'
}) => {
  const [allPosters, setAllPosters] = useState<BannerContent[]>([]);
  const [displayQueue, setDisplayQueue] = useState<BannerContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const supabase = getSupabaseClient();

  // Buscar TODOS os registros com paginação (bypass do limite 1000)
  const fetchAllRecords = async (table: string, select: string, notNullCol: string) => {
    let allData: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .not(notNullCol, 'is', null)
        .not(notNullCol, 'eq', '')
        .range(from, from + limit - 1);

      if (error) {
        console.error(`[PremiumHeroBanner] Erro ao buscar ${table}:`, error);
        break;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += limit;
        hasMore = data.length === limit;
      } else {
        hasMore = false;
      }
    }
    return allData;
  };

  // Buscar posters da tabela correta baseado no contentType
  const fetchPosters = useCallback(async () => {
    console.log('[PremiumHeroBanner] Iniciando fetchPosters, contentType:', contentType);
    try {
      setIsLoading(true);

      // Helper function to process cinema items
      const processCinemaItems = (data: any[]): BannerContent[] => {
        return (data || [])
          .filter((item: any) => item.poster && item.poster.trim() !== '')
          .map((item: any) => ({
            id: `cinema-${item.id?.toString() || Math.random().toString()}`,
            title: item.titulo || 'Sem título',
            poster: item.poster,
            year: item.year?.toString() || '',
            description: item.description || '',
            trailer: item.trailer || '',
            rating: item.rating || '',
            genre: item.genero || ''
          }));
      };

      // Helper function to process series items
      const processSeriesItems = (data: any[]): BannerContent[] => {
        const rawCount = data?.length || 0;
        const withCapa = (data || []).filter((item: any) => item.capa && item.capa.trim() !== '');
        console.log(`[PremiumHeroBanner] Processando séries: ${rawCount} brutas, ${withCapa.length} com capa válida`);
        return withCapa.map((item: any) => ({
          id: `series-${item.id_n?.toString() || Math.random().toString()}`,
          title: item.titulo || 'Sem título',
          poster: item.capa,
          year: item.ano?.toString() || '',
          description: item.descricao || '',
          trailer: '',
          rating: '',
          genre: item.genero || ''
        }));
      };

      if (contentType === 'all') {
        // Buscar filmes e séries com limite para performance
        console.log('[PremiumHeroBanner] Buscando filmes E séries (otimizado)...');
        const [cinemaData, seriesData] = await Promise.all([
          fetchAllRecords('cinema', 'id, titulo, poster, year, description, trailer, rating, genero', 'poster', 100),
          fetchAllRecords('series', 'id_n, titulo, capa, ano, descricao, genero', 'capa', 50)
        ]);

        console.log('[PremiumHeroBanner] Resultados:', {
          cinemaCount: cinemaData?.length,
          seriesCount: seriesData?.length
        });

        // Processar ambos os resultados
        const cinemaItems = processCinemaItems(cinemaData || []);
        const seriesItems = processSeriesItems(seriesData || []);

        // Combinar e limitar itens para performance
        const allItems = [...cinemaItems, ...seriesItems].slice(0, 50);
        console.log('[PremiumHeroBanner] Total combinado (limitado):', allItems.length);

        // Embaralhar todos juntos
        const shuffled = shuffleArray(allItems);
        setAllPosters(allItems);
        setDisplayQueue(shuffled);
        
        // Iniciar em posição aleatória
        const randomStartIndex = shuffled.length > 0 ? Math.floor(Math.random() * shuffled.length) : 0;
        setCurrentIndex(randomStartIndex);
        console.log('[PremiumHeroBanner] Hero pronto:', shuffled.length, 'itens, índice:', randomStartIndex);

      } else if (contentType === 'movies') {
        // Buscar TODOS os filmes (SEM LIMITE)
        console.log('[PremiumHeroBanner] Buscando filmes da tabela cinema (SEM LIMITE)...');
        const cinemaData = await fetchAllRecords('cinema', 'id, titulo, poster, year, description, trailer, rating, genero', 'poster');

        console.log('[PremiumHeroBanner] Total de filmes recebidos:', cinemaData?.length);

        const items = processCinemaItems(cinemaData || []);
        setAllPosters(items);
        const shuffled = shuffleArray(items);
        setDisplayQueue(shuffled);
        const randomStartIndex = shuffled.length > 0 ? Math.floor(Math.random() * shuffled.length) : 0;
        setCurrentIndex(randomStartIndex);
        console.log('[PremiumHeroBanner] Filmes embaralhados:', shuffled.length, 'iniciando em índice:', randomStartIndex);
      } else {
        // Buscar TODAS as séries (SEM LIMITE)
        console.log('[PremiumHeroBanner] Buscando séries (SEM LIMITE)...');
        const seriesData = await fetchAllRecords('series', 'id_n, titulo, capa, ano, descricao, genero', 'capa');

        console.log('[PremiumHeroBanner] Total de séries recebidas:', seriesData?.length);

        const items = processSeriesItems(seriesData || []);
        setAllPosters(items);
        const shuffled = shuffleArray(items);
        setDisplayQueue(shuffled);
        const randomStartIndex = shuffled.length > 0 ? Math.floor(Math.random() * shuffled.length) : 0;
        setCurrentIndex(randomStartIndex);
        console.log('[PremiumHeroBanner] Séries embaralhadas:', shuffled.length, 'iniciando em índice:', randomStartIndex);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Erro:', err);
      setIsLoading(false);
    }
  }, [contentType, supabase]);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Auto-scroll a cada 7 segundos sem repetição
  useEffect(() => {
    if (displayQueue.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // Se chegou ao fim, reembaralha e inicia em posição aleatória
        if (nextIndex >= displayQueue.length) {
          const reshuffled = shuffleArray(allPosters);
          setDisplayQueue(reshuffled);
          const randomIndex = reshuffled.length > 0 ? Math.floor(Math.random() * reshuffled.length) : 0;
          console.log('[PremiumHeroBanner] Reembaralhando no fim da fila, iniciando em índice:', randomIndex, 'título:', reshuffled[randomIndex]?.title);
          return randomIndex;
        }
        return nextIndex;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [displayQueue.length, allPosters]);

  if (isLoading) {
    return (
      <div className="relative w-full aspect-video max-h-[80vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (displayQueue.length === 0) {
    console.log('[PremiumHeroBanner] displayQueue vazio, mostrando estado vazio');
    return (
      <div className="relative w-full aspect-video max-h-[80vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Nenhum poster disponível</div>
      </div>
    );
  }

  const currentBanner = displayQueue[currentIndex];

  return (
    <div className="relative w-full aspect-video max-h-[80vh] overflow-hidden bg-black">
      {/* Posters com transição automática */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Imagem do Poster - responsivo para mobile */}
          <img
            src={currentBanner.poster}
            alt={currentBanner.title}
            className="w-full h-full object-cover sm:object-cover object-contain sm:object-center object-top"
            style={{ objectPosition: 'center top' }}
            onError={(e) => {
              console.error('[PremiumHeroBanner] Erro ao carregar poster:', currentBanner.poster);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Conteúdo - Metadados e descrição apenas (sem botões) */}
      <div className="relative z-10 h-full flex items-end sm:items-center pb-20 sm:pb-0 pointer-events-none">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl pointer-events-none"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 leading-tight break-words whitespace-normal line-clamp-3">
                {currentBanner.title}
              </h1>
              
              {/* Metadados */}
              <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                {/* Nota TMDB */}
                {currentBanner.rating && currentBanner.rating !== "N/A" && (
                  <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs sm:text-sm font-semibold">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
                    </svg>
                    {currentBanner.rating}
                  </span>
                )}
                {/* País com Bandeira */}
                {currentBanner.country && (
                  <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200 flex items-center gap-1">
                    {getCountryFlag(currentBanner.country)} {currentBanner.country}
                  </span>
                )}
                {/* Ano */}
                {currentBanner.year && parseInt(currentBanner.year) > 0 && (
                  <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                    {currentBanner.year}
                  </span>
                )}
                {/* Primeiro gênero */}
                {currentBanner.genre && (
                  <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                    {Array.isArray(currentBanner.genre) ? currentBanner.genre[0] : currentBanner.genre}
                  </span>
                )}
                {/* Duração */}
                {currentBanner.duration && (
                  <span className="bg-white/10 px-2 py-1 rounded text-xs sm:text-sm text-gray-200">
                    ⏱️ {currentBanner.duration}
                  </span>
                )}
              </div>

              {currentBanner.description && (
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 line-clamp-2">
                  {currentBanner.description}
                </p>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default PremiumHeroBanner;
