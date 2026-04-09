import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';

interface BannerContent {
  id: string;
  title: string;
  poster: string;
  year: string;
  description?: string;
  trailer?: string;
}

interface PremiumHeroBannerProps {
  contentType?: 'movies' | 'series';
  onPlay?: (item: any) => void;
  onTrailer?: (item: any) => void;
  onMyList?: (item: any) => void;
}

const PremiumHeroBanner: React.FC<PremiumHeroBannerProps> = ({ 
  contentType = 'series',
  onPlay,
  onTrailer,
  onMyList
}) => {
  const [allPosters, setAllPosters] = useState<BannerContent[]>([]);
  const [displayQueue, setDisplayQueue] = useState<BannerContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();
  const { openPlayer } = usePlayer();

  // Buscar posters da tabela correta baseado no contentType
  const fetchPosters = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (contentType === 'movies') {
        // Buscar posters da tabela cinema
        const { data, error } = await supabase
          .from('cinema')
          .select('id, titulo, poster, year, description, trailer')
          .not('poster', 'is', null)
          .not('poster', 'eq', '');

        if (error) {
          console.error('Erro ao buscar posters de filmes:', error);
          setIsLoading(false);
          return;
        }

        const uniquePosters = (data || [])
          .filter((item: any, index: number, self: any[]) => 
            index === self.findIndex((t) => t.poster === item.poster)
          )
          .map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            title: item.titulo || 'Sem título',
            poster: item.poster,
            year: item.year?.toString() || '',
            description: item.description || '',
            trailer: item.trailer || ''
          }));

        setAllPosters(uniquePosters);
        // Shuffle initial queue
        setDisplayQueue([...uniquePosters].sort(() => Math.random() - 0.5));
      } else {
        // Buscar banners da tabela series (mantém banner para séries)
        const { data, error } = await supabase
          .from('series')
          .select('id_n, titulo, banner, ano, descricao')
          .not('banner', 'is', null)
          .not('banner', 'eq', '');

        if (error) {
          console.error('Erro ao buscar banners:', error);
          setIsLoading(false);
          return;
        }

        const uniqueBanners = (data || [])
          .filter((item: any, index: number, self: any[]) => 
            index === self.findIndex((t) => t.banner === item.banner)
          )
          .map((item: any) => ({
            id: item.id_n?.toString() || item.id?.toString() || Math.random().toString(),
            title: item.titulo || 'Sem título',
            poster: item.banner,
            year: item.ano?.toString() || '',
            description: item.descricao || ''
          }));

        setAllPosters(uniqueBanners);
        setDisplayQueue([...uniqueBanners].sort(() => Math.random() - 0.5));
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
        // Se chegou ao fim, reembaralha e reinicia
        if (nextIndex >= displayQueue.length) {
          setDisplayQueue([...allPosters].sort(() => Math.random() - 0.5));
          return 0;
        }
        return nextIndex;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [displayQueue.length, allPosters]);

  const handlePlay = () => {
    const current = displayQueue[currentIndex];
    if (!current) {
      console.error('[PremiumHeroBanner] Nenhum item selecionado');
      return;
    }
    
    console.log('[PremiumHeroBanner] handlePlay:', current);
    
    if (onPlay) {
      onPlay(current);
    } else {
      // Navegar para página de detalhes com base no tipo
      const route = contentType === 'movies' ? '/filmes' : '/series';
      window.location.href = `${route}/${current.id}`;
    }
  };

  const handleTrailer = () => {
    const current = displayQueue[currentIndex];
    if (!current) {
      console.error('[PremiumHeroBanner] Nenhum item selecionado para trailer');
      return;
    }
    
    console.log('[PremiumHeroBanner] handleTrailer:', current);
    
    if (onTrailer && current) {
      onTrailer(current);
    } else if (current?.trailer) {
      window.open(current.trailer, '_blank', 'noopener,noreferrer');
    } else {
      // Se não tem trailer, navega para detalhes
      const route = contentType === 'movies' ? '/filmes' : '/series';
      window.location.href = `${route}/${current.id}`;
    }
  };

  const handleMyList = () => {
    const current = displayQueue[currentIndex];
    if (!current) {
      console.error('[PremiumHeroBanner] Nenhum item selecionado para Minha Lista');
      return;
    }
    
    console.log('[PremiumHeroBanner] handleMyList:', current);
    
    if (onMyList && current) {
      onMyList(current);
    } else {
      // Fallback: navegar para página de detalhes
      const route = contentType === 'movies' ? '/filmes' : '/series';
      window.location.href = `${route}/${current.id}`;
    }
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-[70vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (displayQueue.length === 0) {
    return (
      <div className="relative w-full h-[70vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Nenhum poster disponível</div>
      </div>
    );
  }

  const currentBanner = displayQueue[currentIndex];

  return (
    <div className="relative w-full h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh] 2xl:h-[95vh] min-h-[450px] max-h-[1000px] overflow-hidden bg-black">
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
          {/* Imagem do Poster */}
          <img
            src={currentBanner.poster}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Conteúdo do Banner */}
      <div className="relative z-10 h-full flex items-end sm:items-center pb-8 sm:pb-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                {currentBanner.title}
              </h1>
              
              {currentBanner.year && (
                <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-2 sm:mb-4">
                  {currentBanner.year}
                </p>
              )}

              {currentBanner.description && (
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 line-clamp-2">
                  {currentBanner.description}
                </p>
              )}

              <div className="flex gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={handlePlay}
                  className="bg-white text-black px-6 py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-200 transition-colors"
                >
                  Assistir
                </button>
                
                <button
                  onClick={handleTrailer}
                  title="Trailer"
                  className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-semibold hover:bg-white/30 transition-colors"
                >
                  <Play size={20} />
                  <span className="hidden sm:inline ml-2">Trailer</span>
                </button>

                <button
                  onClick={handleMyList}
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-white/30 transition-colors"
                >
                  Minha Lista
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PremiumHeroBanner;
