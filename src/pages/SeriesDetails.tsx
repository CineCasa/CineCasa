import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Star, Calendar, Clock, Info, Plus, Check, Users, Globe, Clapperboard } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { usePlayer } from '../contexts/PlayerContext';
import { useFavorites } from '../hooks/useFavorites';
import PremiumCard from '../components/PremiumCard';

import { Series, Temporada, Episodio } from '../types/database';

interface CastMember {
  name: string;
  role?: string;
  photo?: string;
  character?: string;
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
  
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (id) {
      fetchSeriesData();
    }
  }, [id]);

  const fetchSeriesData = async () => {
    try {
      setIsLoading(true);
      
      let seriesData: Series | null = null;
      
      const { data: dataByIdN, error: errorByIdN } = await supabase
        .from('series')
        .select('*')
        .eq('id_n', id)
        .single();

      if (!errorByIdN && dataByIdN) {
        seriesData = dataByIdN;
      } else {
        const { data: dataById, error: errorById } = await supabase
          .from('series')
          .select('*')
          .eq('id', id)
          .single();
          
        if (!errorById && dataById) {
          seriesData = dataById;
        }
      }

      if (!seriesData) {
        throw new Error('Série não encontrada');
      }

      setSeries(seriesData);

      // Parse elenco se existir
      if (seriesData.elenco) {
        const castList = seriesData.elenco.split(',').map(name => ({
          name: name.trim(),
          role: 'Ator',
          photo: undefined
        }));
        setCast(castList.slice(0, 6)); // Limitar a 6 membros do elenco
      }

      const { data: tempsData, error: tempsError } = await supabase
        .from('temporadas')
        .select('*')
        .eq('serie_id', id)
        .order('numero_temporada', { ascending: true });

      if (!tempsError && tempsData) {
        setTemporadas(tempsData);
      }

      // Buscar episódios através das temporadas (não existe serie_id direto na tabela episodios)
      if (tempsData && tempsData.length > 0) {
        console.log('🔍 Buscando episódios para as temporadas:', tempsData.map(t => t.id_n || t.id));
        const temporadaIds = tempsData.map(t => t.id_n || t.id).filter(Boolean);
        
        if (temporadaIds.length > 0) {
          const { data: epsData, error: epsError } = await supabase
            .from('episodios')
            .select('*')
            .in('temporada_id', temporadaIds)
            .order('numero_episodio', { ascending: true });

          console.log('📊 Resultado episódios:', epsData);
          console.log('❌ Erro episódios:', epsError);

          if (!epsError && epsData) {
            console.log('✅ Episódios carregados:', epsData.length);
            setEpisodios(epsData);
          } else if (epsError) {
            console.error('❌ Erro ao carregar episódios:', epsError);
          }
        }
      }

      // Buscar séries relacionadas
      const { data: relatedData, error: relatedError } = await supabase
        .from('series')
        .select('*')
        .neq('id', id)
        .neq('id_n', id)
        .ilike('genero', `%${seriesData.genero}%`)
        .limit(12);

      if (!relatedError && relatedData) {
        setRelatedSeries(relatedData);
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
    
    return episodios.filter(ep => {
      // Verificar pelo temporada_id
      const matchById = ep.temporada_id === temporada.id_n || 
        ep.temporada_id === temporada.id;
      
      return matchById;
    });
  };

  const handlePlayEpisode = (episodio: Episodio) => {
    if (series && episodio.arquivo) {
      openPlayer({
        id: episodio.id_n || episodio.id,
        title: `${series.titulo} - ${episodio.titulo}`,
        type: 'series',
        videoUrl: episodio.arquivo,
        poster: episodio.imagem_342 || episodio.imagem_185 || series.capa || series.banner,
        year: series.ano
      });
    }
  };

  const handlePlayFirstEpisode = () => {
    const firstEp = getEpisodesBySeason(1)[0];
    if (firstEp) {
      handlePlayEpisode(firstEp);
    }
  };

  const handlePlayTrailer = () => {
    if (series?.trailer) {
      openPlayer({
        id: series.id,
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
      content_id: parseInt(series.id_n || series.id),
      content_type: 'series',
      titulo: series.titulo,
      poster: series.banner || series.capa,
      banner: series.banner,
      rating: series.rating,
      year: series.ano,
      genero: series.genero
    });
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
  const firstSeasonEpisodes = getEpisodesBySeason(1);
  const hasEpisodes = firstSeasonEpisodes.length > 0;

  console.log('🎬 Render - totalEpisodios:', totalEpisodios);
  console.log('🎬 Render - hasEpisodes:', hasEpisodes);
  console.log('🎬 Render - episodios:', episodios);
  console.log('🎬 Render - temporadas:', temporadas);

  return (
    <div className="min-h-screen bg-black text-white pb-16 md:pb-0 pt-[94px]">
      
      {/* Hero Banner - ajustado para mostrar imagem completa */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={series.banner || series.poster}
            alt={series.titulo}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-black/15" />
        </div>

        {/* Botão Voltar */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Voltar</span>
        </motion.button>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 sm:p-6">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-4">
                {series.titulo}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-sm">
                {series.rating && (
                  <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-yellow-400 font-semibold">{series.rating}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-300">
                  <Calendar size={14} />
                  <span>{series.ano}</span>
                </div>
                <span className="px-2 py-1 bg-white/20 rounded-full">
                  {series.genero}
                </span>
                <span className="px-2 py-1 bg-white/20 rounded-full">
                  {totalTemporadas} Temporada{totalTemporadas > 1 ? 's' : ''}
                </span>
                {totalEpisodios > 0 && (
                  <span className="px-2 py-1 bg-blue-500/30 rounded-full">
                    {totalEpisodios} Episódio{totalEpisodios > 1 ? 's' : ''}
                  </span>
                )}
                {series.classificacao && (
                  <span className="px-2 py-1 bg-green-500/30 text-green-400 rounded-full font-medium">
                    {series.classificacao}
                  </span>
                )}
              </div>

              {/* Diretor e País */}
              {(series.diretor || series.pais) && (
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-300">
                  {series.diretor && (
                    <div className="flex items-center gap-1">
                      <Clapperboard size={14} />
                      <span>Diretor: {series.diretor}</span>
                    </div>
                  )}
                  {series.pais && (
                    <div className="flex items-center gap-1">
                      <Globe size={14} />
                      <span>País: {series.pais}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Descrição/Sinopse - sem título */}
              {series.descricao && (
                <p className="text-gray-200 leading-relaxed text-sm sm:text-base mb-4 max-w-3xl line-clamp-3">
                  {series.descricao}
                </p>
              )}

              <div className="flex flex-row flex-nowrap gap-2 sm:gap-4 mb-4 overflow-x-auto scrollbar-hide">
                {hasEpisodes && (
                  <button
                    onClick={handlePlayFirstEpisode}
                    className="flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors text-sm sm:text-base"
                  >
                    <Play size={18} fill="white" />
                    Assistir Agora
                  </button>
                )}
                
                {series.trailer && (
                  <button
                    onClick={handlePlayTrailer}
                    title="Trailer"
                    className="flex items-center justify-center bg-[#FF0000] hover:bg-[#CC0000] text-white w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    <Play size={20} fill="white" />
                  </button>
                )}
                
                <button
                  onClick={handleToggleFavorite}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm sm:text-base"
                >
                  {series && isFavorite(parseInt(series.id_n || series.id), 'series') ? (
                    <>
                      <Check size={18} />
                      Na Lista
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Minha Lista
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Elenco com fotos redondas */}
      {cast.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Users size={20} className="text-white" />
              <h2 className="text-xl sm:text-2xl font-bold">Elenco</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-6">
              {cast.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="text-center group"
                >
                  <div className="relative mx-auto mb-2 sm:mb-3">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-700 group-hover:border-white transition-colors"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-800 flex items-center justify-center border-2 border-gray-700 group-hover:border-white transition-colors">
                        <Users size={24} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm sm:text-base text-white line-clamp-1">
                    {member.name}
                  </p>
                  {member.role && (
                    <p className="text-xs sm:text-sm text-gray-400">{member.role}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Episódios */}
      {totalEpisodios > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold">Episódios</h2>
                <span className="px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full text-sm">
                  {totalEpisodios} total
                </span>
              </div>
              {temporadas.length > 1 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-gray-800 px-3 sm:px-4 py-2 rounded-lg border border-gray-700 focus:border-white outline-none text-sm sm:text-base w-full sm:w-auto"
                >
                  {temporadas.map((temp) => (
                    <option key={temp.id} value={temp.numero_temporada}>
                      Temporada {temp.numero_temporada}
                      {temp.titulo ? ` - ${temp.titulo}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-gray-400 mb-4">
              {currentEpisodes.length} episódio{currentEpisodes.length > 1 ? 's' : ''} na Temporada {selectedSeason}
            </p>

            {currentEpisodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentEpisodes.map((episodio, index) => (
                  <motion.div
                    key={episodio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                    className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer group"
                    onClick={() => handlePlayEpisode(episodio)}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={episodio.imagem_342 || episodio.imagem_185 || episodio.banner || series.capa || series.banner}
                        alt={episodio.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={32} className="text-white sm:w-10 sm:h-10" />
                      </div>
                    </div>
                    
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                        {episodio.numero_episodio}. {episodio.titulo}
                      </h3>
                      {episodio.descricao && (
                        <p className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 line-clamp-2">
                          {episodio.descricao}
                        </p>
                      )}
                      {episodio.duracao && (
                        <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {episodio.duracao}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nenhum episódio encontrado para esta temporada.
              </p>
            )}
          </motion.div>
        </div>
      )}

      {relatedSeries.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Séries Relacionadas</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {relatedSeries.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05 * index }}
                >
                  <PremiumCard
                    id={item.id}
                    title={item.titulo}
                    poster={item.poster}
                    type="series"
                    year={item.ano}
                    rating={item.rating}
                    onClick={() => navigate(`/series-details/${item.id_n || item.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8"
        >
          <div>
            <h3 className="font-semibold mb-1 sm:mb-2 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <Info size={16} className="sm:w-5 sm:h-5" />
              Informações
            </h3>
            <div className="space-y-1 text-xs sm:text-sm text-gray-400">
              <p>{totalTemporadas} Temporada{totalTemporadas > 1 ? 's' : ''}</p>
              <p>{totalEpisodios} Episódio{totalEpisodios > 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Gênero</h3>
            <p className="text-xs sm:text-sm text-gray-400">{series.genero}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Lançamento</h3>
            <p className="text-xs sm:text-sm text-gray-400">{series.ano}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Classificação</h3>
            <div className="space-y-1">
              {series.rating && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500 fill-yellow-500 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm text-gray-400">{series.rating} / 10</span>
                </div>
              )}
              {series.classificacao && (
                <span className="inline-block px-2 py-0.5 bg-green-500/30 text-green-400 rounded text-xs">
                  {series.classificacao}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SeriesDetails;
