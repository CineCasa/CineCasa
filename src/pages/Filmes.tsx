import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';
import { Film, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';

interface Filme {
  id: string;
  titulo: string;
  poster: string;
  banner?: string;
  year?: string;
  rating?: string;
  category?: string;
  genre?: string;
  description?: string;
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

const Filmes: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Record<string, Filme[]>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchFilmes();
  }, []);

  const fetchFilmes = async () => {
    try {
      setLoading(true);
      console.log('[Filmes] Iniciando busca...');
      
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Filmes] Erro Supabase:', error);
        throw error;
      }

      console.log('[Filmes] Total de filmes retornados:', data?.length || 0);

      // Organizar filmes por categoria
      const filmesPorCategoria: Record<string, Filme[]> = {};
      
      // Inicializar categorias vazias
      CATEGORIAS_ORDEM.forEach(cat => {
        filmesPorCategoria[cat] = [];
      });
      // Adicionar categoria 'Outros' para filmes sem categoria definida
      filmesPorCategoria['Outros'] = [];

      (data || []).forEach((filme: any) => {
        // Processar múltiplas categorias (separadas por vírgula)
        const categoriaField = filme.categoria || filme.category || '';
        const categorias = categoriaField 
          ? categoriaField.split(',').map((c: string) => c.trim()).filter((c: string) => c)
          : [];
        
        const filmeFormatado = {
          id: filme.id,
          titulo: filme.titulo || filme.title,
          poster: filme.poster,
          banner: filme.banner,
          year: filme.year || filme.ano,
          rating: filme.rating || filme.nota,
          category: categoriaField,
          genre: filme.genero || filme.genre,
          description: filme.descricao || filme.description || filme.overview
        };

        if (categorias.length === 0) {
          // Sem categoria definida, colocar em 'Outros'
          filmesPorCategoria['Outros'].push(filmeFormatado);
        } else {
          // Adicionar o filme a CADA categoria definida
          let addedToAny = false;
          categorias.forEach((categoria: string) => {
            if (CATEGORIAS_ORDEM.includes(categoria)) {
              filmesPorCategoria[categoria].push(filmeFormatado);
              addedToAny = true;
            }
          });
          
          // Se nenhuma categoria válida, vai para 'Outros'
          if (!addedToAny) {
            filmesPorCategoria['Outros'].push(filmeFormatado);
          }
        }
      });

      // Log de categorias com filmes
      const categoriasComFilmes = Object.entries(filmesPorCategoria)
        .filter(([_, filmes]) => filmes.length > 0)
        .map(([cat, filmes]) => `${cat}: ${filmes.length}`);
      console.log('[Filmes] Categorias com filmes:', categoriasComFilmes);

      setCategories(filmesPorCategoria);
    } catch (error) {
      console.error('[Filmes] Erro ao buscar filmes:', error);
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

  const handleFilmeClick = (filme: Filme) => {
    navigate(`/details/cinema/${filme.id}`);
  };

  const categoriasComFilmes = CATEGORIAS_ORDEM.filter(
    cat => categories[cat] && categories[cat].length > 0
  );

  return (
    <div className="min-h-screen bg-black pb-20 pt-[70vh]">
      {/* Hero Banner - fixo no topo */}
      <HeroBanner pageType="movies" />

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
        ) : categoriasComFilmes.length === 0 ? (
          <div className="px-4 md:px-8 text-center py-12">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhum filme encontrado</p>
          </div>
        ) : (
          categoriasComFilmes.map((categoryName, categoryIndex) => (
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

                {/* Row de Filmes - 5 cards por view */}
                <div
                  ref={(el) => { rowRefs.current[categoryName] = el; }}
                  className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categories[categoryName].map((filme, index) => (
                    <motion.div
                      key={filme.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleFilmeClick(filme)}
                      className="flex-shrink-0 w-[calc(20%-0.8rem)] min-w-[160px] max-w-[220px] cursor-pointer group/card"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg transition-transform duration-300 group-hover/card:scale-105 group-hover/card:z-10">
                        {filme.poster ? (
                          <ImageWithLoading 
                            src={tmdbImageUrl(filme.poster, 'w500')}
                            alt={filme.titulo}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <Film className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                      </div>
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

export default Filmes;
