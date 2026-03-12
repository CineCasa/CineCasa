import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronDown, ChevronUp, Clock, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  runtime: number;
  still_path: string;
  vote_average: number;
}

interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  overview: string;
  poster_path: string;
  air_date: string;
  episodes: Episode[];
}

interface SeriesEpisodesProps {
  seriesId: string;
  tmdbId?: number;
}

const SeriesEpisodes = ({ seriesId, tmdbId }: SeriesEpisodesProps) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSeriesData();
  }, [seriesId, tmdbId]);

  const fetchSeriesData = async () => {
    setLoading(true);
    try {
      if (tmdbId) {
        // Buscar dados do TMDB
        const seasonsData = await fetchTmdbSeasons(tmdbId);
        setSeasons(seasonsData);
      } else {
        // Buscar dados do Supabase (fallback)
        const supabaseData = await fetchSupabaseEpisodes(seriesId);
        setSeasons(supabaseData);
      }
    } catch (error) {
      console.error('Erro ao buscar episódios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTmdbSeasons = async (tmdbId: number): Promise<Season[]> => {
    const seasons: Season[] = [];
    
    // Buscar número de temporadas
    const seriesResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=pt-BR`
    );
    const seriesData = await seriesResponse.json();
    
    const numberOfSeasons = seriesData.number_of_seasons || 1;
    
    // Buscar detalhes de cada temporada
    for (let seasonNumber = 1; seasonNumber <= numberOfSeasons; seasonNumber++) {
      try {
        const seasonResponse = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${process.env.TMDB_API_KEY}&language=pt-BR`
        );
        const seasonData = await seasonResponse.json();
        
        if (seasonData.episodes) {
          const season: Season = {
            season_number: seasonNumber,
            name: seasonData.name || `Temporada ${seasonNumber}`,
            episode_count: seasonData.episodes.length,
            overview: seasonData.overview || '',
            poster_path: seasonData.poster_path || '',
            air_date: seasonData.air_date || '',
            episodes: seasonData.episodes.map((episode: any) => ({
              id: episode.id,
              episode_number: episode.episode_number,
              season_number: episode.season_number,
              name: episode.name,
              overview: episode.overview || '',
              air_date: episode.air_date || '',
              runtime: episode.runtime || 0,
              still_path: episode.still_path || '',
              vote_average: episode.vote_average || 0
            }))
          };
          seasons.push(season);
        }
      } catch (error) {
        console.error(`Erro ao buscar temporada ${seasonNumber}:`, error);
      }
    }
    
    return seasons;
  };

  const fetchSupabaseEpisodes = async (seriesId: string): Promise<Season[]> => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('series_id', seriesId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) throw error;

      // Agrupar episódios por temporada
      const episodesBySeason: { [key: number]: Episode[] } = {};
      
      (data as any)?.forEach((episode: any) => {
        if (!episodesBySeason[episode.season_number]) {
          episodesBySeason[episode.season_number] = [];
        }
        episodesBySeason[episode.season_number].push({
          id: episode.id,
          episode_number: episode.episode_number,
          season_number: episode.season_number,
          name: episode.name,
          overview: episode.overview || '',
          air_date: episode.air_date || '',
          runtime: episode.runtime || 0,
          still_path: episode.still_path || '',
          vote_average: episode.vote_average || 0
        });
      });

      // Converter para formato Season
      const seasons: Season[] = Object.keys(episodesBySeason).map(seasonNumber => ({
        season_number: parseInt(seasonNumber),
        name: `Temporada ${seasonNumber}`,
        episode_count: episodesBySeason[parseInt(seasonNumber)].length,
        overview: '',
        poster_path: '',
        air_date: '',
        episodes: episodesBySeason[parseInt(seasonNumber)]
      }));

      return seasons;
    } catch (error) {
      console.error('Erro ao buscar episódios do Supabase:', error);
      return [];
    }
  };

  const toggleEpisodeExpansion = (episodeId: string) => {
    setExpandedEpisodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(episodeId)) {
        newSet.delete(episodeId);
      } else {
        newSet.add(episodeId);
      }
      return newSet;
    });
  };

  const currentSeason = seasons.find(s => s.season_number === selectedSeason) || seasons[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#00A8E1] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!seasons.length) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">Nenhum episódio encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
      {/* Seletor de Temporadas */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Episódios</h2>
        
        {seasons.length > 1 && (
          <div className="flex gap-2">
            {seasons.map((season) => (
              <button
                key={season.season_number}
                onClick={() => setSelectedSeason(season.season_number)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  selectedSeason === season.season_number
                    ? 'bg-[#00A8E1] text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                T{season.season_number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Informações da Temporada */}
      {currentSeason && (
        <motion.div
          key={selectedSeason}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start gap-4 mb-4">
            {currentSeason.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w200${currentSeason.poster_path}`}
                alt={currentSeason.name}
                className="w-24 h-36 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{currentSeason.name}</h3>
              <p className="text-white/60 text-sm mb-2">
                {currentSeason.episode_count} episódios
                {currentSeason.air_date && ` • ${new Date(currentSeason.air_date).getFullYear()}`}
              </p>
              {currentSeason.overview && (
                <p className="text-white/80 text-sm">{currentSeason.overview}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Lista de Episódios */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {currentSeason?.episodes.map((episode) => (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail do Episódio */}
                  <div className="relative flex-shrink-0">
                    {episode.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                        alt={episode.name}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-[#00A8E1]/20 rounded-lg flex items-center justify-center">
                        <Play className="w-8 h-8 text-[#00A8E1]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Informações do Episódio */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">
                          {episode.episode_number}. {episode.name}
                        </h4>
                        <div className="flex items-center gap-3 text-white/60 text-sm mb-2">
                          {episode.runtime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {episode.runtime}min
                            </span>
                          )}
                          {episode.air_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(episode.air_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {episode.vote_average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {episode.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        
                        {/* Descrição (expansível) */}
                        {episode.overview && (
                          <div className="text-white/70 text-sm">
                            <p className={`${expandedEpisodes.has(episode.id) ? '' : 'line-clamp-2'}`}>
                              {episode.overview}
                            </p>
                            {episode.overview.length > 100 && (
                              <button
                                onClick={() => toggleEpisodeExpansion(episode.id)}
                                className="flex items-center gap-1 text-[#00A8E1] hover:text-[#0090c0] transition-colors mt-1"
                              >
                                {expandedEpisodes.has(episode.id) ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Mostrar menos
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Mostrar mais
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Botão de Play */}
                      <button
                        className="flex-shrink-0 w-10 h-10 bg-[#00A8E1] rounded-full flex items-center justify-center hover:bg-[#0090c0] transition-colors"
                        onClick={() => {
                          // Implementar lógica de reprodução do episódio
                          console.log('Reproduzir episódio:', episode.id);
                        }}
                      >
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SeriesEpisodes;
