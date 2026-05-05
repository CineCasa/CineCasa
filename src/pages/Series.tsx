import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';
import { Tv, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import HeroBanner from '@/components/HeroBanner';

interface Serie {
  id_n: number;
  titulo: string;
  descricao?: string;
  ano?: number;
  tmdb_id?: number;
  capa?: string;
  poster?: string;
  trailer?: string;
  genero?: string;
  classificacao?: string;
  rating?: number;
}

// Ordem das categorias conforme definido no banco de dados
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
      console.log('[Series] Iniciando busca...');
      
      const { data, error } = await supabase
        .from('series')
        .select(`
          id_n,
          titulo,
          descricao,
          ano,
          tmdb_id,
          capa,
          poster,
          trailer,
          genero,
          classificacao,
          rating
        `)
        .order('id_n', { ascending: false });

      if (error) {
        console.error('[Series] Erro Supabase:', error);
        throw error;
      }

      console.log('[Series] Total de séries retornadas:', data?.length || 0);
      console.log('[Series] Dados brutos:', JSON.stringify(data?.slice(0, 3)));
      
      // Se não há dados, mostrar erro
      if (!data || data.length === 0) {
        console.error('[Series] Nenhuma série retornada do banco!');
        setCategories({ 'Todas as Séries': [] });
        return;
      }

      // Organizar séries por gênero
      const seriesPorGenero: Record<string, Serie[]> = {};
      
      // Inicializar categorias vazias
      CATEGORIAS_ORDEM.forEach(cat => {
        seriesPorGenero[cat] = [];
      });
      // Adicionar categoria 'Outros' para séries sem gênero definido
      seriesPorGenero['Outros'] = [];

      // Usar dados diretamente conforme categorias do banco de dados
      (data || []).forEach((serie: Serie) => {
        // Usar genero da coluna 'genero' do banco de dados
        const generos = serie.genero ? serie.genero.split(',').map((g: string) => g.trim()).filter(g => g) : [];
        
        if (generos.length === 0) {
          // Sem gênero definido, colocar em 'Outros'
          seriesPorGenero['Outros'].push(serie);
        } else {
          generos.forEach((genero: string) => {
            // Verificar se o gênero está na lista de categorias
            if (CATEGORIAS_ORDEM.includes(genero)) {
              seriesPorGenero[genero].push(serie);
            } else {
              // Gênero não reconhecido, vai para 'Outros'
              seriesPorGenero['Outros'].push(serie);
            }
          });
        }
      });

      // Log de categorias com séries
      const categoriasComSeries = Object.entries(seriesPorGenero)
        .filter(([_, series]) => series.length > 0)
        .map(([cat, series]) => `${cat}: ${series.length}`);
      console.log('[Series] Categorias com séries:', categoriasComSeries);

      setCategories(seriesPorGenero);
    } catch (error) {
      console.error('[Series] Erro ao buscar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollRow = (categoryName: string, direction: 'left' | 'right') => {
    const row = rowRefs.current[categoryName];
    if (!row) return;

    const scrollAmount = window.innerWidth * 0.8;
    const currentScroll = row.scrollLeft;
    const maxScroll = row.scrollWidth - row.clientWidth;

    // Scroll infinito como Netflix
    if (direction === 'right') {
      if (currentScroll >= maxScroll - 100) {
        // Se chegou ao final, volta para o início suavemente
        row.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        row.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    } else {
      if (currentScroll <= 100) {
        // Se chegou ao início, vai para o final suavemente
        row.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        });
      } else {
        row.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleSerieClick = (serie: Serie) => {
    navigate(`/details/series/${serie.id_n}`);
  };

  const categoriasComSeries = CATEGORIAS_ORDEM.filter(
    cat => categories[cat] && categories[cat].length > 0
  );

  return (
    <div className="min-h-screen bg-black pb-20">
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
              <div className="px-4 md:px-8 mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white font-titles">{categoryName}</h2>
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
                      key={serie.id_n}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => handleSerieClick(serie)}
                      className="flex-shrink-0 w-[calc(20%-0.8rem)] min-w-[160px] max-w-[220px] cursor-pointer group/card"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg transition-transform duration-300 group-hover/card:scale-105 group-hover/card:z-10">
                        {serie.capa || serie.poster ? (
                          <ImageWithLoading 
                            src={tmdbImageUrl(serie.capa || serie.poster || '', 'w500')}
                            alt={serie.titulo}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                            <Tv className="w-12 h-12 text-gray-500" />
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

export default Series;
