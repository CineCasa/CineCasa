import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAppLoading } from '@/contexts/AppLoadingContext';

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
  maturityRating?: string;
}

interface MobileNetflixHeroProps {
  contentType?: 'movies' | 'series' | 'all';
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Função para pré-carregar imagens
const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve) => {
        if (!url || url.trim() === '' || url.toLowerCase().includes('none')) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
        // Timeout de segurança
        setTimeout(() => resolve(), 3000);
      })
    )
  );
};

export const MobileNetflixHero: React.FC<MobileNetflixHeroProps> = ({ contentType = 'all' }) => {
  console.log('[MobileNetflixHero] Componente montado, contentType:', contentType);
  const [displayQueue, setDisplayQueue] = useState<BannerContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { setHeroImagesReady } = useAppLoading();

  // Helper to process cinema items
  const processCinemaItems = (data: any[]): BannerContent[] => {
    return data
      .filter(item => item.poster && item.poster.trim() !== '')
      .map(item => ({
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

  // Helper to process series items
  const processSeriesItems = (data: any[]): BannerContent[] => {
    return data
      .filter(item => item.capa && item.capa.trim() !== '')
      .map(item => ({
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

  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true);

      if (contentType === 'all') {
        // Buscar filmes e séries simultaneamente
        console.log('[MobileNetflixHero] Buscando filmes E séries...');
        const [cinemaResult, seriesResult] = await Promise.all([
          supabase
            .from('cinema')
            .select('id, titulo, poster, year, description, trailer, rating, genero')
            .not('poster', 'is', null)
            .not('poster', 'eq', ''),
          supabase
            .from('series')
            .select('id_n, titulo, capa, ano, descricao, genero')
            .not('capa', 'is', null)
            .not('capa', 'eq', '')
        ]);

        console.log('[MobileNetflixHero] Resultados:', {
          cinema: cinemaResult.data?.length,
          series: seriesResult.data?.length
        });

        const cinemaItems = processCinemaItems(cinemaResult.data || []);
        const seriesItems = processSeriesItems(seriesResult.data || []);
        const allItems = [...cinemaItems, ...seriesItems];
        
        console.log(`[MobileNetflixHero] Total combinado: ${allItems.length} (filmes: ${cinemaItems.length}, séries: ${seriesItems.length})`);

        // Embaralhar todos juntos - SEM LIMITE
        const shuffled = shuffleArray(allItems);
        
        // Pré-carregar as imagens antes de mostrar
        console.log('[MobileNetflixHero] Pré-carregando', shuffled.length, 'imagens...');
        const posterUrls = shuffled.map(item => item.poster).filter(url => url && url.trim() !== '');
        await preloadImages(posterUrls.slice(0, 10)); // Pré-carregar apenas as primeiras 10 para performance
        console.log('[MobileNetflixHero] Imagens pré-carregadas!');
        
        setDisplayQueue(shuffled);
        setHeroImagesReady(true);
      } else {
        // Buscar apenas um tipo
        const tableName = contentType === 'movies' ? 'cinema' : 'series';
        console.log(`[MobileNetflixHero] Buscando dados da tabela: ${tableName}`);

        const isSeries = contentType === 'series';
        const posterCol = isSeries ? 'capa' : 'poster';
        const yearCol = isSeries ? 'ano' : 'year';
        const idCol = isSeries ? 'id_n' : 'id';

        const selectCols = isSeries 
          ? `${idCol}, titulo, ${posterCol}, ${yearCol}, trailer, rating, genero`
          : `${idCol}, titulo, ${posterCol}, ${yearCol}, description, trailer, rating, genero`;
        
        const { data, error } = await supabase
          .from(tableName)
          .select(selectCols)
          .not(posterCol, 'is', null)
          .not(posterCol, 'eq', '');

        if (error) {
          console.error('[MobileNetflixHero] Erro Supabase:', error);
          return;
        }

        console.log(`[MobileNetflixHero] Dados retornados: ${data?.length || 0} itens`);

        if (data && data.length > 0) {
          const withPosters = data.filter(item => {
            const poster = isSeries ? item.capa : item.poster;
            return poster && poster.trim() !== '';
          });
          console.log(`[MobileNetflixHero] Itens com poster válido: ${withPosters.length}`);

          const transformed: BannerContent[] = withPosters.map((item: any) => ({
            id: (isSeries ? item.id_n : item.id)?.toString(),
            title: item.titulo,
            poster: isSeries ? item.capa : item.poster,
            year: (isSeries ? item.ano : item.year)?.toString() || '',
            description: item.description,
            trailer: item.trailer,
            rating: item.rating,
            genre: item.genero
          }));
          
          // SEM LIMITE - mostrar todos os itens embaralhados
          const shuffled = shuffleArray(transformed);
          
          console.log('[MobileNetflixHero] Pré-carregando', shuffled.length, 'imagens...');
          const posterUrls = shuffled.map(item => item.poster).filter(url => url && url.trim() !== '');
          await preloadImages(posterUrls.slice(0, 10)); // Pré-carregar apenas as primeiras 10
          console.log('[MobileNetflixHero] Imagens pré-carregadas!');
          
          setDisplayQueue(shuffled);
          setHeroImagesReady(true);
        } else {
          console.warn('[MobileNetflixHero] Nenhum dado retornado do Supabase');
          setHeroImagesReady(true);
        }
      }
    } catch (err) {
      console.error('[MobileNetflixHero] Erro:', err);
      setHeroImagesReady(true);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, setHeroImagesReady]);

  useEffect(() => { fetchPosters(); }, [fetchPosters]);

  useEffect(() => {
    if (displayQueue.length === 0) return;
    const interval = setInterval(() => setCurrentIndex(p => (p + 1) % displayQueue.length), 8000);
    return () => clearInterval(interval);
  }, [displayQueue.length]);

  if (isLoading) return (
    <div className="relative w-full h-[70vh] bg-black flex items-center justify-center z-50">
      <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (displayQueue.length === 0) return (
    <div className="relative w-full h-[70vh] bg-black flex items-center justify-center z-50">
      <p className="text-gray-400 text-sm">Nenhum conteúdo disponível</p>
    </div>
  );

  const currentBanner = displayQueue[currentIndex];
  const typePath = contentType === 'movies' ? 'cinema' : 'series';

  return (
    <div className="relative w-full h-[70vh] bg-black overflow-hidden top-0 z-50">
      {/* Hero Banner - Full height with overlaid content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <div className="w-full h-full bg-neutral-800">
              <img
                src={currentBanner.poster}
                alt={currentBanner.title}
                className="w-full h-full object-cover"
                style={{ objectPosition: 'top center' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </motion.div>
        </AnimatePresence>
        
        {/* Conteúdo - Metadados e descrição apenas (sem botões) */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20 z-20 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none"
            >
              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-2 text-left leading-tight drop-shadow-lg">
                {currentBanner.title}
              </h1>

              {/* Metadata */}
              <div className="flex items-center justify-start gap-2 text-xs text-gray-300 mb-3">
                {currentBanner.year && <span className="text-green-400 font-medium">{currentBanner.year}</span>}
                {currentBanner.rating && (
                  <>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span className="border border-gray-500 px-1 rounded text-[10px]">{currentBanner.rating}</span>
                  </>
                )}
                {currentBanner.genre && (
                  <>
                    <span className="w-1 h-1 bg-gray-500 rounded-full" />
                    <span>{currentBanner.genre}</span>
                  </>
                )}
              </div>

              {/* Description */}
              {currentBanner.description && (
                <p className="text-sm text-gray-300 text-left line-clamp-2 mb-4">
                  {currentBanner.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </div>
  );
};

export default MobileNetflixHero;
