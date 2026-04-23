import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Plus, Check, ArrowLeft, Star, Calendar, Clock, Info, User, Users, Heart, Share2, Monitor, Smartphone, Tv } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../hooks/useFavorites';
import { fetchTmdbMovie, tmdbImageUrl } from '../services/tmdb';

// Helper to convert YouTube URL to embed format
const getYoutubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  // If already embed format, return as is
  if (url.includes('youtube.com/embed/')) return url;
  // Extract video ID from various YouTube URL formats
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
};

interface Movie {
  id: number;
  titulo: string;
  poster: string;
  banner?: string;
  description: string;
  year: string;
  category: string;
  rating: string;
  url?: string;
  tmdb_id?: string;
  imdb_id?: string;
  trailer?: string;
  diretor?: string;
  elenco?: string;
  classificacao?: string;
  // Campos mapeados para compatibilidade
  ano?: string;
  genero?: string;
  duracao?: string;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
  }>;
}

interface TmdbDetails {
  backdrop_path: string | null;
  credits?: TmdbCredits;
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
    }>;
  };
}

const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openPlayer, closePlayer, isPlayerOpen } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [tmdbData, setTmdbData] = useState<TmdbDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
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
        .select('id, titulo, poster, url, trailer, description, year, category, rating, tmdb_id')
        .eq('id', parseInt(id || '0'))
        .single();

      if (error) {
        console.error('❌ [MovieDetails] Erro Supabase:', error);
        throw new Error(`Erro ao buscar filme: ${error.message}`);
      }
      
      console.log('✅ [MovieDetails] Filme encontrado:', data);
      
      const movieData = data as any;
      const mappedMovie = {
        ...movieData,
        ano: movieData.year,
        genero: movieData.category,
        duracao: 'N/A'
      } as Movie;
      
      setMovie(mappedMovie);
      
      // Buscar dados adicionais do TMDB se tiver tmdb_id
      if (mappedMovie.tmdb_id) {
        await fetchTmdbData(mappedMovie.tmdb_id);
      }
    } catch (error) {
      console.error('❌ [MovieDetails] Erro ao buscar detalhes do filme:', error);
      setMovie(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTmdbData = async (tmdbId: string) => {
    try {
      console.log('🎬 [MovieDetails] Buscando dados TMDB para:', tmdbId);
      const data = await fetchTmdbMovie(tmdbId);
      if (data) {
        console.log('✅ [MovieDetails] Dados TMDB recebidos:', data);
        setTmdbData({
          backdrop_path: data.backdrop_path,
          credits: data.credits,
          videos: data.videos
        });
      }
    } catch (error) {
      console.error('❌ [MovieDetails] Erro ao buscar dados TMDB:', error);
    }
  };

  const fetchRelatedMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('cinema')
        .select('*')
        .neq('id', parseInt(id || '0'))
        .ilike('category', `%${movie?.category}%`)
        .limit(12);

      if (error) throw error;
      const relatedData = (data || []).map((item: any) => ({
        ...item,
        ano: item.year,
        genero: item.category,
        duracao: 'N/A'
      })) as Movie[];
      setRelatedMovies(relatedData);
    } catch (error) {
      console.error('Erro ao buscar filmes relacionados:', error);
    }
  };

  const handlePlayTrailer = () => {
    if (!movie?.trailer) {
      alert('Trailer não disponível.');
      return;
    }
    const embedUrl = getYoutubeEmbedUrl(movie.trailer);
    console.log('[MovieDetails] Opening trailer:', { original: movie.trailer, embed: embedUrl });
    openPlayer({
      id: String(movie.id),
      title: movie.titulo,
      type: 'movie',
      videoUrl: embedUrl,
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
      id: String(movie.id),
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
      content_id: movie.id,
      content_type: 'movie',
      titulo: movie.titulo,
      poster: movie.poster,
      banner: movie.poster,
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

  const matchPercentage = getMatchPercentage(String(movie.id));
  const generos = movie.category?.split(',').map((g: string) => g.trim()) || [];
  // Usar backdrop do TMDB se disponível, senão usar poster do Supabase
  const backdropUrl = tmdbData?.backdrop_path 
    ? tmdbImageUrl(tmdbData.backdrop_path, 'original')
    : movie.poster;
    
  // Extrair elenco do TMDB se disponível
  const tmdbCast = tmdbData?.credits?.cast?.slice(0, 10) || [];
  const tmdbCrew = tmdbData?.credits?.crew || [];
  const directors = tmdbCrew.filter((person: any) => person.job === 'Director').map((p: any) => p.name);
  const directorName = directors.length > 0 ? directors.join(', ') : movie.diretor;
  const movieYear = movie.ano || movie.year;
  const movieGenre = movie.genero || movie.category;
  const movieDuration = movie.duracao || 'N/A';

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* ============================================
          CAMADA 0: FUNDO - Backdrop responsivo sem cortar elementos
          ============================================ */}
      <div className="fixed inset-0 z-0">
        {/* Backdrop Image - responsiva mantendo proporção sem cortar */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover object-center lg:object-top"
            style={{
              filter: 'blur(8px) brightness(1.15) saturate(1.1)',
              transform: 'scale(1.02)'
            }}
          />
        </div>
        {/* Vignette suave nas bordas - mantém foco no centro */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)'
          }}
        />
        {/* Overlay leve na parte inferior para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* ============================================
          CAMADA 1 & 2: CONTEÚDO E INTERFACE
          ============================================ */}
      <div className="relative z-10 min-h-screen">
        {/* Botão Voltar - Glassmorphism */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => {
            if (isPlayerOpen) {
              closePlayer();
            } else {
              navigate(-1);
            }
          }}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-full hover:bg-black/60 hover:border-cyan-400/50 transition-all duration-300 group"
        >
          <ArrowLeft size={18} className="text-cyan-400 group-hover:text-cyan-300" />
          <span className="text-sm font-medium text-white/90">{isPlayerOpen ? 'Fechar' : 'Voltar'}</span>
        </motion.button>

        {/* Container Principal */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Coluna Esquerda: Poster + Info Principal */}
            <div className="lg:col-span-4 xl:col-span-3">
              {/* Poster com sombra projetada (Camada 1) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative aspect-[2/3] rounded-lg overflow-hidden drop-shadow-2xl shadow-2xl"
              >
                <img
                  src={movie.poster}
                  alt={movie.titulo}
                  onLoad={() => setImageLoaded(true)}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gray-800 animate-pulse" />
                )}
                {/* Glow effect no poster */}
                <div className="absolute inset-0 rounded-lg ring-1 ring-white/10" />
              </motion.div>

              {/* Ações rápidas - Glassmorphism cards (Camada 2) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 grid grid-cols-2 gap-3"
              >
                <button
                  onClick={handlePlayMovie}
                  className="col-span-2 flex items-center justify-center gap-2 bg-[#00A8E1] hover:bg-[#0095C8] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00A8E1]/30"
                >
                  <Play size={20} fill="currentColor" />
                  <span>Assistir</span>
                </button>
                
                <button
                  onClick={handleToggleFavorite}
                  className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-cyan-500/30 hover:bg-white/20 hover:border-cyan-400/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
                  title={movie && isFavorite(movie.id, 'movie') ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  {movie && isFavorite(movie.id, 'movie') ? (
                    <Heart size={20} className="text-red-500 fill-red-500" />
                  ) : (
                    <Heart size={20} className="text-cyan-400" />
                  )}
                </button>

                <button
                  onClick={handlePlayTrailer}
                  className="flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#cc0000] text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#FF0000]/30"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Trailer</span>
                </button>

                <button className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-cyan-500/30 hover:bg-white/20 hover:border-cyan-400/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300">
                  <Share2 size={18} className="text-cyan-400" />
                  <span>Compartilhar</span>
                </button>
              </motion.div>
            </div>

            {/* Coluna Direita: Informações Detalhadas */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              {/* Título e Metadata Principal - Glassmorphism Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6"
              >
                {/* Badge Qualidade 4K Ultra HD */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 rounded-full text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    4K Ultra HD
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Dolby Vision
                  </span>
                </div>

                {/* Título Premium text-4xl font-bold com text-shadow para legibilidade */}
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)' }}
                >
                  {movie.titulo}
                </h1>
                
                {/* Metadata Panel - Metadados Inteligentes */}
                <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
                  {/* Nota TMDB com estilo neon */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30">
                    <Star size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                    <span className="font-bold text-yellow-100">{movie.rating}</span>
                    <span className="text-yellow-400/70 text-xs">TMDB</span>
                  </div>

                  {/* Rating de Recomendação (Match %) - Cor Neon */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 px-3 py-1.5 rounded-full border border-cyan-400/30">
                    <svg className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="font-bold text-cyan-100">{matchPercentage}%</span>
                    <span className="text-cyan-400/70 text-xs">Match</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Calendar size={16} className="text-cyan-400" />
                    <span>{movieYear}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Clock size={16} className="text-cyan-400" />
                    <span>{movieDuration}</span>
                  </div>
                  
                  {movie.classificacao && (
                    <span className="px-3 py-1 bg-white/10 rounded-full text-white/80 border border-white/20 font-medium">
                      {movie.classificacao}
                    </span>
                  )}
                </div>

                {/* Gêneros */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {generos.map((genero: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-200 hover:bg-cyan-500/30 transition-colors cursor-default"
                    >
                      {genero}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sinopse - Glassmorphism Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="md:col-span-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                >
                  <h2 className="text-sm font-bold mb-3 text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Info size={16} /> Sinopse
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-base">
                    {movie.description || 'Nenhuma descrição disponível para este filme.'}
                  </p>
                </motion.div>

                {/* Direção - Glassmorphism Card */}
                {directorName && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                  >
                    <h3 className="text-sm font-bold mb-2 text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <User size={16} /> Direção
                    </h3>
                    <p className="text-white/90">{directorName}</p>
                  </motion.div>
                )}
                
                {/* Elenco TMDB - Glassmorphism Card com Grid Responsivo */}
                {(tmdbCast.length > 0 || movie.elenco) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                    className="md:col-span-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                  >
                    <h3 className="text-sm font-bold mb-3 text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Users size={16} /> Elenco
                    </h3>
                    
                    {tmdbCast.length > 0 ? (
                      /* Grid de Elenco TMDB com fotos */
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {tmdbCast.map((actor, idx) => (
                          <motion.div
                            key={actor.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.05 * idx }}
                            className="flex items-center gap-2 bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors"
                          >
                            {actor.profile_path ? (
                              <img
                                src={tmdbImageUrl(actor.profile_path, 'w500')}
                                alt={actor.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                                <User size={16} className="text-cyan-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-white/90 text-sm font-medium truncate">{actor.name}</p>
                              <p className="text-white/50 text-xs truncate">{actor.character}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback para elenco em texto */
                      <p className="text-white/90 text-sm leading-relaxed">{movie.elenco}</p>
                    )}
                  </motion.div>
                )}

                {/* Trailer - Glassmorphism Card */}
                {movie.trailer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="md:col-span-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                  >
                    <h3 className="text-sm font-bold mb-3 text-cyan-400 uppercase tracking-wider">Trailer</h3>
                    <div 
                      onClick={handlePlayTrailer}
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={movie.poster}
                        alt={movie.titulo}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[#FF0000] backdrop-blur-sm p-4 rounded-full group-hover:bg-[#CC0000] group-hover:scale-110 transition-all duration-300 shadow-lg shadow-red-500/30">
                          <Play size={28} className="fill-white text-white ml-1" />
                        </div>
                      </div>
                      <div className="absolute inset-0 border border-white/10 rounded-lg" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Filmes Relacionados - Glassmorphism Section */}
              {relatedMovies.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                >
                  <h3 className="text-sm font-bold mb-4 text-cyan-400 uppercase tracking-wider">Filmes Relacionados</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
                    {relatedMovies.slice(0, 8).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 * index }}
                        className="flex-shrink-0 w-[140px]"
                      >
                        <div 
                          onClick={() => navigate(`/movie-details/${item.id}`)}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-lg shadow-black/50 group-hover:shadow-cyan-500/20 transition-all duration-300">
                            <img 
                              src={item.poster} 
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-sm text-white/80 line-clamp-1 group-hover:text-cyan-300 transition-colors">{item.titulo}</p>
                          <p className="text-xs text-white/50">{item.year || item.ano}</p>
                        </div>
                      </motion.div>
                    ))}
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
