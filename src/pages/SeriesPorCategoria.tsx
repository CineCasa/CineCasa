import React, { useState, useEffect } from 'react';
import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import getSupabaseClient from '@/lib/supabase';
import PremiumCard from '@/components/PremiumCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SeriesItem {
  id: number;
  title: string;
  poster?: string;
  year?: string;
  rating?: string;
  genero?: string;
}

const SeriesPorCategoria: React.FC = () => {
  const [seriesByCategory, setSeriesByCategory] = useState<Record<string, SeriesItem[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const supabase = getSupabaseClient();

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleHeroPlay = (item: any) => {
    navigate(`/series-details/${item.id}`);
  };

  // Buscar séries e agrupar por categoria real do banco
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .order('ano', { ascending: false });

        if (error) {
          console.error('Erro:', error);
          setLoading(false);
          return;
        }
        
        // Agrupar por categoria (genero)
        const grouped: Record<string, SeriesItem[]> = {};
        
        (data || []).forEach((item: any) => {
          const cat = item.genero || 'Sem Categoria';
          if (!grouped[cat]) grouped[cat] = [];
          
          grouped[cat].push({
            id: item.id_n || item.id,
            title: item.titulo || item.title || 'Sem título',
            poster: item.capa || item.poster,
            year: item.ano?.toString(),
            rating: item.rating?.toString(),
            genero: cat
          });
        });
        
        setSeriesByCategory(grouped);
        // Ordenar categorias alfabeticamente
        setCategories(Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'pt-BR')));
        setLoading(false);
      } catch (err) {
        console.error('Erro:', err);
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const handleClick = (serie: SeriesItem) => {
    navigate(`/series-details/${serie.id}`);
  };

  // Componente de linha de categoria com layout horizontal e rolagem infinita
  const CategoryRow = ({ category, items }: { category: string; items: SeriesItem[] }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    const scroll = (direction: number) => {
      if (!scrollRef.current) return;
      
      const container = scrollRef.current;
      const scrollAmount = container.clientWidth * 0.8; // Rolar 80% da largura visível
      
      container.scrollTo({ 
        left: container.scrollLeft + (direction * scrollAmount), 
        behavior: 'smooth' 
      });
    };

    // Calcular largura do card para mostrar 5 capas
    const getCardWidth = () => {
      if (typeof window === 'undefined') return '18%';
      const containerWidth = window.innerWidth - 96; // padding de 48px cada lado
      const gap = 16; // gap de 16px
      const cardWidth = (containerWidth - (gap * 4)) / 5; // 5 capas
      return `${cardWidth}px`;
    };

    const [cardWidth, setCardWidth] = useState(getCardWidth());

    useEffect(() => {
      const handleResize = () => setCardWidth(getCardWidth());
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
      <div className="w-full mb-8 relative group">
        {/* Título da categoria */}
        <div className="flex items-center justify-between px-4 lg:px-12 mb-4">
          <h2 className="text-xl lg:text-2xl font-bold text-white">{category}</h2>
          
          {/* Setas de navegação - apenas desktop */}
          {!isMobile && (
            <div className="flex gap-2">
              <button 
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                className={`p-2 rounded-full transition-all duration-300 ${
                  canScrollLeft 
                    ? 'bg-white/20 hover:bg-white/40 text-white' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                className={`p-2 rounded-full transition-all duration-300 ${
                  canScrollRight 
                    ? 'bg-white/20 hover:bg-white/40 text-white' 
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Layout horizontal com rolagem infinita - 5 capas visíveis */}
        <div className="relative px-4 lg:px-12">
          {/* Fade esquerdo */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          )}
          
          {/* Fade direito */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          )}

          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory'
            }}
          >
            {items.map((serie, index) => (
              <motion.div
                key={`${serie.id}-${index}`}
                className="flex-shrink-0"
                style={{ 
                  width: cardWidth,
                  minWidth: '180px',
                  scrollSnapAlign: 'start'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <PremiumCard
                  id={serie.id.toString()}
                  title={serie.title}
                  poster={serie.poster}
                  type="series"
                  year={serie.year}
                  rating={serie.rating}
                  onClick={() => navigate(`/series-details/${serie.id}`)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="streaming-container min-h-screen bg-black">
      {/* Navbar */}
      <PremiumNavbar />

      {/* Hero Banner */}
      <PremiumHeroBanner
        contentType="series"
        onPlay={handleHeroPlay}
      />

      {/* Séries por categoria do banco */}
      <div className="py-8 space-y-8">
        {categories.map((category) => (
          <CategoryRow
            key={category}
            category={category}
            items={seriesByCategory[category] || []}
          />
        ))}

        {/* Loading */}
        {loading && (
          <div className="px-4 lg:px-12 space-y-8">
            <div className="bg-gray-800 rounded-lg h-8 w-48 animate-pulse" />
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-shrink-0" style={{ width: 'calc((100% - 64px) / 5)' }}>
                  <div className="bg-gray-800 rounded-lg h-44 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vazio */}
        {!loading && categories.length === 0 && (
          <div className="text-center text-white/60 py-12 px-4">
            <p className="text-lg">Nenhuma série encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesPorCategoria;
