import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Info, Check } from 'lucide-react';
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
      const { data, error } = await supabase
        .from(contentType === 'movies' ? 'cinema' : 'series')
        .select('id, titulo, poster, year, description, trailer, rating, genero, duration, maturity_rating')
        .not('poster', 'is', null).not('poster', 'eq', '');
      if (error) return;
      if (data && data.length > 0) {
        const transformed: BannerContent[] = data.map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster,
          year: item.year?.toString() || '',
          description: item.description,
          trailer: item.trailer,
          rating: item.rating,
          genre: item.genero,
          duration: item.duration,
          maturityRating: item.maturity_rating
        }));
        setDisplayQueue(shuffleArray(transformed).slice(0, 20));
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
    <div className="relative w-full bg-black">
      {/* Poster Image */}
      <div className="relative w-full h-[65vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img
              src={currentBanner.poster}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center"
              style={{ objectPosition: 'center 15%' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="relative -mt-24 px-4 pb-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-2 text-center leading-tight drop-shadow-lg">
              {currentBanner.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-300 mb-3">
              {currentBanner.year && <span>{currentBanner.year}</span>}
              {currentBanner.maturityRating && (
                <>
                  <span className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span className="border border-gray-500 px-1 rounded text-[10px]">{currentBanner.maturityRating}</span>
                </>
              )}
              {currentBanner.duration && (
                <>
                  <span className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span>{currentBanner.duration}</span>
                </>
              )}
            </div>

            {/* Action Buttons - Netflix Style */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Play Button */}
              <button
                onClick={() => openPlayer(currentBanner.id, currentBanner.title, currentBanner.trailer || '')}
                className="flex items-center gap-2 px-8 py-2.5 bg-white hover:bg-gray-200 text-black rounded-md font-semibold text-sm transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Assistir</span>
              </button>
              
              {/* My List Button */}
              <button
                onClick={handleToggleList}
                className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  {isInList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <span className="text-[10px]">Minha Lista</span>
              </button>
              
              {/* Info Button */}
              <button
                onClick={() => navigate(`/${typePath}/${currentBanner.id}`)}
                className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors"
              >
                <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <span className="text-[10px]">Saiba mais</span>
              </button>
            </div>

            {/* Description */}
            {currentBanner.description && (
              <p className="text-sm text-gray-300 text-center line-clamp-2 px-2">
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
