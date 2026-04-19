import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowLeft, Star, Calendar, Clock, Info, Plus, Check, Users, ChevronDown, ChevronLeft, ChevronRight, Share2, Monitor, Tv } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../hooks/useFavorites';
import { fetchTmdbSeries, tmdbImageUrl } from '../services/tmdb';

// Interface da Série (mapeada do banco)
interface Series {
  id_n: string;
  tmdb_id?: string;
  titulo: string;
  descricao?: string;
  ano?: string;
  capa?: string;
  banner?: string;
  trailer?: string;
  genero?: string;
  elenco?: string;
  classificacao?: string;
  pais?: string;
  diretor?: string;
}

interface Temporada {
  id: string;
  id_n: string;
  serie_id: string;
  numero_temporada: number;
  titulo?: string;
  capa?: string;
  banner?: string;
}

interface Episodio {
  id: string;
  id_n: string;
  temporada_id: string;
  numero_episodio: number;
  titulo: string;
  descricao?: string;
  duracao?: string;
  arquivo?: string;
  imagem_185?: string;
  imagem_342?: string;
  imagem_500?: string;
  banner?: string;
}

interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

interface TmdbCredits {
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
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

const SeriesDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openPlayer } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [episodios, setEpisodios] = useState<Episodio[]>([]);
  const [relatedSeries, setRelatedSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [tmdbData, setTmdbData] = useState<TmdbDetails | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (id) {
      fetchSeriesData();
    }
  }, [id]);

  const fetchTmdbData = async (tmdbId: string) => {
    try {
      console.log('🎬 [SeriesDetails] Buscando dados TMDB para série:', tmdbId);
      const data = await fetchTmdbSeries(tmdbId);
      if (data) {
        console.log('✅ [SeriesDetails] Dados TMDB recebidos:', data);
        setTmdbData({
          backdrop_path: data.backdrop_path,
          credits: data.credits,
          videos: data.videos
        });
        
        // Set cast from TMDB
        if (data.credits?.cast && data.credits.cast.length > 0) {
          setCast(data.credits.cast.slice(0, 10).map((actor: any) => ({
            id: actor.id,
            name: actor.name,
            character: actor.character,
            profile_path: actor.profile_path
          })));
        }
      }
    } catch (error) {
      console.error('❌ [SeriesDetails] Erro ao buscar dados TMDB:', error);
    }
  };

  const fetchSeriesData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar série por id_n
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('*')
        .eq('id_n', parseInt(id || '0'))
        .single();

      if (seriesError || !seriesData) {
        console.error('❌ [SeriesDetails] Erro ao buscar série:', seriesError);
        throw new Error('Série não encontrada');
      }

      // Cast to any to handle dynamic Supabase columns
      const rawData = seriesData as any;
      
      const mappedSeries: Series = {
        id_n: String(rawData.id_n),
        tmdb_id: rawData.tmdb_id,
        titulo: rawData.titulo,
        descricao: rawData.descricao,
        ano: String(rawData.ano || ''),
        capa: rawData.capa,
        banner: rawData.banner,
        trailer: rawData.trailer,
        genero: rawData.genero,
        elenco: rawData.elenco || '',
        classificacao: rawData.classificacao || '',
        pais: rawData.pais || '',
        diretor: rawData.diretor || ''
      };

      setSeries(mappedSeries);
      
      // Buscar dados adicionais do TMDB se tiver tmdb_id
      if (mappedSeries.tmdb_id) {
        await fetchTmdbData(mappedSeries.tmdb_id);
      } else if (mappedSeries.elenco) {
        // Fallback to local cast data
        const castList = mappedSeries.elenco.split(',').map((name, idx) => ({
          id: idx,
          name: name.trim(),
          character: ''
        }));
        setCast(castList.slice(0, 6));
      }

      // Buscar temporadas
      const { data: tempsData, error: tempsError } = await supabase
        .from('temporadas')
        .select('*')
        .eq('serie_id', parseInt(id || '0'))
        .order('numero_temporada', { ascending: true });

      if (!tempsError && tempsData) {
        const mappedTemps: Temporada[] = tempsData.map((t: any) => ({
          id: String(t.id || t.id_n),
          id_n: String(t.id_n),
          serie_id: String(t.serie_id),
          numero_temporada: t.numero_temporada,
          titulo: t.titulo,
          capa: t.capa,
          banner: t.banner
        }));
        setTemporadas(mappedTemps);

        // Buscar episódios das temporadas
        if (mappedTemps.length > 0) {
          const temporadaIds = mappedTemps.map(t => parseInt(t.id_n)).filter(Boolean);
          
          if (temporadaIds.length > 0) {
            const { data: epsData, error: epsError } = await supabase
              .from('episodios')
              .select('*')
              .in('temporada_id', temporadaIds)
              .order('numero_episodio', { ascending: true });

            if (!epsError && epsData) {
              const mappedEps: Episodio[] = epsData.map((ep: any) => ({
                id: String(ep.id || ep.id_n),
                id_n: String(ep.id_n),
                temporada_id: String(ep.temporada_id),
                numero_episodio: ep.numero_episodio,
                titulo: ep.titulo,
                descricao: ep.descricao,
                duracao: ep.duracao,
                arquivo: ep.arquivo,
                imagem_185: ep.imagem_185,
                imagem_342: ep.imagem_342,
                imagem_500: ep.imagem_500,
                banner: ep.banner
              }));
              setEpisodios(mappedEps);
            }
          }
        }
      }

      // Buscar séries relacionadas
      const { data: relatedData, error: relatedError } = await supabase
        .from('series')
        .select('*')
        .neq('id_n', parseInt(id || '0'))
        .ilike('genero', `%${mappedSeries.genero}%`)
        .limit(12);

      if (!relatedError && relatedData) {
        const mappedRelated: Series[] = relatedData.map((s: any) => ({
          id_n: String(s.id_n),
          tmdb_id: s.tmdb_id,
          titulo: s.titulo,
          descricao: s.descricao,
          ano: String(s.ano || ''),
          capa: s.capa,
          banner: s.banner,
          trailer: s.trailer,
          genero: s.genero,
          elenco: s.elenco,
          classificacao: s.classificacao,
          pais: s.pais,
          diretor: s.diretor
        }));
        setRelatedSeries(mappedRelated);
      }

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEpisodesBySeason = (seasonNum: number) => {
    const temporada = temporadas.find(t => t.numero_temporada === seasonNum);
    if (!temporada) return [];
    
    return episodios.filter(ep => ep.temporada_id === temporada.id_n);
  };

  const handlePlayEpisode = (episodio: Episodio) => {
    if (series && episodio.arquivo) {
      openPlayer({
        id: episodio.id_n,
        title: `${series.titulo} - ${episodio.titulo}`,
        type: 'series',
        videoUrl: episodio.arquivo,
        poster: episodio.imagem_342 || episodio.imagem_185 || series.capa || series.banner,
        year: series.ano
      });
    }
  };

  const handlePlayFirstEpisode = () => {
    const currentEps = getEpisodesBySeason(selectedSeason);
    const firstEp = currentEps[0];
    if (firstEp) {
      handlePlayEpisode(firstEp);
    }
  };

  const handlePlayTrailer = () => {
    if (series?.trailer) {
      openPlayer({
        id: series.id_n,
        title: series.titulo,
        type: 'series',
        videoUrl: series.trailer,
        poster: series.banner || series.capa,
        year: series.ano
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!series) return;
    
    await toggleFavorite({
      content_id: parseInt(series.id_n),
      content_type: 'series',
      titulo: series.titulo,
      poster: series.banner || series.capa,
      banner: series.banner,
      rating: series.classificacao || 'N/A',
      year: series.ano,
      genero: series.genero
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

  // Skeleton Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
          
        {/* Hero Skeleton */}
        <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          
          <div className="absolute top-20 sm:top-24 left-4 z-20">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6">
            <div className="container mx-auto">
              <div className="h-8 sm:h-12 md:h-16 bg-gray-700 rounded animate-pulse w-3/4 mb-4" />
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse" />
                <div className="h-6 w-24 bg-gray-700 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-gray-700 rounded-full animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="max-w-4xl">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>

        {/* Cast Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-700 rounded-full mx-auto animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Episodes Skeleton */}
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black">
          <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-xl">Série não encontrada</div>
        </div>
      </div>
    );
  }

  const currentEpisodes = getEpisodesBySeason(selectedSeason);
  const totalTemporadas = temporadas.length || 1;
  const totalEpisodios = episodios.length;
  const currentSeasonEpisodes = getEpisodesBySeason(selectedSeason);
  const hasEpisodes = currentSeasonEpisodes.length > 0;
  const matchPercentage = getMatchPercentage(String(series.id_n));
  const generos = series.genero?.split(',').map((g: string) => g.trim()) || [];
  
  // Usar backdrop do TMDB se disponível
  const backdropUrl = tmdbData?.backdrop_path 
    ? tmdbImageUrl(tmdbData.backdrop_path, 'original')
    : series.banner || series.capa;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* ============================================
          CAMADA 0: FUNDO - Backdrop claro e nítido com vignette suave
          ============================================ */}
      <div className="fixed inset-0 z-0">
        {/* Backdrop Image - clara e nítida com brilho aumentado */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${backdropUrl})`,
            filter: 'blur(8px) brightness(1.15) saturate(1.1)',
            transform: 'scale(1.05)'
          }}
        />
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
          onClick={() => navigate(-1)}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-full hover:bg-black/60 hover:border-cyan-400/50 transition-all duration-300 group"
        >
          <ArrowLeft size={18} className="text-cyan-400 group-hover:text-cyan-300" />
          <span className="text-sm font-medium text-white/90">Voltar</span>
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
                  src={series.capa || series.banner}
                  alt={series.titulo}
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
                {hasEpisodes && (
                  <button
                    onClick={handlePlayFirstEpisode}
                    className="col-span-2 flex items-center justify-center gap-2 bg-[#00A8E1] hover:bg-[#0095C8] text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00A8E1]/30"
                  >
                    <Play size={20} fill="currentColor" />
                    <span>Assistir T{String(selectedSeason).padStart(2, '0')}E01</span>
                  </button>
                )}
                
                <button
                  onClick={handleToggleFavorite}
                  className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-cyan-500/30 hover:bg-white/20 hover:border-cyan-400/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
                >
                  {series && isFavorite(parseInt(series.id_n), 'series') ? (
                    <><Check size={18} className="text-cyan-400" /> <span>Na Lista</span></>
                  ) : (
                    <><Plus size={18} className="text-cyan-400" /> <span>Lista</span></>
                  )}
                </button>
                
                {series.trailer && (
                  <button
                    onClick={handlePlayTrailer}
                    className="flex items-center justify-center gap-2 bg-[#FF0000] hover:bg-[#CC0000] text-white font-medium py-3 px-4 rounded-lg transition-all duration-300"
                  >
                    <Play size={18} fill="white" />
                    <span>Trailer</span>
                  </button>
                )}
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
                {/* Badges de Qualidade */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 rounded-full text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor size={14} />
                    HD
                  </span>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/50 rounded-full text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Série
                  </span>
                  {totalTemporadas > 1 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 rounded-full text-xs font-bold text-green-300 uppercase tracking-wider">
                      {totalTemporadas} Temporadas
                    </span>
                  )}
                </div>

                {/* Título Premium com text-shadow para legibilidade */}
                <h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)' }}
                >
                  {series.titulo}
                </h1>
                
                {/* Metadata Panel - Metadados Inteligentes */}
                <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
                  {/* Nota/Classificação com estilo neon */}
                  {series.classificacao && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30">
                      <Star size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      <span className="font-bold text-yellow-100">{series.classificacao}</span>
                    </div>
                  )}

                  {/* Rating de Recomendação (Match %) - Cor Neon */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 px-3 py-1.5 rounded-full border border-cyan-400/30">
                    <Check size={16} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <span className="font-bold text-cyan-100">{matchPercentage}%</span>
                    <span className="text-cyan-400/70 text-xs">Match</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Calendar size={16} className="text-cyan-400" />
                    <span>{series.ano}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Tv size={16} className="text-cyan-400" />
                    <span>{totalEpisodios} eps</span>
                  </div>
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
                    {series.descricao || 'Nenhuma descrição disponível para esta série.'}
                  </p>
                </motion.div>
              </div>

              {/* Elenco TMDB - Glassmorphism Card com Grid Responsivo */}
              {cast.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                >
                  <h3 className="text-sm font-bold mb-3 text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} /> Elenco
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {cast.map((actor, idx) => (
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
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-cyan-500/50"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0 ring-2 ring-cyan-500/50">
                            <Users size={16} className="text-cyan-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white/90 text-sm font-medium truncate">{actor.name}</p>
                          <p className="text-white/50 text-xs truncate">{actor.character}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Seção de Episódios */}
              {totalEpisodios > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                >
                  {/* Header com Seletor de Temporadas */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Play size={20} className="text-cyan-400" />
                        Episódios
                      </h3>
                      <span className="px-2 py-0.5 bg-cyan-500/30 text-cyan-300 rounded-full text-xs font-semibold">
                        {currentEpisodes.length} eps
                      </span>
                    </div>
                    
                    {/* Seletor de Temporadas Elegante */}
                    {temporadas.length > 1 && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-cyan-500/30 px-4 py-2 rounded-lg transition-all duration-300"
                        >
                          <span className="font-semibold">Temporada {selectedSeason}</span>
                          <ChevronDown size={18} className={`transition-transform duration-300 ${showSeasonDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                          {showSeasonDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md border border-cyan-500/30 rounded-lg overflow-hidden z-50 min-w-[200px]"
                            >
                              {temporadas.map((temp) => (
                                <button
                                  key={temp.id}
                                  onClick={() => {
                                    setSelectedSeason(temp.numero_temporada);
                                    setShowSeasonDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors ${selectedSeason === temp.numero_temporada ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/80'}`}
                                >
                                  Temporada {temp.numero_temporada}
                                  {temp.titulo && <span className="text-white/50 text-sm ml-2">- {temp.titulo}</span>}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {/* Grid de Episódios */}
                  {currentEpisodes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentEpisodes.map((episodio, index) => (
                        <motion.div
                          key={episodio.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.05 * index }}
                          className="group cursor-pointer"
                          onClick={() => handlePlayEpisode(episodio)}
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 ring-1 ring-white/10 group-hover:ring-cyan-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20">
                            <img
                              src={episodio.imagem_342 || episodio.imagem_185 || episodio.banner || series.capa || series.banner}
                              alt={episodio.titulo}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="bg-cyan-500/90 backdrop-blur-sm p-3 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
                                <Play size={24} className="text-black fill-black ml-0.5" />
                              </div>
                            </div>
                            {/* Episode Number Badge */}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                              E{String(episodio.numero_episodio).padStart(2, '0')}
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <h4 className="font-semibold text-white group-hover:text-cyan-300 transition-colors text-sm line-clamp-1">
                              {episodio.titulo}
                            </h4>
                            {episodio.descricao && (
                              <p className="text-xs text-white/50 line-clamp-2 mt-1">{episodio.descricao}</p>
                            )}
                            {episodio.duracao && (
                              <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                                <Clock size={12} />
                                {episodio.duracao}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/50 text-center py-8">
                      Nenhum episódio encontrado para esta temporada.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Séries Relacionadas */}
              {relatedSeries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-xl p-5"
                >
                  <h3 className="text-sm font-bold mb-4 text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Play size={16} /> Séries Relacionadas
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent">
                    {relatedSeries.slice(0, 8).map((item, index) => (
                      <motion.div
                        key={item.id_n}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 * index }}
                        className="flex-shrink-0 w-[140px]"
                      >
                        <div 
                          onClick={() => navigate(`/series-details/${item.id_n}`)}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden mb-2 shadow-lg shadow-black/50 group-hover:shadow-cyan-500/20 transition-all duration-300">
                            <img 
                              src={item.capa || item.banner} 
                              alt={item.titulo}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-sm text-white/80 line-clamp-1 group-hover:text-cyan-300 transition-colors">{item.titulo}</p>
                          <p className="text-xs text-white/50">{item.ano}</p>
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

export default SeriesDetails;
