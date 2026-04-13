import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, X, Plus, Check, Volume2, VolumeX, ThumbsUp, Share2, ChevronRight, ArrowLeft, Star, Calendar, Clock, Info, User, Users } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../hooks/useFavorites';

interface Movie {
  id: string;
  titulo: string;
  capa: string;
  poster: string;
  banner: string;
  description: string;
  ano: string;
  genero: string;
  rating: string;
  duracao: string;
  trailer: string;
  url?: string;
  tmdb_id: string;
  diretor?: string;
  elenco?: string;
  classificacao?: string;
}

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openPlayer } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      fetchRelatedMovies();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      console.log('🔍 [MovieDetails] Buscando filme com ID:', id);
      
      const { data, error } = await supabase
        .from('cinema')
        .select('id, titulo, poster, banner, url, trailer, description, ano, genero, duracao, rating, classificacao, diretor, elenco, imdb_id')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ [MovieDetails] Erro Supabase:', error);
        throw new Error(`Erro ao buscar filme: ${error.message}`);
      }
      
      console.log('✅ [MovieDetails] Filme encontrado:', data);
      if (data) {
        const movieData = data as any;
        console.log('🎬 [MovieDetails] URL do filme (coluna url):', movieData.url);
        console.log('🎬 [MovieDetails] Trailer:', movieData.trailer);
        console.log('🎬 [MovieDetails] Todas as chaves:', Object.keys(movieData));
      }
      
      setMovie(data as Movie);
    } catch (error) {
      console.error('❌ [MovieDetails] Erro ao buscar detalhes do filme:', error);
      setMovie(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .neq('id', id)
        .ilike('genero', `%${movie?.genero}%`)
        .limit(12);

      if (error) throw error;
      setRelatedMovies(data || []);
    } catch (error) {
      console.error('Erro ao buscar filmes relacionados:', error);
    }
  };

  const handlePlayTrailer = () => {
    if (!movie?.trailer) {
      alert('Trailer não disponível.');
      return;
    }
    openPlayer({
      id: movie.id,
      title: movie.titulo,
      type: 'movie',
      videoUrl: movie.trailer,
      poster: movie.poster,
      year: movie.ano
    });
  };

  const handlePlayMovie = () => {
    if (!movie) return;
    console.log('🎬 [MovieDetails] Clicou em Assistir. URL do filme:', movie.url);
    if (!movie.url) {
      alert('Filme completo não disponível para este título.');
      return;
    }
    openPlayer({
      id: movie.id,
      title: movie.titulo,
      type: 'movie',
      videoUrl: movie.url,
      poster: movie.poster,
      year: movie.ano
    });
  };

  const handleToggleFavorite = async () => {
    if (!movie) return;
    
    await toggleFavorite({
      content_id: parseInt(movie.id),
      content_type: 'movie',
      titulo: movie.titulo,
      poster: movie.poster,
      banner: movie.banner,
      rating: movie.rating,
      year: movie.ano,
      genero: movie.genero
    });
  };

  // Gerar porcentagem de match
  const getMatchPercentage = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return 85 + (Math.abs(hash) % 14);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#000401] z-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <span className="text-white text-lg">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="fixed inset-0 bg-[#000401] z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Filme não encontrado</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-white text-black px-6 py-2 rounded hover:bg-gray-200 transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const matchPercentage = getMatchPercentage(movie.id);
  const generos = movie.genero?.split(',').map(g => g.trim()) || [];

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col pt-0">
      {/* Header com Background - Altura reduzida */}
      <div className="relative h-[35vh] min-h-[200px] max-h-[280px] overflow-hidden flex-shrink-0">
        <div className="absolute inset-0">
          <img
            src={movie.banner || movie.poster}
            alt={movie.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Botão Voltar */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Voltar</span>
        </motion.button>

        {/* Informações Principais */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="container mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 line-clamp-1">{movie.titulo}</h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span>{movie.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{movie.ano}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{movie.duracao}</span>
                </div>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {movie.genero}
                </span>
                {movie.classificacao && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {movie.classificacao}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePlayMovie}
                  className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-900 transition-colors text-sm"
                >
                  <Play size={16} fill="white" />
                  Assistir
                </button>
                
                <button
                  onClick={handlePlayTrailer}
                  title="Trailer"
                  className="flex items-center justify-center bg-[#FF0000] hover:bg-[#CC0000] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold transition-colors shadow-lg"
                >
                  <Play size={20} fill="white" />
                </button>
                
                <button
                  onClick={handleToggleFavorite}
                  className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm"
                >
                  {movie && isFavorite(parseInt(movie.id), 'movie') ? (
                    <><Check size={16} /> Na Lista</>
                  ) : (
                    <><Plus size={16} /> Lista</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal - Layout Compacto em Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto max-w-7xl px-4 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full py-4">
            
            {/* Coluna 1: Sinopse e Elenco */}
            <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden">
              {/* Sinopse */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-gray-900/50 rounded-lg p-3"
              >
                <h2 className="text-sm font-bold mb-1 text-gray-400 uppercase tracking-wider">Sinopse</h2>
                <p className="text-gray-200 text-sm leading-relaxed line-clamp-4">
                  {movie.description || 'Nenhuma descrição disponível para este filme.'}
                </p>
              </motion.div>

              {/* Elenco e Direção - Lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                {movie.diretor && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-gray-900/50 rounded-lg p-3"
                  >
                    <h3 className="text-xs font-bold mb-1 text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={12} /> Direção
                    </h3>
                    <p className="text-gray-200 text-sm line-clamp-2">{movie.diretor}</p>
                  </motion.div>
                )}
                
                {movie.elenco && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.25 }}
                    className="bg-gray-900/50 rounded-lg p-3"
                  >
                    <h3 className="text-xs font-bold mb-1 text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} /> Elenco
                    </h3>
                    <p className="text-gray-200 text-sm line-clamp-2">{movie.elenco}</p>
                  </motion.div>
                )}
              </div>

              {/* Filmes Relacionados - Scroll Horizontal */}
              {relatedMovies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-gray-900/50 rounded-lg p-3 flex-1 flex flex-col min-h-0"
                >
                  <h3 className="text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider">Relacionados</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-600">
                    {relatedMovies.slice(0, 6).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * index }}
                        className="flex-shrink-0 w-[100px]"
                      >
                        <div 
                          onClick={() => navigate(`/movie-details/${item.id}`)}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-[2/3] rounded overflow-hidden mb-1">
                            <img 
                              src={item.poster} 
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-xs text-gray-300 line-clamp-1 group-hover:text-white">{item.titulo}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Coluna 2: Informações */}
            <div className="flex flex-col gap-3">
              {/* Detalhes do Filme */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="bg-gray-900/50 rounded-lg p-3"
              >
                <h3 className="text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Info size={12} /> Detalhes
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duração</span>
                    <span className="text-gray-200">{movie.duracao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ano</span>
                    <span className="text-gray-200">{movie.ano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gênero</span>
                    <span className="text-gray-200">{movie.genero}</span>
                  </div>
                  {movie.classificacao && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Classificação</span>
                      <span className="text-gray-200">{movie.classificacao}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-700/50">
                    <span className="text-gray-500">Avaliação</span>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-200">{movie.rating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Mini Trailer Thumbnail */}
              {movie.trailer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="bg-gray-900/50 rounded-lg p-3 flex-1 flex flex-col min-h-0"
                >
                  <h3 className="text-xs font-bold mb-2 text-gray-400 uppercase tracking-wider">Trailer</h3>
                  <div 
                    onClick={handlePlayTrailer}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group flex-1"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.titulo}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full group-hover:bg-white/30 transition-colors">
                        <Play size={16} className="fill-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
