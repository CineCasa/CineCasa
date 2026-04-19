import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Calendar, Play, Trash2, Film, Tv, ArrowRight } from 'lucide-react';
import { useFavorites, FavoriteItem } from "@/hooks/useFavorites";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { fetchTmdbMovie, fetchTmdbSeries, tmdbImageUrl } from "@/services/tmdb";
import { toast } from "sonner";

// Extended favorite item with hydrated TMDB data
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
  const { favorites: rawFavorites, loading, fetchFavorites, removeFromFavorites } = useFavorites();
  const [favorites, setFavorites] = useState<HydratedFavorite[]>([]);
  const [hydrating, setHydrating] = useState(false);

  // Hydrate favorites with TMDB data
  const hydrateFavorites = useCallback(async (items: FavoriteItem[]) => {
    if (!items.length) return;
    
    setHydrating(true);
    const hydrated = await Promise.all(
      items.map(async (item) => {
        // Try to get TMDB ID from content_id or use it directly
        const tmdbId = item.content_id.toString();
        
        let tmdbData = {};
        try {
          if (item.content_type === 'movie') {
            const data = await fetchTmdbMovie(tmdbId);
            if (data) {
              tmdbData = {
                poster: data.poster_path ? tmdbImageUrl(data.poster_path, 'w500') : item.poster,
                backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, 'w780') : item.banner,
                rating: data.vote_average,
                year: data.release_date?.split('-')[0] || item.year,
                overview: data.overview
              };
            }
          } else {
            const data = await fetchTmdbSeries(tmdbId);
            if (data) {
              tmdbData = {
                poster: data.poster_path ? tmdbImageUrl(data.poster_path, 'w500') : item.poster,
                backdrop: data.backdrop_path ? tmdbImageUrl(data.backdrop_path, 'w780') : item.banner,
                rating: data.vote_average,
                year: data.first_air_date?.split('-')[0] || item.year,
                overview: data.overview
              };
            }
          }
        } catch (error) {
          console.error(`Error hydrating ${item.content_type} ${tmdbId}:`, error);
        }

        return {
          ...item,
          tmdbData,
          poster: tmdbData.poster || item.poster || '/placeholder-movie.jpg',
          year: tmdbData.year || item.year
        };
      })
    );
    
    setFavorites(hydrated);
    setHydrating(false);
  }, []);

  // Initial load and hydration
  useEffect(() => {
    if (user && rawFavorites.length > 0) {
      hydrateFavorites(rawFavorites);
    } else {
      setFavorites(rawFavorites);
    }
  }, [user, rawFavorites, hydrateFavorites]);

  // Optimistic removal with animation
  const handleRemove = async (item: HydratedFavorite) => {
    // Optimistic update - mark as removing
    setFavorites(prev => 
      prev.map(f => f.id === item.id ? { ...f, isRemoving: true } : f)
    );

    // Wait for animation
    setTimeout(async () => {
      const success = await removeFromFavorites(item.content_id, item.content_type);
      if (!success) {
        // Revert if failed
        setFavorites(prev => 
          prev.map(f => f.id === item.id ? { ...f, isRemoving: false } : f)
        );
      }
    }, 300);
  };

  // Navigate to content
  const handleNavigate = (item: HydratedFavorite) => {
    if (item.content_type === 'movie') {
      navigate(`/details/cinema/${item.content_id}`);
    } else {
      navigate(`/series-details/${item.content_id}`);
    }
  };

  // Get gradient based on index for visual variety
  const getGradient = (index: number) => {
    const gradients = [
      'from-cyan-500/20 to-blue-500/20',
      'from-purple-500/20 to-pink-500/20',
      'from-green-500/20 to-emerald-500/20',
      'from-orange-500/20 to-red-500/20',
      'from-yellow-500/20 to-amber-500/20',
      'from-indigo-500/20 to-violet-500/20'
    ];
    return gradients[index % gradients.length];
  };

  const isEmpty = favorites.length === 0 && !loading;
  const isLoading = loading || hydrating;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* ============================================
          CAMADA 0: FUNDO - Imagem da família com efeito acolhedor
          ============================================ */}
      <div className="fixed inset-0 z-0">
        {/* Background Image - Família CineCasa */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('/imagem pagina de login.png')`,
            filter: 'blur(8px) brightness(1.1) saturate(1.05)',
            transform: 'scale(1.05)'
          }}
        />
        {/* Vignette suave para foco no conteúdo */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.85) 100%)'
          }}
        />
        {/* Gradientes adicionais para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      </div>

      {/* ============================================
          CAMADA 1 & 2: CONTEÚDO E INTERFACE
          ============================================ */}
      <div className="relative z-10 min-h-screen pt-[94px] pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                <Heart className="w-6 h-6 text-cyan-400 fill-cyan-400" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                Meus Favoritos
              </h1>
            </div>
            <p className="text-white/60 text-sm md:text-base ml-12">
              {favorites.length > 0 ? `${favorites.length} título${favorites.length > 1 ? 's' : ''} na sua lista` : 'Sua coleção pessoal'}
            </p>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-36 md:w-32 md:h-48 bg-white/10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-3 py-2">
                      <div className="h-6 bg-white/10 rounded w-3/4" />
                      <div className="h-4 bg-white/10 rounded w-1/2" />
                      <div className="h-4 bg-white/10 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && isEmpty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 md:py-32"
            >
              <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl p-8 md:p-12 text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                  <Heart className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Sua lista está vazia
                </h2>
                <p className="text-white/60 mb-8 max-w-xs mx-auto">
                  Que tal explorar novos títulos? Adicione filmes e séries para assistir mais tarde.
                </p>
                <button
                  onClick={() => navigate('/home')}
                  className="group inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  <span>Explorar Títulos</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Favorites Grid */}
          {!isLoading && favorites.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {favorites.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: item.isRemoving ? 0 : 1, 
                      y: item.isRemoving ? -20 : 0,
                      scale: item.isRemoving ? 0.9 : 1
                    }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    {/* Glassmorphism Card */}
                    <div 
                      className="relative bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
                    >
                      <div className="flex gap-4 p-4">
                        {/* Poster Image */}
                        <div 
                          className="relative w-24 h-36 md:w-32 md:h-48 flex-shrink-0 rounded-lg overflow-hidden shadow-lg cursor-pointer"
                          onClick={() => handleNavigate(item)}
                        >
                          <img
                            src={item.poster || '/placeholder-movie.jpg'}
                            alt={item.titulo || 'Sem título'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Play icon on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-cyan-500/90 p-2 rounded-full">
                              <Play className="w-5 h-5 text-black fill-black" />
                            </div>
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-medium text-white flex items-center gap-1">
                            {item.content_type === 'movie' ? (
                              <><Film className="w-3 h-3" /> Filme</>
                            ) : (
                              <><Tv className="w-3 h-3" /> Série</>
                            )}
                          </div>
                        </div>

                        {/* Content Info */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Title */}
                          <h3 
                            className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2 cursor-pointer hover:text-cyan-300 transition-colors"
                            onClick={() => handleNavigate(item)}
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                          >
                            {item.titulo || 'Sem título'}
                          </h3>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {/* Rating */}
                            {(item.tmdbData?.rating || item.rating) && (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${getGradient(index)} border border-white/10`}>
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-semibold text-white">
                                  {item.tmdbData?.rating?.toFixed(1) || item.rating}
                                </span>
                              </div>
                            )}

                            {/* Year */}
                            {(item.tmdbData?.year || item.year) && (
                              <div className="flex items-center gap-1 text-white/60 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>{item.tmdbData?.year || item.year}</span>
                              </div>
                            )}

                            {/* Genre */}
                            {item.genero && (
                              <span className="text-xs text-cyan-300/80 px-2 py-0.5 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                                {item.genero.split(',')[0]}
                              </span>
                            )}
                          </div>

                          {/* Overview (if available) */}
                          {item.tmdbData?.overview && (
                            <p className="text-white/50 text-sm line-clamp-2 mb-auto">
                              {item.tmdbData.overview}
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 mt-auto pt-3">
                            <button
                              onClick={() => handleNavigate(item)}
                              className="flex-1 flex items-center justify-center gap-2 bg-[#00A8E1]/20 hover:bg-[#00A8E1]/30 text-[#00D4FF] font-medium py-2 px-4 rounded-lg transition-all duration-300 border border-[#00A8E1]/30 hover:border-[#00D4FF]/50"
                            >
                              <Play className="w-4 h-4" />
                              <span className="text-sm">Assistir</span>
                            </button>

                            {/* Remove Button with Heart Icon */}
                            <button
                              onClick={() => handleRemove(item)}
                              disabled={item.isRemoving}
                              className="group/remove p-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-lg transition-all duration-300"
                              title="Remover da lista"
                            >
                              <Heart 
                                className={`w-5 h-5 text-cyan-400 fill-cyan-400 group-hover/remove:text-red-400 group-hover/remove:fill-red-400 transition-all duration-300 ${item.isRemoving ? 'scale-0' : 'scale-100'}`} 
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Neon glow effect on hover */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Footer note */}
          {!isLoading && favorites.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <p className="text-white/40 text-sm">
                Clique no coração para remover itens da sua lista
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
