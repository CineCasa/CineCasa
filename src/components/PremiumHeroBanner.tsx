import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useRatings } from '../hooks/useRatings';
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
  country?: string;
}

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
  contentType?: 'movies' | 'series';
}

const PremiumHeroBanner: React.FC<PremiumHeroBannerProps> = ({ 
  contentType = 'series'
}) => {
  const [allPosters, setAllPosters] = useState<BannerContent[]>([]);
  const [displayQueue, setDisplayQueue] = useState<BannerContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState<'like' | 'dislike' | null>(null);
  const supabase = getSupabaseClient();
  const { openPlayer } = usePlayer();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const { isLiked, isDisliked, toggleRating } = useRatings();

  // Buscar posters da tabela correta baseado no contentType
  const fetchPosters = useCallback(async () => {
    console.log('[PremiumHeroBanner] Iniciando fetchPosters, contentType:', contentType);
    try {
      setIsLoading(true);
      
      if (contentType === 'movies') {
        // Buscar posters da tabela cinema
        console.log('[PremiumHeroBanner] Buscando filmes da tabela cinema...');
        const { data, error } = await supabase
          .from('cinema')
          .select('id, titulo, poster, year, description, trailer, rating, genero, duration')
          .not('poster', 'is', null)
          .not('poster', 'eq', '');

        console.log('[PremiumHeroBanner] Resultado cinema:', { dataLength: data?.length, error });

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
            trailer: item.trailer || '',
            rating: item.rating || '',
            genre: item.genero || '',
            duration: item.duration || ''
          }));

        setAllPosters(uniquePosters);
        // Shuffle inicial - todas as capas em ordem aleatória
        const shuffled = [...uniquePosters].sort(() => Math.random() - 0.5);
        setDisplayQueue(shuffled);
        // Sempre começa do primeiro item (já em ordem aleatória)
        setCurrentIndex(0);
      } else {
        // Buscar banners da tabela series (mantém banner para séries)
        const { data, error } = await supabase
          .from('series')
          .select('id_n, titulo, banner, ano, descricao, genero')
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
            description: item.descricao || '',
            rating: '',
            genre: item.genero || ''
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
          {/* Imagem do Poster - sempre 16:9 cover */}
          <img
            src={currentBanner.poster}
            alt={currentBanner.title}
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: 'center 20%' }}
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

      {/* Conteúdo do Banner */}
      <div className="relative z-10 h-full flex items-end sm:items-center pb-20 sm:pb-0">
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

              {/* Botões de Ação */}
              <div className="flex flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto">
                <button
                  onClick={() => {
                    console.log('[PremiumHeroBanner] Botão Assistir clicado:', { currentBanner, trailer: currentBanner?.trailer });
                    openPlayer(currentBanner.id, currentBanner.title, currentBanner.trailer || '');
                  }}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  <span>Assistir</span>
                </button>
                <button
                  onClick={() => {
                    console.log('[PremiumHeroBanner] Botão Trailer clicado:', { currentBanner, trailer: currentBanner?.trailer });
                    if (currentBanner?.trailer) {
                      openPlayer(currentBanner.id, currentBanner.title, currentBanner.trailer);
                    } else {
                      navigate(`/details/${currentBanner.id}`);
                    }
                  }}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Trailer</span>
                </button>
                
                {/* Ícones de interação - mesma linha */}
                <div className="w-px h-8 bg-white/20 mx-1 sm:mx-2 flex-shrink-0" />
                <button
                  onClick={async () => {
                    if (!currentBanner) return;
                    
                    const contentId = parseInt(currentBanner.id);
                    const contentTypeValue = contentType === 'movies' ? 'movie' : 'series';
                    
                    await toggleFavorite({
                      content_id: contentId,
                      content_type: contentTypeValue,
                      titulo: currentBanner.title,
                      poster: currentBanner.poster,
                      banner: currentBanner.poster,
                      rating: currentBanner.rating,
                      year: parseInt(currentBanner.year),
                      genero: currentBanner.genre
                    });
                  }}
                  disabled={favLoading}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 flex-shrink-0 disabled:opacity-50"
                  title={isFavorite(parseInt(currentBanner?.id || '0'), contentType === 'movies' ? 'movie' : 'series') ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isFavorite(parseInt(currentBanner?.id || '0'), contentType === 'movies' ? 'movie' : 'series') ? 'fill-red-600 text-red-600' : 'text-white'}`} 
                  />
                </button>
                <button
                  onClick={async () => {
                  const current = displayQueue[currentIndex];
                  const contentId = current.id;
                  const typeValue = contentType === 'movies' ? 'movie' : 'series';
                  await toggleRating({
                    content_id: contentId,
                    content_type: typeValue,
                    titulo: current.title,
                    poster: current.poster,
                    banner: current.poster,
                    rating: current.rating
                  }, 'like');
                }}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${isLiked(currentBanner?.id || '', contentType === 'movies' ? 'movie' : 'series') ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Gostei"
                >
                  <ThumbsUp 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isLiked(currentBanner?.id || '', contentType === 'movies' ? 'movie' : 'series') ? 'fill-green-500 text-green-500' : 'text-white'}`} 
                  />
                </button>
                <button
                  onClick={async () => {
                    const current = displayQueue[currentIndex];
                    const contentId = current.id;
                    const type = contentType === 'movies' ? 'movie' : 'series';
                    await toggleRating({
                      content_id: contentId,
                      content_type: type,
                      titulo: current.title,
                      poster: current.poster,
                      banner: current.poster,
                      rating: current.rating
                    }, 'dislike');
                  }}
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${isDisliked(currentBanner?.id || '', contentType === 'movies' ? 'movie' : 'series') ? 'bg-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Não gostei"
                >
                  <ThumbsDown 
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isDisliked(currentBanner?.id || '', contentType === 'movies' ? 'movie' : 'series') ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                  />
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
