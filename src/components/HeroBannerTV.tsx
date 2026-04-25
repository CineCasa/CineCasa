import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Star, Clock, Calendar, Globe } from 'lucide-react';
import { useSmartTVHero } from '@/hooks/useSmartTVHero';
import { tmdbImageUrl } from '@/services/tmdb';

// Helper para converter código de país para emoji de bandeira
const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌐';
  const code = countryCode.toUpperCase();
  if (code.length === 2) {
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
  }
  return '🌐';
};

// Helper para cor da classificação etária
const getRatingColor = (rating?: string): string => {
  if (!rating) return 'bg-gray-500';
  switch (rating.toUpperCase()) {
    case 'L': return 'bg-green-500';
    case '10': return 'bg-blue-500';
    case '12': return 'bg-yellow-500';
    case '14': return 'bg-orange-500';
    case '16': return 'bg-red-500';
    case '18': return 'bg-red-700';
    default: return 'bg-gray-500';
  }
};

export function HeroBannerTV() {
  const { currentItem, nextItem, isLoading } = useSmartTVHero();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [focusedButton, setFocusedButton] = useState<'play' | 'info'>('play');
  const navigate = useNavigate();

  // Navegação via teclado/controle remoto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedButton(prev => prev === 'play' ? 'info' : 'play');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedButton === 'play' && currentItem) {
          handlePlay();
        } else if (focusedButton === 'info' && currentItem) {
          handleInfo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedButton, currentItem]);

  const handlePlay = useCallback(() => {
    if (!currentItem) return;
    const type = currentItem.type === 'movie' ? 'cinema' : 'series';
    navigate(`/watch/${type}/${currentItem.id}`);
  }, [currentItem, navigate]);

  const handleInfo = useCallback(() => {
    if (!currentItem) return;
    const type = currentItem.type === 'movie' ? 'cinema' : 'series';
    navigate(`/details/${type}/${currentItem.id}`);
  }, [currentItem, navigate]);

  // Transição suave ao mudar item
  useEffect(() => {
    if (currentItem) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentItem?.id]);

  // Pré-carregar próxima imagem
  useEffect(() => {
    if (nextItem?.backdrop) {
      const img = new Image();
      img.src = tmdbImageUrl(nextItem.backdrop, 'original');
    }
  }, [nextItem]);

  if (isLoading || !currentItem) {
    return (
      <div className="hidden lg:block w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbImageUrl(currentItem.backdrop, 'original');
  const ratingColor = getRatingColor(currentItem.contentRating);
  const countryFlag = getCountryFlag(currentItem.country);

  return (
    <div className="hidden lg:block relative w-full h-screen overflow-hidden">
      {/* Background Image com Ken Burns effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <div
            className="w-full h-full"
            style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
            }}
          >
            <img
              src={backdropUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover object-[center_40%]"
              style={{ 
                imageRendering: 'high-quality',
                WebkitImageRendering: 'crisp-edges'
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Gradientes de máscara para fusão perfeita */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 60%, #000000 100%)'
        }}
      />

      {/* Glow neon sutil nas bordas */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0, 229, 255, 0.1)'
        }}
      />

      {/* Conteúdo Principal */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-8 xl:px-16 pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-2xl"
            >
              {/* Badge de Novidade */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <span className="px-3 py-1 bg-[#00E5FF] text-black text-sm font-bold rounded">
                  NOVO
                </span>
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-2xl">{countryFlag}</span>
                  <span className="text-sm uppercase tracking-wider">{currentItem.country || 'Internacional'}</span>
                </div>
              </motion.div>

              {/* Título */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl xl:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl"
                style={{
                  textShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 80px rgba(0,0,0,0.4)'
                }}
              >
                {currentItem.title}
              </motion.h1>

              {/* Metadados */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 mb-4 text-white/90"
              >
                {/* Ano */}
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-[#00E5FF]" />
                  <span className="font-semibold">{currentItem.year}</span>
                </div>

                {/* Separador */}
                <span className="w-1 h-1 bg-white/50 rounded-full" />

                {/* Duração/Temporadas */}
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#00E5FF]" />
                  <span className="font-semibold">
                    {currentItem.type === 'movie' 
                      ? currentItem.duration || '2h 15min'
                      : `${currentItem.seasons || 1} Temporada${currentItem.seasons !== 1 ? 's' : ''}`
                    }
                  </span>
                </div>

                {/* Separador */}
                <span className="w-1 h-1 bg-white/50 rounded-full" />

                {/* Nota */}
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-[#00E5FF] fill-[#00E5FF]" />
                  <span className="font-semibold text-[#00E5FF]">{currentItem.rating}</span>
                </div>

                {/* Separador */}
                <span className="w-1 h-1 bg-white/50 rounded-full" />

                {/* Classificação Etária */}
                <span className={`px-2 py-0.5 ${ratingColor} text-white text-xs font-bold rounded`}>
                  {currentItem.contentRating || '14'}
                </span>
              </motion.div>

              {/* Gêneros */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {currentItem.genre.slice(0, 3).map((g, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-sm rounded-full border border-white/20"
                  >
                    {g}
                  </span>
                ))}
              </motion.div>

              {/* Sinopse - limitada a 2 linhas */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-white/80 mb-8 leading-relaxed line-clamp-2"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentItem.description}
              </motion.p>

              {/* Botões de Ação */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-4"
              >
                {/* Botão Assistir */}
                <button
                  onClick={handlePlay}
                  onFocus={() => setFocusedButton('play')}
                  className={`
                    group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg
                    transition-all duration-300 transform
                    ${focusedButton === 'play' 
                      ? 'bg-[#00E5FF] text-black scale-105 shadow-[0_0_30px_rgba(0,229,255,0.6)]' 
                      : 'bg-white text-black hover:bg-[#00E5FF] hover:scale-105'
                    }
                  `}
                >
                  <Play size={24} fill={focusedButton === 'play' ? 'black' : 'currentColor'} />
                  <span>Assistir</span>
                </button>

                {/* Botão Mais Informações */}
                <button
                  onClick={handleInfo}
                  onFocus={() => setFocusedButton('info')}
                  className={`
                    group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg
                    transition-all duration-300 transform border-2
                    ${focusedButton === 'info'
                      ? 'border-[#00E5FF] text-[#00E5FF] scale-105 shadow-[0_0_30px_rgba(0,229,255,0.4)] bg-white/10'
                      : 'border-white/50 text-white hover:border-[#00E5FF] hover:text-[#00E5FF] hover:bg-white/10'
                    }
                  `}
                >
                  <Info size={24} />
                  <span>Mais Informações</span>
                </button>
              </motion.div>

              {/* Indicador de progresso da rotação */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex items-center gap-2"
              >
                <div className="h-1 w-24 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00E5FF]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 7, ease: 'linear' }}
                    key={currentItem.id}
                  />
                </div>
                <span className="text-white/50 text-sm">Próximo em 7s</span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Indicadores de navegação lateral (dots) */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === 0 ? 'bg-[#00E5FF] h-8' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default HeroBannerTV;
