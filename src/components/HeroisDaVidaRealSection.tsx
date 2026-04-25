import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
import LazyCard from './LazyCard';
import { useHeroisDaVidaReal, HeroisDaVidaRealContent } from '@/hooks/useHeroisDaVidaReal';

interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface HeroisDaVidaRealSectionProps {
  onCardClick?: (item: ContentItem) => void;
}

/**
 * Seção Heróis da Vida Real (Dia dos Pais)
 * Aparece durante todo o mês de agosto
 * Mostra filmes e séries sobre paternidade e heróis da vida real
 */
const HeroisDaVidaRealSection: React.FC<HeroisDaVidaRealSectionProps> = ({ onCardClick }) => {
  const { content, isLoading, isVisible } = useHeroisDaVidaReal();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Não renderizar nada se não estiver no período de exibição (retorna null para não ocupar espaço)
  if (!isVisible && !isLoading) {
    return null;
  }

  // Calcular dias restantes até o fim de agosto
  const getDaysRemaining = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastDayOfAugust = new Date(currentYear, 7, 31); // Mês 7 = agosto
    const diffTime = lastDayOfAugust.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-12 relative"
    >
      {/* Borda ciano neon INTENSO ao redor da seção (apenas em agosto) */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF]/40 via-[#00E5FF]/30 to-[#00E5FF]/40 rounded-xl blur-sm" />
      
      <div className="relative bg-black/40 rounded-xl p-4">
        {/* Header com ícone de estrela */}
        <div className="flex items-center justify-between mb-6 px-4 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Ícone de Estrela pulsando com glow INTENSO */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 15, -15, 0],
                boxShadow: [
                  '0 0 10px #00E5FF, 0 0 20px #00E5FF, 0 0 30px #00E5FF',
                  '0 0 20px #00E5FF, 0 0 40px #00E5FF, 0 0 60px #00E5FF',
                  '0 0 10px #00E5FF, 0 0 20px #00E5FF, 0 0 30px #00E5FF'
                ]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="p-2 bg-black border-2 border-[#00E5FF] rounded-lg"
            >
              <Star className="w-5 h-5 text-[#00E5FF] fill-[#00E5FF]/50" />
            </motion.div>

            {/* Título da seção com drop-shadow para legibilidade */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <motion.h2 
                  animate={{
                    textShadow: [
                      '0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.3)',
                      '0 0 20px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.5)',
                      '0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white text-left max-w-4xl font-titles"
                  style={{
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
                  }}
                >
                  Heróis da Vida Real
                </motion.h2>
                
                {/* Badge especial Dia dos Pais */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 10px #00E5FF, 0 0 20px #00E5FF',
                      '0 0 20px #00E5FF, 0 0 40px #00E5FF',
                      '0 0 10px #00E5FF, 0 0 20px #00E5FF'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="px-2 py-0.5 bg-[#00E5FF]/30 border border-[#00E5FF] rounded text-[#00E5FF] text-xs font-bold"
                >
                  Dia dos Pais
                </motion.div>
              </div>
              
              {/* Subtítulo com drop-shadow */}
              <span 
                className="text-xs text-gray-400 mt-0.5"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))' }}
              >
                Filmes e séries que celebram a paternidade e os verdadeiros heróis
              </span>
            </div>
          </div>

          {/* Contador de dias restantes */}
          {isVisible && daysRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00E5FF]/20 border border-[#00E5FF]/50 rounded-full"
            >
              <Calendar className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-sm text-[#00E5FF] font-medium">
                {daysRemaining === 1 ? 'Último dia!' : `${daysRemaining} dias restantes`}
              </span>
            </motion.div>
          )}
        </div>

        {/* Container do Carrossel */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="carousel-container px-2 sm:px-4 md:px-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : content.length === 0 ? (
              <div className="flex items-center justify-center w-full py-8">
                <p className="text-white/60 text-center">
                  Em breve: conteúdo especial sobre paternidade
                </p>
              </div>
            ) : (
              content.map((item, index) => {
                const safeId = item.id || item.tmdbId || `${item.title}-${index}`;
                return (
                  <LazyCard
                    key={safeId}
                    id={safeId}
                    tmdbId={item.tmdbId}
                    title={item.title}
                    poster={item.poster}
                    type={item.type}
                    year={item.year}
                    rating={item.rating}
                    index={index}
                    onClick={() => onCardClick?.(item)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Footer com mensagem temática */}
        <div className="mt-4 px-4 sm:px-4 md:px-6 flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-3 h-3 text-[#00E5FF]" />
          <span>
            Esta seção é exibida durante todo o mês de agosto em homenagem ao Dia dos Pais
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroisDaVidaRealSection;
