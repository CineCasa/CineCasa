import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Play, ThumbsUp, Share2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoJSPlayer from "@/components/VideoJSPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { FavoriteButton } from "@/components/FavoriteButton";
import CastSection from "@/components/CastSection";
import { getProxiedUrl, isArchiveOrgUrl } from "@/utils/videoProxy";

interface MovieData {
  id: string;
  title: string;
  name?: string;
  overview: string;
  description?: string;
  poster_path?: string;
  backdrop_path?: string;
  banner?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  vote_average?: number;
  genres?: { name: string }[];
  credits?: {
    cast: { name: string; profile_path?: string; character?: string }[];
    crew: { name: string; job: string }[];
  };
  adult?: boolean;
  number_of_seasons?: number;
  seasons?: any[];
  tagline?: string;
  production_companies?: { name: string; logo_path?: string }[];
  spoken_languages?: { english_name: string }[];
  status?: string;
  origin_country?: string[];
  awards?: { name: string; year: number }[];
}

interface Recommendation {
  id: string;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
}

const Details = () => {
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<MovieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isTrailerMode, setIsTrailerMode] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [castList, setCastList] = useState<{ name: string; profile_path?: string; character?: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTmdbDetails = async (tmdbId: string, mediaType: string) => {
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        console.warn('TMDB API key not configured');
        return null;
      }
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}&language=pt-BR&append_to_response=credits,videos`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao buscar TMDB:", error);
      return null;
    }
  };

  const fetchRecommendations = async (searchId: string, searchType: string) => {
    setRecommendationsLoading(true);
    try {
      // Validate searchId before querying
      const numericId = Number(searchId);
      if (isNaN(numericId)) {
        console.warn('Invalid searchId for recommendations:', searchId);
        setRecommendations([]);
        return;
      }

      const table = searchType === "cinema" ? "cinema" : "series";
      const idColumn = searchType === "cinema" ? "id" : "id_n";
      
      const { data: supabaseData, error } = await supabase
        .from(table)
        .select("id, titulo, poster, rating, year, genero")
        .neq(idColumn, numericId)
        .limit(12);

      if (error) throw error;

      if (supabaseData && supabaseData.length > 0) {
        const formattedItems = supabaseData.map((item: any) => ({
          id: item.id?.toString() || item.id_n?.toString(),
          title: item.titulo,
          poster_path: item.poster,
          vote_average: parseFloat(item.rating) || 0,
          release_date: item.year?.toString(),
        }));
        // Shuffle recommendations randomly on every load
        const shuffledItems = formattedItems.sort(() => Math.random() - 0.5);
        setRecommendations(shuffledItems);
      }
    } catch (error) {
      console.error("Erro ao buscar recomendações:", error);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const fetchLocalData = async (itemId: string, itemType: string) => {
    try {
      const table = itemType === "cinema" ? "cinema" : "series";
      const idColumn = itemType === "cinema" ? "id" : "id_n";
      
      const { data, error } = await supabase
        .from(table)
        .select("*, tmdb_id")
        .eq(idColumn, Number(itemId))
        .maybeSingle();
      
      if (error) {
        console.error("Erro:", error);
        return null;
      }
      
      if (!data) {
        console.warn("Nenhum dado encontrado para ID:", itemId);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Erro:", error);
      return null;
    }
  };

  const mergeData = (localData: any, tmdbData: any): MovieData => {
    // Start with local data as base
    const baseData: MovieData = {
      id: localData.id || localData.id_n,
      title: localData.titulo,
      overview: localData.description || "",
      poster_path: localData.poster,
      backdrop_path: localData.banner,
      release_date: localData.year?.toString(),
      vote_average: parseFloat(localData.rating) || 0,
      genres: localData.genero ? localData.genero.split(",").map((g: string) => ({ name: g.trim() })) : [],
      credits: { cast: [], crew: [] },
      origin_country: [],
      awards: [],
    };
    
    // If no TMDB data, return base local data
    if (!tmdbData) {
      return baseData;
    }
    
    // Helper to build TMDB image URL
    const getTmdbImageUrl = (path: string | null) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      return `https://image.tmdb.org/t/p/original${path}`;
    };
    
    // Merge TMDB data with local data (TMDB enriches local data)
    return {
      ...baseData,
      // TMDB enriches these fields
      overview: tmdbData.overview || baseData.overview,
      backdrop_path: getTmdbImageUrl(tmdbData.backdrop_path) || baseData.backdrop_path,
      poster_path: getTmdbImageUrl(tmdbData.poster_path) || baseData.poster_path,
      release_date: tmdbData.release_date || tmdbData.first_air_date || baseData.release_date,
      runtime: tmdbData.runtime,
      vote_average: tmdbData.vote_average || baseData.vote_average,
      genres: tmdbData.genres || baseData.genres,
      credits: tmdbData.credits || baseData.credits,
      adult: tmdbData.adult,
      tagline: tmdbData.tagline,
      production_companies: tmdbData.production_companies,
      spoken_languages: tmdbData.spoken_languages,
      status: tmdbData.status,
      origin_country: tmdbData.origin_country || baseData.origin_country,
      // For series
      number_of_seasons: tmdbData.number_of_seasons,
      seasons: tmdbData.seasons,
    };
  };

  const fetchVideoUrl = async (searchId: string) => {
    try {
      const table = type === "cinema" ? "cinema" : "series";
      
      const { data: result } = await supabase
        .from(table)
        .select("id, url, trailer, titulo, tmdb_id")
        .eq("id", Number(searchId))
        .maybeSingle();

      if (result?.url) return result.url;
      if (result?.trailer) return result.trailer;
      return null;
    } catch (error) {
      console.error("Erro ao buscar vídeo:", error);
      return null;
    }
  };

  const getTmdbTrailerUrl = (videos: any): string | null => {
    if (!videos?.results?.length) return null;
    const trailer = videos.results.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
    return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadDetails = async () => {
      setLoading(true);
      
      if (id && (type === "cinema" || type === "series")) {
        const tmdbType = type === "cinema" ? "movie" : "tv";
        
        const localData = await fetchLocalData(id, type);
        
        if (!localData) {
          console.error("Conteúdo não encontrado no banco local");
          setLoading(false);
          return;
        }
        
        const url = await fetchVideoUrl(id);
        setVideoUrl(url);
        
        let tmdbData = null;
        if (localData.tmdb_id) {
          tmdbData = await fetchTmdbDetails(localData.tmdb_id.toString(), tmdbType);
          if (tmdbData?.videos) {
            setTrailerUrl(getTmdbTrailerUrl(tmdbData.videos));
          }
          if (tmdbData?.credits?.cast) {
            setCastList(tmdbData.credits.cast.slice(0, 12));
          }
        }
        
        const mergedData = mergeData(localData, tmdbData);
        setData(mergedData);
        
        await fetchRecommendations(id, type);
      }
      
      setLoading(false);
    };

    loadDetails();
  }, [id, type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000401] overflow-x-hidden">
        {/* Skeleton Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
        
        {/* Skeleton Content */}
        <div className="relative z-10 px-4 md:px-8 lg:px-12 xl:px-16 pt-[120px] pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Skeleton Back Button */}
            <div className="w-24 h-10 bg-gray-800/50 rounded-lg animate-pulse mb-6" />
            
            {/* Skeleton Title */}
            <div className="w-3/4 h-12 md:h-16 bg-gray-800/50 rounded-lg animate-pulse mb-4" />
            <div className="w-1/2 h-8 md:h-10 bg-gray-800/50 rounded-lg animate-pulse mb-8" />
            
            {/* Skeleton Metadata */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="w-16 h-6 bg-gray-800/50 rounded-md animate-pulse" />
              <div className="w-20 h-6 bg-gray-800/50 rounded-md animate-pulse" />
              <div className="w-24 h-6 bg-gray-800/50 rounded-md animate-pulse" />
              <div className="w-28 h-6 bg-gray-800/50 rounded-md animate-pulse" />
            </div>
            
            {/* Skeleton Description */}
            <div className="w-full max-w-2xl h-4 bg-gray-800/50 rounded animate-pulse mb-2" />
            <div className="w-5/6 max-w-2xl h-4 bg-gray-800/50 rounded animate-pulse mb-8" />
            
            {/* Skeleton Buttons */}
            <div className="flex flex-wrap gap-3 mb-12">
              <div className="w-32 h-12 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-[20px] animate-pulse" />
              <div className="w-28 h-12 border border-gray-700 rounded-[20px] animate-pulse" />
              <div className="w-12 h-12 rounded-full border border-gray-700 animate-pulse" />
            </div>
            
            {/* Skeleton Poster and Info Section */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Skeleton Poster */}
              <div className="w-48 md:w-56 lg:w-64 aspect-[2/3] bg-gray-800/50 rounded-lg animate-pulse mx-auto md:mx-0" />
              
              {/* Skeleton Info Cards */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="h-20 bg-gray-800/50 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-800/50 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-800/50 rounded-lg animate-pulse" />
                <div className="h-20 bg-gray-800/50 rounded-lg animate-pulse col-span-2 md:col-span-1" />
              </div>
            </div>
            
            {/* Skeleton Cast Section */}
            <div className="mt-12">
              <div className="w-24 h-8 bg-gray-800/50 rounded-lg animate-pulse mb-4" />
              <div className="flex gap-4 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-800/50 animate-pulse mb-2" />
                    <div className="w-16 h-4 bg-gray-800/50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#000401] flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Conteúdo não encontrado</h1>
          <p className="text-gray-400">O conteúdo que você está procurando não está disponível.</p>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded font-medium hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
      </div>
    );
  }

  const releaseYear = data.release_date || data.first_air_date
    ? new Date(data.release_date || data.first_air_date || "").getFullYear()
    : null;

  const duration = data.runtime
    ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`
    : data.number_of_seasons 
    ? `${data.number_of_seasons} Temporada${data.number_of_seasons > 1 ? 's' : ''}`
    : null;

  const director = data.credits?.crew?.find((c) => c.job === "Director")?.name;
  const genres = data.genres?.map((g) => g.name).join(" • ") || "";

  return (
    <div className="min-h-screen bg-[#000401] text-white overflow-x-hidden">
      {/* Hero Section - Premium Design System Blueprint */}
      <div ref={heroRef} className="relative w-full h-auto z-0 pb-20 overflow-hidden">
        {/* CAMADA 0: Background simples sem blur para compatibilidade mobile */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
              backgroundImage: `url(${data.backdrop_path || data.banner || data.poster_path || "/placeholder-backdrop.jpg"})`,
              opacity: 0.6
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000401]/90 via-transparent to-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative flex flex-col justify-start mt-[70px] pt-20 pb-8 md:pb-12 lg:pb-16">
          <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              {/* Back Button - Above Title */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white hover:text-cyan-400 transition-all bg-black/40 hover:bg-black/60 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-400/50 px-4 py-2 rounded-lg mb-2 group"
              >
                <ChevronLeft size={24} />
                <span className="text-sm font-medium">Voltar</span>
              </motion.button>

              {/* Title - Always visible */}
              <div className="relative z-[9999]">
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="mt-16 md:mt-20"
                >
                {data.tagline && (
                  <p className="text-gray-300 text-sm md:text-base mb-2 tracking-wide uppercase">{data.tagline}</p>
                )}
                <h1 className="details-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-tight drop-shadow-2xl text-white visible">
                  {data.title}
                </h1>
              </motion.div>
            </div>

            {/* Metadata */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-300"
              >
                {releaseYear && <span className="backdrop-blur-sm bg-black/30 px-2 py-1 rounded-md border border-cyan-500/20">{releaseYear}</span>}
                {data.adult && <span className="backdrop-blur-sm bg-red-500/20 px-2 py-1 rounded-md border border-red-500/30 text-xs">A18</span>}
                {duration && <span className="backdrop-blur-sm bg-black/30 px-2 py-1 rounded-md border border-cyan-500/20">{duration}</span>}
                {/* Badge Qualidade 4K Ultra HD */}
                <span className="backdrop-blur-sm bg-cyan-500/20 px-3 py-1 rounded-md border border-cyan-400/50 flex items-center gap-1.5 hover:bg-cyan-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                  <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-cyan-400 font-bold text-xs tracking-wider">4K ULTRA HD</span>
                </span>
                
                {/* Nota TMDB com cor neon */}
                {data.vote_average && data.vote_average > 0 && (
                  <span className="backdrop-blur-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-1 rounded-md border border-cyan-400/50 flex items-center gap-1.5 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <span className="text-cyan-400 font-bold text-lg group-hover:text-cyan-300 transition-colors">{data.vote_average.toFixed(1)}</span>
                    <span className="text-gray-400 text-xs">/10</span>
                    <span className="text-cyan-400/70 text-xs ml-1">TMDB</span>
                  </span>
                )}
                
                {/* Rating de Recomendação com cor neon */}
                {data.vote_average && (
                  <span className="backdrop-blur-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1 rounded-md border border-green-400/50 flex items-center gap-1.5 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <svg className="w-4 h-4 text-green-400 group-hover:text-green-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-green-400 font-bold text-lg group-hover:text-green-300 transition-colors">{Math.round((data.vote_average / 10) * 100)}%</span>
                    <span className="text-green-400/70 text-xs ml-1">Recomendação</span>
                  </span>
                )}
              </motion.div>

              {/* Country Flags - Below metadata */}
              {data.origin_country && data.origin_country.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.22 }}
                  className="flex flex-wrap gap-2 mt-1"
                >
                  {data.origin_country.map((country) => (
                    <img
                      key={country}
                      src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                      alt={country}
                      className="w-6 h-4 md:w-8 md:h-5 rounded object-cover shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {/* Genres */}
              {genres && (
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="text-sm md:text-base text-cyan-400/90 font-medium">
                  {genres}
                </motion.p>
              )}

              {/* Description */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="text-sm md:text-base lg:text-lg text-gray-200 line-clamp-2 max-w-xl leading-relaxed">
                {data.overview}
              </motion.p>

              {/* Action Buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
                {/* Botão Assistir - Gradiente Azul Neon Vibrante */}
                <button
                  onClick={() => { if (videoUrl) { setIsTrailerMode(false); setIsPlayerOpen(true); } }}
                  disabled={!videoUrl}
                  className={`relative flex items-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 rounded-[20px] font-semibold text-sm md:text-base transition-all duration-300 overflow-hidden group ${videoUrl ? "hover:scale-105" : "cursor-not-allowed"}`}
                >
                  {videoUrl && (
                    <>
                      {/* Background with logo color */}
                      <div className="absolute inset-0 bg-[#00A8E1]" />
                      {/* Hover effect */}
                      <div className="absolute inset-0 bg-[#0095C8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {/* Glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(0,168,225,0.6)]" />
                    </>
                  )}
                  {!videoUrl && (
                    <div className="absolute inset-0 bg-gray-700" />
                  )}
                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-2 md:gap-3 text-white">
                    <Play size={20} className="md:w-6 md:h-6" fill="white" />
                    {videoUrl ? "Assistir" : "Indisponível"}
                  </span>
                </button>

                {/* Botão Trailer - Estilo YouTube Vermelho */}
                <button
                  onClick={() => {
                    if (!trailerUrl) {
                      alert('Trailer não disponível para este conteúdo.');
                      return;
                    }
                    setIsTrailerMode(true);
                    setIsPlayerOpen(true);
                  }}
                  className="relative flex items-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 rounded-[20px] font-semibold text-sm md:text-base bg-[#FF0000] text-white hover:bg-[#CC0000] hover:scale-105 transition-all duration-300 group overflow-hidden shadow-lg shadow-red-500/30"
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[inset_0_0_20px_rgba(255,255,255,0.2)]" />
                  {/* Content */}
                  <span className="relative z-10 flex items-center gap-2 md:gap-3">
                    <Play size={20} className="md:w-6 md:h-6" fill="white" />
                    Trailer
                  </span>
                </button>

                {data && (
                  <FavoriteButton
                    item={{
                      contentId: parseInt(id || '0') || 0,
                      contentType: type === 'series' ? 'series' : 'movie',
                      titulo: data.title || data.name || 'Sem título',
                      poster: data.poster_path,
                      banner: data.backdrop_path || data.banner,
                      rating: data.vote_average?.toString(),
                      year: (data.release_date || data.first_air_date)?.split('-')[0],
                      genero: data.genres?.[0]?.name,
                    }}
                    userId={user?.id}
                    size="lg"
                  />
                )}

                <button className="p-2.5 md:p-3.5 rounded-full border-2 border-gray-400 text-white hover:border-white transition-all duration-200 hover:scale-110">
                  <ThumbsUp size={20} className="md:w-6 md:h-6" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - CAMADA 2: Interface Glassmorphism */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 relative z-10 pb-20">
        <div className="details-container max-w-7xl xl:max-w-8xl 2xl:max-w-9xl mx-auto">
          {/* CAMADA 1: Poster com drop-shadow-2xl e bordas arredondadas */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 mx-auto md:mx-0"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-30 group-hover:opacity-70 blur transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(0,229,255,0.5)]" />
                <img 
                  src={data.poster_path || data.backdrop_path || "/placeholder-poster.jpg"}
                  alt={data.title}
                  className="details-poster relative w-48 sm:w-52 md:w-56 lg:w-64 xl:w-72 2xl:w-80 rounded-lg drop-shadow-2xl object-cover aspect-[2/3] group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-poster.jpg";
                  }}
                />
              </div>
            </motion.div>
            
            {/* Metadata Panel - Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex-1 backdrop-blur-md bg-black/30 border border-cyan-500/20 rounded-xl p-4 md:p-6"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">Informações</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.vote_average && (
                  <div className="backdrop-blur-sm bg-cyan-400/10 border border-cyan-500/30 rounded-lg p-3 text-center hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Nota TMDB</p>
                    <p className="text-2xl font-bold text-white">{data.vote_average.toFixed(1)}<span className="text-sm text-gray-400">/10</span></p>
                  </div>
                )}
                {releaseYear && (
                  <div className="backdrop-blur-sm bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-center hover:bg-black/60 hover:border-cyan-400/40 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Ano</p>
                    <p className="text-2xl font-bold text-white">{releaseYear}</p>
                  </div>
                )}
                {duration && (
                  <div className="backdrop-blur-sm bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-center hover:bg-black/60 hover:border-cyan-400/40 hover:scale-105 transition-all duration-300 cursor-pointer">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Duração</p>
                    <p className="text-xl font-bold text-white">{duration}</p>
                  </div>
                )}
                {director && (
                  <div className="backdrop-blur-sm bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-center hover:bg-black/60 hover:border-cyan-400/40 hover:scale-105 transition-all duration-300 cursor-pointer col-span-2 md:col-span-1">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1">Direção</p>
                    <p className="text-lg font-bold text-white truncate">{director}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Cast Section */}
          {castList.length > 0 && (
            <CastSection cast={castList.map((actor, idx) => ({ id: idx, name: actor.name, character: actor.character || '', profile_path: actor.profile_path || null }))} />
          )}

          {/* Awards */}
          {data.awards && data.awards.length > 0 && (
            <section className="mt-8 md:mt-12">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Prêmios</h3>
              <div className="space-y-2">
                {data.awards.slice(0, 3).map((award, index) => (
                  <motion.div
                    key={`${award.name}-${award.year}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 backdrop-blur-md bg-black/40 border border-cyan-500/30 rounded-lg px-3 py-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-400 text-sm">🏆</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium line-clamp-1">{award.name}</p>
                      <p className="text-xs text-gray-400">{award.year}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Metadata - All Movie Info */}
          {(director || data.credits?.cast?.length || data.credits?.crew?.length || data.production_companies?.length || data.spoken_languages?.length || data.status) && (
            <section className="mt-8 md:mt-12">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Informações do Filme</h3>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-wrap gap-x-4 gap-y-2 text-xs md:text-sm text-gray-400">
                {director && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Direção:</span>
                    <span className="text-gray-300">{director}</span>
                  </div>
                )}
                {data.credits?.cast && data.credits.cast.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Elenco:</span>
                    <span className="text-gray-300">{data.credits.cast.slice(0, 3).map(c => c.name).join(", ")}</span>
                  </div>
                )}
                {data.credits?.crew?.filter(c => c.job === "Writer" || c.job === "Screenplay").length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Roteiro:</span>
                    <span className="text-gray-300">{data.credits.crew.filter(c => c.job === "Writer" || c.job === "Screenplay").slice(0, 2).map(c => c.name).join(", ")}</span>
                  </div>
                )}
                {data.production_companies && data.production_companies.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Produção:</span>
                    <span className="text-gray-300">{data.production_companies.slice(0, 2).map(p => p.name).join(", ")}</span>
                  </div>
                )}
                {data.spoken_languages && data.spoken_languages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Idioma:</span>
                    <span className="text-gray-300">{data.spoken_languages.slice(0, 2).map(l => l.english_name).join(", ")}</span>
                  </div>
                )}
                {data.status && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-gray-300">{data.status}</span>
                  </div>
                )}
              </motion.div>
            </section>
          )}

          {/* Recommendations - Infinite Horizontal Scroll */}
          {recommendations.length > 0 && (
            <section className="mt-12 md:mt-16 relative group/section">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-white">Indicações</h2>
              </div>
              {recommendationsLoading ? (
                <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] w-[140px] md:w-[180px] bg-gray-800 rounded-md animate-pulse flex-shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {recommendations.slice(0, 5).map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-[2/3] w-[140px] md:w-[180px] rounded-md overflow-hidden cursor-pointer bg-gray-800 relative group flex-shrink-0"
                      onClick={() => navigate(`/details/cinema/${movie.id}`)}
                    >
                      <img
                        src={movie.poster_path || "/placeholder-poster.jpg"}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">{movie.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="text-green-400 font-medium">{movie.vote_average?.toFixed(1)}</span>
                          {movie.release_date && (
                            <span>{new Date(movie.release_date).getFullYear()}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {isPlayerOpen && data && (
          <VideoJSPlayer
            url={(() => {
              let url = isTrailerMode ? trailerUrl || "" : videoUrl || "";
              // Apply proxy for archive.org URLs to bypass CORS
              if (url && isArchiveOrgUrl(url)) {
                url = getProxiedUrl(url);
              }
              console.log('[Details] VideoJSPlayer URL:', url);
              return url;
            })()}
            title={data.title || "Sem título"}
            onClose={() => {
              console.log('[Details] Fechando player');
              setIsPlayerOpen(false);
            }}
            contentType={(type as 'movie' | 'series') || 'movie'}
            contentId={id || ""}
            poster={data.poster_path || ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Details;
