import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar } from 'lucide-react';
import LazyCard from './LazyCard';
import { useMaesInesqueciveis, MaesInesqueciveisContent } from '@/hooks/useMaesInesqueciveis';

interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface MaesInesqueciveisSectionProps {
  onCardClick?: (item: ContentItem) => void;
}

/**
 * Seção Mães Inesquecíveis
 * Aparece durante todo o mês de maio (Dia das Mães)
 * Mostra filmes e séries sobre maternidade, família e amor maternal
 */
const MaesInesqueciveisSection: React.FC<MaesInesqueciveisSectionProps> = ({ onCardClick }) => {
  const { content, isLoading, isVisible } = useMaesInesqueciveis();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Não renderizar nada se não estiver no período de exibição (retorna null para não ocupar espaço)
  if (!isVisible && !isLoading) {
    return null;
  }

  // Calcular dias restantes até o fim de maio
  const getDaysRemaining = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastDayOfMay = new Date(currentYear, 4, 31); // Mês 4 = maio
    const diffTime = lastDayOfMay.getTime() - now.getTime();
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
      {/* Borda ciano neon sutil ao redor da seção */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF]/20 via-[#00E5FF]/10 to-[#00E5FF]/20 rounded-xl blur-sm" />
      
      <div className="relative bg-black/40 rounded-xl p-4">
        {/* Header com ícone de coração */}
        <div className="flex items-center justify-between mb-6 px-4 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Ícone de Coração pulsando */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 5px #00E5FF, 0 0 10px #00E5FF',
                  '0 0 10px #00E5FF, 0 0 20px #00E5FF',
                  '0 0 5px #00E5FF, 0 0 10px #00E5FF'
                ]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="p-2 bg-black border-2 border-[#00E5FF] rounded-lg"
            >
              <Heart className="w-5 h-5 text-[#00E5FF] fill-[#00E5FF]/30" />
            </motion.div>

            {/* Título da seção */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white text-left max-w-4xl font-titles">
                  Mães Inesquecíveis
                </h2>
                
                {/* Badge especial Dia das Mães */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 5px #FF69B4, 0 0 10px #FF69B4',
                      '0 0 10px #FF69B4, 0 0 20px #FF69B4',
                      '0 0 5px #FF69B4, 0 0 10px #FF69B4'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="px-2 py-0.5 bg-pink-500/20 border border-pink-400 rounded text-pink-300 text-xs font-bold"
                >
                  Dia das Mães
                </motion.div>
              </div>
              
              {/* Subtítulo */}
              <span className="text-xs text-gray-400 mt-0.5">
                Filmes e séries que celebram o amor maternal
              </span>
            </div>
          </div>

          {/* Contador de dias restantes */}
          {isVisible && daysRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-full"
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
                  Em breve: conteúdo especial sobre maternidade
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
          <Heart className="w-3 h-3 text-pink-400" />
          <span>
            Esta seção é exibida durante todo o mês de maio em homenagem ao Dia das Mães
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MaesInesqueciveisSection;
