import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';
import { Tv, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';

interface Serie {
  id: string;
  titulo: string;
  poster: string;
  banner?: string;
  year?: string;
  rating?: string;
  category?: string;
  genre?: string;
  description?: string;
  seasons?: number;
}

// Ordem das categorias
const CATEGORIAS_ORDEM = [
  'Lançamento 2026',
  'Lançamento 2025',
  'Ação',
  'Aventura',
  'Infantil',
  'Finanças',
  'Anime',
  'Animação',
  'Comédia',
  'Drama',
  'Dorama',
  'Clássicos',
  'Negritude',
  'Crime',
  'Policial',
  'Família',
  'Musical',
  'Documentário',
  'Faroeste',
  'Ficção',
  'Nacional',
  'Religioso',
  'Romance',
  'Terror',
  'Suspense',
  'Adulto'
];

// Componente para imagem com animação de loading
const ImageWithLoading: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-gray-500 border-t-[#00d9ff] rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

const Series: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Record<string, Serie[]>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Organizar séries por categoria
      const seriesPorCategoria: Record<string, Serie[]> = {};
      
      CATEGORIAS_ORDEM.forEach(cat => {
        seriesPorCategoria[cat] = [];
      });

      (data || []).forEach((serie: any) => {
        const categoria = serie.categoria || serie.category || 'Outros';
        if (CATEGORIAS_ORDEM.includes(categoria)) {
          if (!seriesPorCategoria[categoria]) {
            seriesPorCategoria[categoria] = [];
          }
          seriesPorCategoria[categoria].push({
            id: serie.id,
            titulo: serie.titulo || serie.title,
            poster: serie.poster,
            banner: serie.banner,
            year: serie.year || serie.ano,
            rating: serie.rating || serie.nota,
            category: categoria,
            genre: serie.genero || serie.genre,
            description: serie.descricao || serie.description || serie.overview,
            seasons: serie.seasons || serie.temporadas || serie.number_of_seasons
          });
        }
      });

      setCategories(seriesPorCategoria);
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollRow = (categoryName: string, direction: 'left' | 'right') => {
    const row = rowRefs.current[categoryName];
    if (row) {
      const scrollAmount = window.innerWidth * 0.8;
      row.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSerieClick = (serie: Serie) => {
    navigate(`/details/series/${serie.id}`);
  };

  const categoriasComSeries = CATEGORIAS_ORDEM.filter(
    cat => categories[cat] && categories[cat].length > 0
  );

  return (
    <div className="min-h-screen bg-black pb-20 pt-[70vh]">
      {/* Hero Banner - fixo no topo */}
      <HeroBanner pageType="series" />

      {/* Categorias */}
      <div className="pt-4 space-y-8">
        {loading ? (
          // Loading skeleton
          <div className="px-4 md:px-8 space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-8 w-48 bg-gray-800 rounded animate-pulse mb-4"></div>
                <div className="flex gap-4 overflow-hidden">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="w-[calc(20%-0.8rem)] min-w-[160px] h-64 bg-gray-800 rounded animate-pulse flex-shrink-0"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : categoriasComSeries.length === 0 ? (
          <div className="px-4 md:px-8 text-center py-12">
            <Tv className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhuma série encontrada</p>
          </div>
        ) : (
          categoriasComSeries.map((categoryName, categoryIndex) => (
            <motion.div
              key={categoryName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              className="relative group"
              onMouseEnter={() => setHoveredRow(categoryName)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Título da Categoria */}
              <div className="max-w-[1920px] mx-auto px-4 md:px-8 mb-3">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  {categoryName}
                  <span className="text-sm font-normal text-gray-500">
                    ({categories[categoryName].length})
                  </span>
                  <ChevronRight 
                    size={20} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00d9ff]"
                  />
                </h2>
              </div>

              {/* Container do Scroll Horizontal */}
              <div className="relative">
                {/* Botão Scroll Left */}
                <button
                  onClick={() => scrollRow(categoryName, 'left')}
                  className={`absolute left-0 top-0 bottom-0 z-20 w-16 bg-black/80 hover:bg-black/90 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredRow === categoryName ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <ChevronLeft size={40} className="text-white" />
                </button>

                {/* Botão Scroll Right */}
                <button
                  onClick={() => scrollRow(categoryName, 'right')}
                  className={`absolute right-0 top-0 bottom-0 z-20 w-16 bg-black/80 hover:bg-black/90 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredRow === categoryName ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <ChevronRight size={40} className="text-white" />
                </button>

                {/* Row de Séries - 5 cards por view */}
                <div
                  ref={(el) => { rowRefs.current[categoryName] = el; }}
                  className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categories[categoryName].map((serie, index) => (
                    <motion.div
                      key={serie.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleSerieClick(serie)}
                      className="flex-shrink-0 w-[calc(20%-0.8rem)] min-w-[160px] max-w-[220px] cursor-pointer group/card"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg transition-transform duration-300 group-hover/card:scale-105 group-hover/card:z-10">
                        {serie.poster ? (
                          <ImageWithLoading 
                            src={tmdbImageUrl(serie.poster, 'w500')}
                            alt={serie.titulo}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <Tv className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {/* Overlay no hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                            </div>
                          </div>
                          <h3 className="text-white font-bold text-sm line-clamp-2">
                            {serie.titulo}
                          </h3>
                          {serie.year && (
                            <p className="text-gray-300 text-xs mt-1">{serie.year}</p>
                          )}
                          {serie.seasons && (
                            <p className="text-[#00d9ff] text-xs mt-1">{serie.seasons} temporada{serie.seasons > 1 ? 's' : ''}</p>
                          )}
                        </div>

                        {/* Rating badge */}
                        {serie.rating && serie.rating !== 'N/A' && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                            {serie.rating}
                          </div>
                        )}

                        {/* Seasons badge */}
                        {serie.seasons && (
                          <div className="absolute top-2 left-2 bg-[#00d9ff]/80 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                            {serie.seasons}T
                          </div>
                        )}
                      </div>
                      
                      {/* Título abaixo do card */}
                      <p className="mt-2 text-sm text-gray-300 truncate group-hover/card:text-white transition-colors">
                        {serie.titulo}
                      </p>
                      {serie.seasons && (
                        <p className="text-xs text-gray-500">{serie.seasons} temporada{serie.seasons > 1 ? 's' : ''}</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Series;
