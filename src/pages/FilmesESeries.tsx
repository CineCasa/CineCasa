import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PremiumNavbar from '@/components/PremiumNavbar';
import PremiumHeroBanner from '@/components/PremiumHeroBanner';
import { MOVIE_CATEGORIES, CATEGORY_MAPPING } from '@/data/movieCategories';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';

interface Movie {
  id: number;
  titulo: string;
  poster: string | null;
  year: string | null;
  rating: string | null;
}

interface CategorizedMovies {
  [categoryId: string]: Movie[];
}

const FilmesESeries = () => {
  const navigate = useNavigate();
  const [categorizedMovies, setCategorizedMovies] = useState<CategorizedMovies>({});
  const [isLoading, setIsLoading] = useState(true);
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMovies();
  }, []);


  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar filmes:', error);
        return;
      }

      let allMovies = data || [];
      
      // REMOVER FILMES QUE SÃO COLEÇÕES - mostrar apenas filmes individuais
      allMovies = allMovies.filter((movie: any) => {
        const titulo = (movie.titulo || '').toLowerCase();
        const isColecao = titulo.includes('coleção') || 
                          titulo.includes('colecao') || 
                          titulo.includes('collection') ||
                          titulo.includes('box set') ||
                          titulo.includes('pack') ||
                          titulo.includes('trilogia') ||
                          titulo.includes('saga');
        
        if (isColecao) {
          console.log('[FilmesESeries] Removendo coleção:', movie.titulo);
        }
        return !isColecao;
      });
      
      // Organizar filmes por categoria (suporta múltiplas categorias)
      const categorized: CategorizedMovies = {};
      
      // Inicializar todas as categorias
      MOVIE_CATEGORIES.forEach(cat => {
        categorized[cat.id] = [];
      });

      // Distribuir filmes nas categorias
      allMovies.forEach((movie: any) => {
        const movieData: Movie = {
          id: movie.id,
          titulo: movie.titulo,
          poster: movie.poster,
          year: movie.year,
          rating: movie.rating,
        };

        // Lançamentos por ano
        if (movie.year === '2026' || movie.year?.includes('2026')) {
          if (!categorized['lancamento-2026'].find(m => m.id === movie.id)) {
            categorized['lancamento-2026'].push(movieData);
          }
        }
        if (movie.year === '2025' || movie.year?.includes('2025')) {
          if (!categorized['lancamento-2025'].find(m => m.id === movie.id)) {
            categorized['lancamento-2025'].push(movieData);
          }
        }

        // Categorias do campo category
        if (movie.category) {
          const categories = movie.category.split(/[,|;/]/).map((c: string) => c.trim()).filter(Boolean);
          
          categories.forEach((cat: string) => {
            const categoryId = CATEGORY_MAPPING[cat];
            if (categoryId && categorized[categoryId]) {
              if (!categorized[categoryId].find(m => m.id === movie.id)) {
                categorized[categoryId].push(movieData);
              }
            }
          });
        }
      });

      setCategorizedMovies(categorized);
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  const handleHeroPlay = (item: any) => {
    console.log('[FilmesESeries] Play hero content:', item);
    if (item?.id) {
      navigate(`/details/cinema/${item.id}`);
    }
  };

  const handleHeroDetails = () => {
    console.log('Show hero details');
  };

  const handleMovieClick = (movieId: number) => {
    navigate(`/details/cinema/${movieId}`);
  };

  const scroll = (categoryId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(`scroll-${categoryId}`);
    if (container) {
      const scrollAmount = direction === 'left' ? -container.clientWidth : container.clientWidth;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      
      setTimeout(() => {
        setScrollPositions(prev => ({
          ...prev,
          [categoryId]: container.scrollLeft + scrollAmount
        }));
      }, 300);
    }
  };

  // Filtrar apenas categorias que têm filmes
  const categoriesWithMovies = MOVIE_CATEGORIES.filter(
    cat => categorizedMovies[cat.id] && categorizedMovies[cat.id].length > 0
  );

  console.log('[FilmesESeries] Renderizando com', categoriesWithMovies.length, 'categorias');
  
  return (
    <div className="min-h-screen bg-black pt-[94px]">
      {/* Banner Hero - Filmes */}
      <div className="relative">
        <PremiumHeroBanner
          contentType="movies"
        />
      </div>

      {/* Categorias com Filmes */}
      <div className="pt-5 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto space-y-12">

          {isLoading ? (
            // Loading skeleton
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="w-[200px] h-[300px] bg-gray-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            categoriesWithMovies.map((category) => (
              <div key={category.id} className="space-y-4">
                {/* Título da Categoria */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {category.name}
                  </h2>
                  <span className="text-gray-400 text-sm">
                    {categorizedMovies[category.id].length} filmes
                  </span>
                </div>

                {/* Row com scroll horizontal infinito */}
                <div className="relative group">
                  {/* Botão scroll esquerdo */}
                  {scrollPositions[category.id] > 0 && (
                    <button
                      onClick={() => scroll(category.id, 'left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}

                  {/* Container de filmes */}
                  <div
                    id={`scroll-${category.id}`}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {categorizedMovies[category.id].map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleMovieClick(movie.id)}
                        className="flex-none w-[200px] md:w-[220px] lg:w-[240px] cursor-pointer group/card"
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                          {movie.poster ? (
                            <img
                              src={movie.poster}
                              alt={movie.titulo}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <span className="text-gray-500 text-sm">Sem imagem</span>
                            </div>
                          )}
                          
                          {/* Overlay no hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                            <button className="w-12 h-12 bg-[#00A8E1] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5" fill="white" />
                            </button>
                            <button className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                              <Info className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Rating badge */}
                          {movie.rating && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {movie.rating}
                            </div>
                          )}
                        </div>

                        {/* Título */}
                        <h3 className="mt-2 text-white text-sm font-medium break-words whitespace-normal leading-tight line-clamp-2 group-hover/card:text-[#00A8E1] transition-colors">
                          {movie.titulo}
                        </h3>
                        {movie.year && (
                          <p className="text-gray-400 text-xs">{movie.year}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botão scroll direito */}
                  <button
                    onClick={() => scroll(category.id, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))
          )}

          {!isLoading && categoriesWithMovies.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Nenhum filme encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilmesESeries;
