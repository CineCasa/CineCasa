import { useState, useEffect } from "react";
import PremiumNavbar from "@/components/PremiumNavbar";
import CategoryFilms from "@/components/CategoryFilms";
import { motion } from 'framer-motion';
import getSupabaseClient from '@/lib/supabase';

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomImages, setRandomImages] = useState<any[]>([]);

  const supabase = getSupabaseClient();

  // Buscar imagens aleatórias de filmes e séries
  const fetchRandomImages = async () => {
    try {
      // Buscar filmes aleatórios
      const { data: movies } = await supabase
        .from('cinema')
        .select('id, titulo, poster, banner')
        .not('poster', 'is', null)
        .limit(20);

      // Buscar séries aleatórias
      const { data: series } = await supabase
        .from('series')
        .select('id, titulo, poster, banner')
        .not('poster', 'is', null)
        .limit(20);

      const allImages = [
        ...(movies || []).map(item => ({ ...item, type: 'movie' })),
        ...(series || []).map(item => ({ ...item, type: 'series' }))
      ];

      // Embaralhar as imagens
      const shuffled = allImages.sort(() => Math.random() - 0.5);
      setRandomImages(shuffled);
    } catch (error) {
      console.error('Erro ao buscar imagens aleatórias:', error);
    }
  };

  // Buscar favoritos do banco de dados
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      console.log('🔍 Buscando favoritos...');

      // Buscar filmes favoritos
      const { data: favMovies, error: moviesError } = await supabase
        .from('cinema')
        .select('*')
        .eq('is_favorite', true);

      // Buscar séries favoritas
      const { data: favSeries, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .eq('is_favorite', true);

      if (moviesError) {
        console.error('❌ Erro ao buscar filmes favoritos:', moviesError);
      }

      if (seriesError) {
        console.error('❌ Erro ao buscar séries favoritas:', seriesError);
      }

      const allFavorites = [
        ...(favMovies || []).map(item => ({ ...item, type: 'movie' })),
        ...(favSeries || []).map(item => ({ ...item, type: 'series' }))
      ];

      console.log(`✅ Encontrados ${allFavorites.length} favoritos:`, allFavorites);
      setFavorites(allFavorites);
      setLoading(false);

    } catch (error) {
      console.error('❌ Erro ao buscar favoritos:', error);
      setLoading(false);
    }
  };

  // Configurar subscription para atualizações em tempo real
  useEffect(() => {
    fetchFavorites();
    fetchRandomImages();

    // Subscription para mudanças nas tabelas cinema e series
    const moviesSubscription = supabase
      .channel('favorites-movies-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cinema',
        filter: 'is_favorite=eq.true'
      }, (payload) => {
        console.log('🔄 Mudança em filmes favoritos:', payload);
        fetchFavorites();
      })
      .subscribe();

    const seriesSubscription = supabase
      .channel('favorites-series-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'series',
        filter: 'is_favorite=eq.true'
      }, (payload) => {
        console.log('🔄 Mudança em séries favoritas:', payload);
        fetchFavorites();
      })
      .subscribe();

    // Cleanup
    return () => {
      moviesSubscription.unsubscribe();
      seriesSubscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black pt-[94px]">
      <PremiumNavbar />
      
      {/* Banner com imagens aleatórias - sem ícones de navegação */}
      {randomImages.length > 0 && (
        <div className="w-full overflow-x-auto scrollbar-hide py-4">
          <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
            {randomImages.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex-shrink-0 cursor-pointer group"
                onClick={() => {
                  if (item.type === 'movie') {
                    window.location.href = `/details/cinema/${item.id}`;
                  } else {
                    window.location.href = `/series-details/${item.id}`;
                  }
                }}
              >
                <div className="relative w-48 h-72 sm:w-56 sm:h-80 md:w-64 md:h-96 overflow-hidden rounded-lg">
                  <img
                    src={item.poster || item.banner || '/api/placeholder/300/450'}
                    alt={item.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute bottom-2 left-2 right-2 text-white text-sm font-medium line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.titulo}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      <main className="px-4 md:px-8 lg:px-12 pb-20 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-[30px] md:text-4xl lg:text-5xl font-bold mb-8 text-white uppercase tracking-tight">
            Meus Favoritos
          </h1>
          
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <span className="text-white text-xl">Carregando favoritos...</span>
            </div>
          ) : favorites.length > 0 ? (
            <div className="space-y-8">
              {/* Filmes Favoritos */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Filmes Favoritos</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {favorites
                    .filter(item => item.type === 'movie')
                    .map((item) => (
                      <div
                        key={`movie-${item.id}`}
                        className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 cursor-pointer"
                        onClick={() => {
                          if (item.type === 'movie') {
                            window.location.href = `/details/cinema/${item.id}`;
                          }
                        }}
                      >
                        <img
                          src={item.poster || '/api/placeholder/300/450'}
                          alt={item.titulo}
                          className="w-full h-44 md:h-52 lg:h-60 object-cover rounded-lg mb-2"
                        />
                        <p className="text-xs md:text-sm text-center text-white line-clamp-2">
                          {item.titulo}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              {/* Séries Favoritas */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Séries Favoritas</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                  {favorites
                    .filter(item => item.type === 'series')
                    .map((item) => (
                      <div
                        key={`series-${item.id}`}
                        className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 cursor-pointer"
                        onClick={() => {
                          if (item.type === 'series') {
                            window.location.href = `/series-details/${item.id}`;
                          }
                        }}
                      >
                        <img
                          src={item.poster || '/api/placeholder/300/450'}
                          alt={item.titulo}
                          className="w-full h-44 md:h-52 lg:h-60 object-cover rounded-lg mb-2"
                        />
                        <p className="text-xs md:text-sm text-center text-white line-clamp-2">
                          {item.titulo}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="text-white/20 mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 mx-auto">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sua lista está vazia</h2>
              <p className="text-white/50 max-w-md mb-6">
                Adicione filmes e séries à sua lista para assisti-los mais tarde.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => window.location.href = '/filmes'}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Ver Filmes
                </button>
                <button
                  onClick={() => window.location.href = '/series'}
                  className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Ver Séries
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Favorites;
