import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Calendar, Film } from 'lucide-react';
import { useCinemaHero } from '@/hooks/useCinemaHero';
import { tmdbImageUrl } from '@/services/tmdb';

// Helper para bandeira do país
const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌐';
  const code = countryCode.toUpperCase();
  if (code.length === 2) {
    return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
  }
  return '🌐';
};

// Helper para cor da classificação
const getRatingColor = (rating?: string): string => {
  if (!rating) return 'bg-gray-500/80';
  switch (rating.toUpperCase()) {
    case 'L': return 'bg-green-500/80';
    case '10': return 'bg-blue-500/80';
    case '12': return 'bg-yellow-500/80';
    case '14': return 'bg-orange-500/80';
    case '16': return 'bg-red-500/80';
    case '18': return 'bg-red-700/80';
    default: return 'bg-gray-500/80';
  }
};

export function CinemaHeroBanner() {
  const { currentItem, isLoading } = useCinemaHero();
  const prevItemRef = useRef(currentItem);

  useEffect(() => {
    prevItemRef.current = currentItem;
  }, [currentItem]);

  if (isLoading || !currentItem) {
    return (
      <div className="w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isValidImageUrl = (url: string): boolean => {
    return !!url && url.startsWith('http') && !url.includes('undefined') && !url.includes('null');
  };

  const backdropUrl = isValidImageUrl(currentItem.backdrop) 
    ? currentItem.backdrop 
    : `https://placehold.co/1920x1080/1a1a2e/4a5568?text=${encodeURIComponent(currentItem.title?.charAt(0).toUpperCase() || 'C')}`;
  const countryFlag = getCountryFlag(currentItem.country);
  const ratingColor = getRatingColor(currentItem.contentRating);

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-screen overflow-hidden">
      {/* Background com Cross-Fade de 1.5s */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <motion.img
            src={backdropUrl}
            alt={currentItem.title}
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 7, ease: 'linear' }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('placehold.co')) {
                img.src = `https://placehold.co/1920x1080/1a1a2e/4a5568?text=${encodeURIComponent(currentItem.title?.charAt(0).toUpperCase() || 'C')}`;
              }
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Máscaras de gradiente para fusão perfeita */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 50%, #000000 100%)'
        }}
      />

      {/* Conteúdo Principal */}
      <div className="absolute inset-0 flex items-end pb-8 sm:pb-12 md:pb-16 lg:pb-24">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-16 xl:px-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-3xl"
            >
              {/* Badge NOVO + Bandeira */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="flex items-center gap-4 mb-5"
              >
                <span className="px-4 py-1.5 bg-[#00E5FF] text-black text-sm font-black uppercase tracking-wider rounded">
                  Novo
                </span>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-2xl">{countryFlag}</span>
                  <span className="text-sm font-medium uppercase tracking-wide">{currentItem.country || 'Internacional'}</span>
                </div>
              </motion.div>

              {/* Título com drop-shadow preto */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black text-white mb-3 sm:mb-4 md:mb-6 leading-tight tracking-tight"
                style={{
                  textShadow: '4px 4px 20px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.6), 0 0 100px rgba(0,0,0,0.4)'
                }}
              >
                {currentItem.title}
              </motion.h1>

              {/* Bloco de Informações Premium */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 mb-3 sm:mb-4 md:mb-5 text-white/95 flex-wrap"
              >
                {/* Ano */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Calendar size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-[#00E5FF]" />
                  <span className="font-bold text-sm sm:text-base md:text-lg">{currentItem.year}</span>
                </div>

                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />

                {/* Duração */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-[#00E5FF]" />
                  <span className="font-bold text-sm sm:text-base md:text-lg">{currentItem.duration || '2h 15min'}</span>
                </div>

                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />

                {/* Gênero */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Film size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] text-[#00E5FF]" />
                  <span className="font-bold text-sm sm:text-base md:text-lg">{currentItem.genre[0] || 'Ação'}</span>
                </div>

                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />

                {/* Nota com estrela ciano neon */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <Star size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-[#00E5FF] fill-[#00E5FF]" style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.8))' }} />
                  <span className="font-bold text-base sm:text-lg md:text-xl text-[#00E5FF]" style={{ textShadow: '0 0 20px rgba(0,229,255,0.6)' }}>
                    {currentItem.rating}
                  </span>
                </div>

                <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />

                {/* Classificação Etária */}
                <span 
                  className={`px-2 py-0.5 sm:px-3 sm:py-1 ${ratingColor} text-white text-xs sm:text-sm font-black rounded-lg border border-white/20`}
                  style={{ boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}
                >
                  {currentItem.contentRating || '14'}
                </span>
              </motion.div>

              {/* Gêneros adicionais */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6"
              >
                {currentItem.genre.slice(1, 4).map((g, i) => (
                  <span 
                    key={i}
                    className="px-2 sm:px-4 py-1 sm:py-1.5 bg-white/10 backdrop-blur-md text-white/85 text-xs sm:text-sm font-medium rounded-full border border-white/10"
                  >
                    {g}
                  </span>
                ))}
              </motion.div>

              {/* Sinopse - exatamente 2 linhas com ellipsis */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textShadow: '2px 2px 10px rgba(0,0,0,0.8)'
                }}
              >
                {currentItem.description}
              </motion.p>

              {/* Indicador de progresso */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-6 sm:mt-8 md:mt-10 flex items-center gap-2 sm:gap-3"
              >
                <div className="h-1 w-24 sm:w-28 md:w-32 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00E5FF]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 7, ease: 'linear' }}
                    key={currentItem.id}
                  />
                </div>
                <span className="text-white/40 text-xs sm:text-sm font-medium">Próximo em 7s</span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Indicadores laterais - escondido em mobile */}
      <div className="hidden md:flex absolute right-4 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 flex-col gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-500 ${
              i === 0 ? 'bg-[#00E5FF] h-6 sm:h-10' : 'bg-white/20 h-1.5 sm:h-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default CinemaHeroBanner;
