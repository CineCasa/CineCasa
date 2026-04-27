// ============================================
// CONTINUE WATCHING SECTION - CineCasa
// Glassmorphism Design + Neon Accents
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Play, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface ContinueWatchingItem {
  id: string;
  contentId: string;
  contentType: 'movie' | 'series';
  title: string;
  poster: string;
  banner: string;
  progressPct: number;
  currentTime: number;
  duration: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: string;
  updatedAt: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const getRemainingTime = (currentTime: number, duration: number): string => {
  if (!duration || duration === 0) return '0:00';
  const remaining = Math.max(0, duration - currentTime);
  return formatTime(remaining);
};

// ============================================
// HOOK: useContinueWatching
// ============================================

export const useContinueWatching = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContinueWatching = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Buscar na tabela user_progress com filtro de progresso entre 2% e 95%
        // Ordenar por updated_at DESC e limitar a 5 itens
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .gte('progress_pct', 2)
          .lte('progress_pct', 95)
          .order('updated_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('[ContinueWatching] Error fetching:', error);
          setItems([]);
          return;
        }

        if (!data || data.length === 0) {
          setItems([]);
          return;
        }

        // Buscar detalhes do conteúdo (posters/títulos) das tabelas cinema/series
        const mappedItems: ContinueWatchingItem[] = await Promise.all(
          data.map(async (item: any) => {
            // Usar content_id que é a coluna correta na tabela user_progress
            const contentId = item.content_id?.toString() || '';
            
            let title = '';
            let poster = '';
            let banner = '';

            if (item.content_type === 'movie' && item.content_id) {
              // Buscar dados do filme na tabela cinema
              const { data: movieData } = await supabase
                .from('cinema')
                .select('titulo, poster')
                .eq('id', item.content_id)
                .single();
              
              if (movieData) {
                title = movieData.titulo || `Filme ${item.content_id}`;
                poster = movieData.poster || '';
                banner = movieData.poster || '';
              }
            } else if (item.content_type === 'series' && item.content_id) {
              // Buscar dados da série na tabela series
              const { data: seriesData } = await supabase
                .from('series')
                .select('titulo, capa, banner')
                .eq('id_n', item.content_id)
                .single();
              
              if (seriesData) {
                title = seriesData.titulo || `Série ${item.content_id}`;
                poster = seriesData.capa || '';
                banner = seriesData.banner || seriesData.capa || '';
              }
            }

            return {
              id: item.id,
              contentId,
              contentType: item.content_type as 'movie' | 'series',
              title: title || (item.content_type === 'movie' ? `Filme ${item.content_id}` : `Série ${item.content_id}`),
              poster,
              banner,
              progressPct: item.progress_pct || Math.round((item.current_time / item.duration) * 100),
              currentTime: item.current_time,
              duration: item.duration,
              seasonNumber: item.season_number,
              episodeNumber: item.episodio_id,
              episodeId: item.episodio_id?.toString(),
              updatedAt: item.updated_at,
            };
          })
        );

        setItems(mappedItems);
      } catch (err) {
        console.error('[ContinueWatching] Failed to fetch:', err);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContinueWatching();
  }, [user?.id]);

  // Função para remover item
  const removeItem = async (itemId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('[ContinueWatching] Error removing item:', error);
        return;
      }

      // Atualizar estado local
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('[ContinueWatching] Failed to remove item:', err);
    }
  };

  return { items, isLoading, removeItem };
};

// ============================================
// COMPONENT: ContinueWatchingCard
// ============================================

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onRemove: (id: string) => void;
  onPlay: (item: ContinueWatchingItem) => void;
}

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ 
  item, 
  onRemove, 
  onPlay 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calcular tempo restante
  const remainingTime = getRemainingTime(item.currentTime, item.duration);
  const totalDuration = formatTime(item.duration);

  // Formatar label de episódio
  const getEpisodeLabel = () => {
    if (item.contentType === 'series' && item.seasonNumber && item.episodeNumber) {
      return `S${String(item.seasonNumber).padStart(2, '0')}:E${String(item.episodeNumber).padStart(2, '0')}`;
    }
    return item.contentType === 'movie' ? 'Filme' : 'Série';
  };

  return (
    <div
      className="relative flex-shrink-0 w-[280px] md:w-[320px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container com Glassmorphism */}
      <div 
        className="relative rounded-xl overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 hover:scale-105 hover:border-[#00E5FF]/50"
        style={{
          boxShadow: isHovered 
            ? '0 0 30px rgba(0, 229, 255, 0.3), 0 10px 40px rgba(0,0,0,0.4)' 
            : '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Background Image */}
        <div className="relative aspect-video overflow-hidden">
          {item.banner ? (
            <img
              src={item.banner}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-500 text-sm">{item.title}</span>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        </div>

        {/* Info Section */}
        <div className="p-3 space-y-2">
          {/* Título e Tipo */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate leading-tight">
                {item.title}
              </h3>
              <p className="text-[#00E5FF] text-xs mt-0.5 font-medium">
                {getEpisodeLabel()}
              </p>
            </div>
          </div>

          {/* Tempo Restante */}
          <div className="flex items-center gap-1.5 text-white/60 text-xs">
            <Clock size={12} className="text-[#00E5FF]" />
            <span>Retomar: {formatTime(item.currentTime)} / {totalDuration}</span>
          </div>

          {/* Barra de Progresso Neon */}
          <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-[#00E5FF] rounded-full transition-all duration-500"
              style={{ 
                width: `${item.progressPct}%`,
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.8), 0 0 20px rgba(0, 229, 255, 0.4)'
              }}
            />
          </div>

          {/* Porcentagem */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">{item.progressPct}% concluído</span>
            <span className="text-[#00E5FF] font-medium">{remainingTime} restantes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENT: ContinueWatchingSection
// ============================================

export const ContinueWatchingSection: React.FC = () => {
  const { items, isLoading, removeItem } = useContinueWatching();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar se pode scrollar
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [items]);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 340; // Card width + gap
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Handler para reproduzir
  const handlePlay = (item: ContinueWatchingItem) => {
    // Navegar para a página de detalhes com o tempo de início
    const route = item.contentType === 'movie' 
      ? `/details/cinema/${item.contentId}`
      : `/details/series/${item.contentId}`;
    
    navigate(route, { 
      state: { 
        resumeFrom: item.currentTime,
        episodeId: item.episodeId,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber
      }
    });
  };

  // Ocultar se não houver itens ou estiver carregando
  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-8 px-4 md:px-8 lg:px-12">
      {/* Header com Ícone Neon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
            CONTINUAR ASSISTINDO
          </h2>
          <Clock 
            size={24} 
            className="text-[#00E5FF]"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))'
            }}
          />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-[#00E5FF]/50 to-transparent" />
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Botão Scroll Esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] backdrop-blur-sm border border-white/10 hover:border-[#00E5FF]/50 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {items.map((item) => (
            <ContinueWatchingCard
              key={item.id}
              item={item}
              onRemove={removeItem}
              onPlay={handlePlay}
            />
          ))}
        </div>

        {/* Botão Scroll Direita */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] backdrop-blur-sm border border-white/10 hover:border-[#00E5FF]/50 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* CSS para esconder scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default ContinueWatchingSection;
