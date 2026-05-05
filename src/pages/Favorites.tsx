import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Calendar, Play, Trash2, Film, Tv, ArrowRight } from 'lucide-react';
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { fetchTmdbMovie, fetchTmdbSeries, tmdbImageUrl } from "@/services/tmdb";
import { toast } from "sonner";

interface HydratedFavorite extends FavoriteItem {
  tmdbData?: {
    poster?: string;
    backdrop?: string;
    rating?: number;
    year?: string;
    overview?: string;
  };
  isRemoving?: boolean;
}

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Bug #4 corrigido: nomes corretos do hook useFavorites
  const { favorites: rawFavorites, loading, refresh, removeFavorite } = useFavorites();
  const [favorites, setFavorites] = useState<HydratedFavorite[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const firstCardRef = useRef<HTMLDivElement>(null);

  const isEmpty = favorites.length === 0 && !loading;
  const isLoading = loading || hydrating;

  const hydrateFavorites = useCallback(async (items: FavoriteItem[]) => {
    if (!items.length) return;

    setHydrating(true);
    const hydrated = await Promise.all(
      items.map(async (item) => {
        const tmdbId = item.content_id.toString();
        let tmdbData: HydratedFavorite['tmdbData'] = {};
        try {
          if (item.content_type === 'movie') {
            const data = await fetchTmdbMovie(tmdbId);
            if (data) {
              tmdbData = {
                poster: data.poster_path ? tmdbImageUrl(data.poster_path, 'w500') : item.poster || undefined,
                backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, 'w780') : item.banner || undefined,
                rating: data.vote_average,
                year: data.release_date?.split('-')[0] || item.year || undefined,
                overview: data.overview,
              };
            }
          } else {
            const data = await fetchTmdbSeries(tmdbId);
            if (data) {
              tmdbData = {
                poster: data.poster_path ? tmdbImageUrl(data.poster_path, 'w500') : item.poster || undefined,
                backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, 'w780') : item.banner || undefined,
                rating: data.vote_average,
                year: data.first_air_date?.split('-')[0] || item.year || undefined,
                overview: data.overview,
              };
            }
          }
        } catch (error) {
          console.error(`Error hydrating ${item.content_type} ${tmdbId}:`, error);
        }

        return {
          ...item,
          tmdbData,
          poster: tmdbData?.poster || item.poster || '/placeholder-movie.jpg',
          year: tmdbData?.year || item.year,
        };
      })
    );

    setFavorites(hydrated);
    setHydrating(false);
  }, []);

  useEffect(() => {
    if (rawFavorites.length > 0) {
      hydrateFavorites(rawFavorites);
    } else {
      setFavorites([]);
    }
  }, [rawFavorites, hydrateFavorites]);

  const handleRemove = async (item: HydratedFavorite) => {
    // Animação de remoção
    setFavorites(prev =>
      prev.map(f => f.id === item.id ? { ...f, isRemoving: true } : f)
    );
    setTimeout(async () => {
      // Bug #4 corrigido: usa removeFavorite (nome correto)
      await removeFavorite(item.content_id);
      setFavorites(prev => prev.filter(f => f.id !== item.id));
    }, 300);
  };

  const handleCardClick = (item: HydratedFavorite) => {
    const routeType = item.content_type === 'movie' ? 'cinema' : 'series';
    navigate(`/details/${routeType}/${item.content_id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Faça login para ver seus favoritos</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-[#00d9ff] text-black font-bold rounded-xl hover:bg-[#00c4e6] transition-colors"
          >
            Fazer login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="pt-16 md:pt-8 px-4 md:px-8 pb-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Meus Favoritos</h1>
              {!isLoading && (
                <p className="text-sm text-gray-400">
                  {favorites.length} {favorites.length === 1 ? 'item' : 'itens'}
                </p>
              )}
            </div>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={() => refresh()}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Atualizar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-800 rounded-lg mb-2" />
                <div className="h-3 bg-gray-800 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <Heart className="w-20 h-20 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-300">Nenhum favorito ainda</h2>
            <p className="text-gray-500 text-center max-w-md">
              Explore filmes e séries e adicione seus favoritos clicando no ícone de coração.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#00d9ff] text-black font-bold rounded-xl hover:bg-[#00c4e6] transition-colors"
            >
              Explorar conteúdo <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Grid de favoritos */}
        {!isLoading && !isEmpty && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {favorites.map((item, index) => (
                <motion.div
                  key={item.id}
                  ref={index === 0 ? firstCardRef : undefined}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: item.isRemoving ? 0 : 1, scale: item.isRemoving ? 0.8 : 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group relative cursor-pointer"
                >
                  {/* Card */}
                  <div
                    className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2"
                    onClick={() => handleCardClick(item)}
                  >
                    <img
                      src={item.poster || '/placeholder-movie.jpg'}
                      alt={item.titulo || 'Favorito'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                      }}
                    />

                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        item.content_type === 'movie'
                          ? 'bg-blue-600/90 text-white'
                          : 'bg-purple-600/90 text-white'
                      }`}>
                        {item.content_type === 'movie' ? (
                          <span className="flex items-center gap-1"><Film className="w-3 h-3" /> Filme</span>
                        ) : (
                          <span className="flex items-center gap-1"><Tv className="w-3 h-3" /> Série</span>
                        )}
                      </span>
                    </div>

                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCardClick(item); }}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Play className="w-5 h-5 text-black ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(item); }}
                        className="w-10 h-10 bg-red-500/90 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight mb-1">
                    {item.titulo || 'Sem título'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {(item.tmdbData?.year || item.year) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.tmdbData?.year || item.year}
                      </span>
                    )}
                    {item.tmdbData?.rating && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {item.tmdbData.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
