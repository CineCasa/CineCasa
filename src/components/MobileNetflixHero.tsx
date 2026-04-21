import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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
  contentType?: 'movies' | 'series';
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const MobileNetflixHero: React.FC<MobileNetflixHeroProps> = ({ contentType = 'series' }) => {
  console.log('[MobileNetflixHero] Componente montado, contentType:', contentType);
  const [displayQueue, setDisplayQueue] = useState<BannerContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true);
      const tableName = contentType === 'movies' ? 'cinema' : 'series';
      console.log(`[MobileNetflixHero] Buscando dados da tabela: ${tableName}`);

      // Séries usam colunas diferentes (capa, ano, id_n)
      const isSeries = contentType === 'series';
      const posterCol = isSeries ? 'capa' : 'poster';
      const yearCol = isSeries ? 'ano' : 'year';
      const idCol = isSeries ? 'id_n' : 'id';

      const { data, error } = await supabase
        .from(tableName)
        .select(`${idCol}, titulo, ${posterCol}, ${yearCol}, description, trailer, rating, genero`)
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
        setDisplayQueue(shuffleArray(transformed).slice(0, 20));
      } else {
        console.warn('[MobileNetflixHero] Nenhum dado retornado do Supabase');
      }
    } catch (err) {
      console.error('[MobileNetflixHero] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contentType]);

  useEffect(() => { fetchPosters(); }, [fetchPosters]);

  useEffect(() => {
    if (displayQueue.length === 0) return;
    const interval = setInterval(() => setCurrentIndex(p => (p + 1) % displayQueue.length), 8000);
    return () => clearInterval(interval);
  }, [displayQueue.length]);

  if (isLoading) return (
    <div className="relative w-full h-[60vh] bg-neutral-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (displayQueue.length === 0) return (
    <div className="relative w-full h-[60vh] bg-neutral-900 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Nenhum conteúdo disponível</p>
    </div>
  );

  const currentBanner = displayQueue[currentIndex];
  const typePath = contentType === 'movies' ? 'cinema' : 'series';

  return (
    <div className="relative w-full h-[70vh] bg-black overflow-hidden top-0">
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
