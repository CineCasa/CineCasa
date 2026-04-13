import { useState, useEffect } from "react";
import CategoryFilms from "@/components/CategoryFilms";
import { motion } from 'framer-motion';
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/components/AuthProvider";

const Favorites = () => {
  const [randomImages, setRandomImages] = useState<any[]>([]);
  const { user } = useAuth();
  
  // Hook de favoritos do Supabase
  const { favorites, loading, fetchFavorites } = useFavorites();

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
        .select('id, titulo, banner')
        .not('banner', 'is', null)
        .limit(20);

      const allImages = [
        ...(movies || []).map(item => ({ ...item, type: 'movie', poster: item.poster })),
        ...(series || []).map(item => ({ ...item, type: 'series', poster: item.banner }))
      ];

      // Embaralhar as imagens
      const shuffled = allImages.sort(() => Math.random() - 0.5);
      setRandomImages(shuffled);
    } catch (error) {
      console.error('Erro ao buscar imagens aleatórias:', error);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchRandomImages();
    
    // O hook useFavorites já cuida do fetch dos favoritos
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  return (
    <div className="min-h-screen bg-black pt-[94px]">
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
