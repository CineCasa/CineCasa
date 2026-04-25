import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Timer } from 'lucide-react';
import LazyCard from './LazyCard';
import { useCineNoite, CineNoiteContent } from '@/hooks/useCineNoite';

interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface CineNoiteSectionProps {
  onCardClick?: (item: ContentItem) => void;
}

/**
 * Seção Cine Noite
 * Aparece apenas das 23:58 às 05:59
 * Mostra conteúdo adulto (18+) com ícone de cadeado/selo
 */
const CineNoiteSection: React.FC<CineNoiteSectionProps> = ({ onCardClick }) => {
  const { content, isLoading, isVisible } = useCineNoite();
  const carouselRef = useRef<HTMLDivElement>(null);

  // Não renderizar nada se não estiver no horário
  if (!isVisible && !isLoading) {
    return null;
  }

  // Formatar horário restante
  const getTimeRemaining = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Calcular até 06:00
    let endHour = 6;
    let endMinute = 0;
    
    let remainingMinutes = (endHour * 60 + endMinute) - (hours * 60 + minutes);
    if (remainingMinutes < 0) {
      // Já passou das 06:00, calcular para o próximo dia
      remainingMinutes += 24 * 60;
    }
    
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMins = remainingMinutes % 60;
    
    if (remainingHours > 0) {
      return `${remainingHours}h ${remainingMins}min restantes`;
    }
    return `${remainingMins}min restantes`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-12 relative"
    >
      {/* Borda ciano neon sutil ao redor da seção */}
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-[#00E5FF]/20 to-cyan-500/20 rounded-xl blur-sm" />
      
      <div className="relative bg-black/40 rounded-xl p-4">
        {/* Header com ícone de cadeado e selo 18+ */}
        <div className="flex items-center justify-between mb-6 px-4 sm:px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Ícone de Cadeado Neon Ciano */}
            <motion.div
              animate={{ 
                boxShadow: [
                  '0 0 5px #00E5FF, 0 0 10px #00E5FF, 0 0 15px #00E5FF',
                  '0 0 10px #00E5FF, 0 0 20px #00E5FF, 0 0 30px #00E5FF',
                  '0 0 5px #00E5FF, 0 0 10px #00E5FF, 0 0 15px #00E5FF'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="p-2 bg-black border-2 border-[#00E5FF] rounded-lg"
            >
              <Lock className="w-5 h-5 text-[#00E5FF]" />
            </motion.div>

            {/* Título da seção */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white text-left max-w-4xl font-titles">
                  Cine Noite
                </h2>
                
                {/* Selo 18+ Ciano Estilizado */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 5px #00E5FF, 0 0 10px #00E5FF',
                      '0 0 10px #00E5FF, 0 0 20px #00E5FF',
                      '0 0 5px #00E5FF, 0 0 10px #00E5FF'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="px-2 py-0.5 bg-[#00E5FF]/20 border border-[#00E5FF] rounded text-[#00E5FF] text-xs font-black"
                >
                  18+
                </motion.div>
              </div>
              
              {/* Subtítulo */}
              <span className="text-xs text-gray-400 mt-0.5">
                Conteúdo exclusivo para maiores de 18 anos
              </span>
            </div>
          </div>

          {/* Timer mostrando tempo restante */}
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-full"
            >
              <Timer className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-sm text-[#00E5FF] font-medium">
                {getTimeRemaining()}
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
                  Conteúdo disponível das 23:58 às 05:59
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

        {/* Footer com aviso */}
        <div className="mt-4 px-4 sm:px-4 md:px-6 flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>
            Esta seção é exibida automaticamente das 23:58 às 05:59 e oculta fora deste horário
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CineNoiteSection;
