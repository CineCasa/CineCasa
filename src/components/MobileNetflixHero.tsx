import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Info, Check, ThumbsUp, ThumbsDown, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { toast } from 'sonner';

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
  const [isInList, setIsInList] = useState(false);
  const { openPlayer } = usePlayer();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true);
      const tableName = contentType === 'movies' ? 'cinema' : 'series';
      console.log(`[MobileNetflixHero] Buscando dados da tabela: ${tableName}`);

      const { data, error } = await supabase
        .from(tableName)
        .select('id, titulo, poster, year, description, trailer, rating, genero')
        .not('poster', 'is', null)
        .not('poster', 'eq', '');

      if (error) {
        console.error('[MobileNetflixHero] Erro Supabase:', error);
        return;
      }

      console.log(`[MobileNetflixHero] Dados retornados: ${data?.length || 0} itens`);

      if (data && data.length > 0) {
        const withPosters = data.filter(item => item.poster && item.poster.trim() !== '');
        console.log(`[MobileNetflixHero] Itens com poster válido: ${withPosters.length}`);

        const transformed: BannerContent[] = withPosters.map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster,
          year: item.year?.toString() || '',
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

  useEffect(() => {
    if (displayQueue[currentIndex]) {
      const item = displayQueue[currentIndex];
      setIsInList(isFavorite(parseInt(item.id), contentType === 'movies' ? 'movie' : 'series'));
    }
  }, [currentIndex, displayQueue, isFavorite, contentType]);

  const handleToggleList = async () => {
    if (!currentBanner) return;
    try {
      const contentTypeStr = contentType === 'movies' ? 'movie' : 'series';
      await toggleFavorite(parseInt(currentBanner.id), currentBanner.title, currentBanner.poster, contentTypeStr);
      setIsInList(!isInList);
      toast.success(!isInList ? 'Adicionado à Minha Lista' : 'Removido da Minha Lista');
    } catch (error) { console.error(error); }
  };

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
    <div className="relative w-full h-[70vh] bg-black overflow-hidden">
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
                style={{ objectPosition: 'center 10%' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </motion.div>
        </AnimatePresence>
        {/* Content Section - Netflix style overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-20 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
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

            {/* Action Buttons Row - Netflix Mobile Style */}
            <div className="flex items-center justify-start gap-2 mb-4 flex-wrap">
              {/* Play Button */}
              <button
                onClick={() => openPlayer(currentBanner.id, currentBanner.title, currentBanner.trailer || '')}
                className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-gray-200 text-black rounded-md font-semibold text-sm transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Assistir</span>
              </button>
              
              {/* Trailer Button */}
              <button
                onClick={() => currentBanner.trailer && openPlayer(currentBanner.id, currentBanner.title, currentBanner.trailer)}
                disabled={!currentBanner.trailer}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:text-gray-500 text-white rounded-md font-medium text-sm transition-all active:scale-95"
              >
                <Film className="w-4 h-4" />
                <span>Trailer</span>
              </button>
              
              {/* My List Button - Icon only */}
              <button
                onClick={handleToggleList}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-400 text-gray-300 hover:text-white hover:border-white transition-colors"
              >
                {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
              
              {/* Like Button */}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-400 text-gray-300 hover:text-green-400 hover:border-green-400 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              
              {/* Dislike Button */}
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-400 text-gray-300 hover:text-red-400 hover:border-red-400 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileNetflixHero;
