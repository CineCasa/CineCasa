import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Plus, ThumbsUp, Heart, ChevronLeft } from "lucide-react";
import { fetchTmdbDetails, fetchTmdbSeason, getTmdbTrailerUrl, tmdbImageUrl } from "@/services/tmdb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NetflixPlayer from "@/components/NetflixPlayer";

const Details = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadDetails = async () => {
      setLoading(true);
      if (id && (type === "cinema" || type === "series")) {
        const tmdbType = type === "cinema" ? "movie" : "tv";
        // Simulando que o ID veio com o formato tmdb-ID. Ex: series-1234. No roteamento nós vamos passar o tmdb_id real.
        const res = await fetchTmdbDetails(id, tmdbType);
        if (res) {
          setData(res);
          setTrailerUrl(getTmdbTrailerUrl(res.videos));
          if (tmdbType === "tv" && res.seasons && res.seasons.length > 0) {
            // Find first real season (ignore specials if season 0)
            const firstRealSeason = res.seasons.find((s: any) => s.season_number > 0) || res.seasons[0];
            setSelectedSeason(firstRealSeason.season_number);
          }
        }
      }
      setLoading(false);
    };

    loadDetails();
  }, [id, type]);

  useEffect(() => {
    if (type === "series" && data && selectedSeason !== null) {
      const loadSeason = async () => {
        const season = await fetchTmdbSeason(id!, selectedSeason);
        setSeasonData(season);
      };
      loadSeason();
    }
  }, [selectedSeason, type, data, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center animate-pulse pt-20">
          <span className="text-white text-xl">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20 space-y-4">
          <span className="text-white text-xl">Conteúdo não encontrado.</span>
          <button onClick={() => navigate(-1)} className="text-primary hover:underline">Voltar</button>
        </div>
      </div>
    );
  }

  const duration =
    type === "cinema"
      ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`
      : `${data.number_of_seasons} Temporadas`;

  const releaseYear = (data.release_date || data.first_air_date || "").split("-")[0];
  const director = data.credits?.crew?.find((c: any) => c.job === "Director")?.name;
  const cast = data.credits?.cast?.slice(0, 5).map((c: any) => c.name).join(", ");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Hero Section Prime Style */}
      <section className="relative w-full min-h-[85vh] md:min-h-[100vh] flex flex-col justify-end pt-32 pb-20 md:pb-40">
        <div className="absolute inset-0 z-0">
          <img
            src={tmdbImageUrl(data.backdrop_path, "original")}
            alt={data.title || data.name}
            className="w-full h-full object-cover object-top opacity-70"
          />
          {/* Gradients to fade smoothly into background */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent w-[80%] md:w-[60%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent h-full top-0" />
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-12 flex flex-col gap-6 max-w-7xl">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors w-fit mb-4 group"
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-semibold">Voltar</span>
          </button>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-tight drop-shadow-2xl max-w-4xl tracking-tight">
            {data.title || data.name}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-semibold text-white/90">
            <span className="text-[#00A8E1] font-bold text-lg drop-shadow-md">STREAM+</span>
            <span className="text-[#ffff5c] font-bold text-lg">{(data.vote_average || 0).toFixed(1)}</span>
            <span>{duration}</span>
            <span>{releaseYear}</span>
            <span className="px-2 py-0.5 border border-white/30 rounded scale-90 opacity-80 uppercase text-xs">
              {data.adult ? "18+" : "Livre"}
            </span>
            <span>4K HDR</span>
          </div>

          <p className="text-lg md:text-xl text-white/80 max-w-3xl leading-relaxed drop-shadow-md font-medium">
            {data.overview}
          </p>

          <div className="text-sm md:text-base text-white/60 space-y-1 max-w-3xl mt-2">
             <p><span className="text-white/40">Estrelando</span> {cast}</p>
             {director && <p><span className="text-white/40">Direção</span> {director}</p>}
             <p><span className="text-white/40">Gêneros</span> {data.genres?.map((g: any) => g.name).join(", ")}</p>
          </div>

          {/* Core Actions */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button 
              onClick={() => setIsPlayerOpen(true)}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 md:py-5 rounded-md font-bold text-lg md:text-xl hover:bg-white/90 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] focus-visible"
            >
              <Play size={28} fill="currentColor" />
              Assistir Agora
            </button>
            
            {trailerUrl && (
              <button 
                 onClick={() => setIsPlayerOpen(true)}
                 className="flex items-center gap-3 bg-white/10 text-white px-8 py-4 md:py-5 rounded-md font-bold text-lg md:text-xl hover:bg-white/20 transition-transform backdrop-blur-md border border-white/20 hover:scale-105 focus-visible"
              >
                Trailer
              </button>
            )}

            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-4 md:p-5 rounded-full border transition-all hover:scale-105 focus-visible ${
                isFavorite 
                  ? "bg-primary border-primary text-white" 
                  : "border-white/40 text-white hover:bg-white/20 bg-background/50 backdrop-blur-md"
              }`}
            >
              <Plus size={24} className={isFavorite ? "rotate-45" : ""} />
            </button>
            <button className="p-4 md:p-5 rounded-full border border-white/40 text-white hover:bg-white/20 transition-all bg-background/50 backdrop-blur-md hover:scale-105 focus-visible">
              <ThumbsUp size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Tabs / Episodes Section (For Series) */}
      {type === "series" && data.seasons && (
        <section className="relative z-10 w-full px-4 md:px-12 py-12 bg-background mx-auto max-w-[1400px]">
          <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide">
            {data.seasons
              .filter((s: any) => s.season_number > 0)
              .sort((a: any, b: any) => a.season_number - b.season_number)
              .map((season: any) => (
              <button
                key={season.id}
                onClick={() => setSelectedSeason(season.season_number)}
                className={`text-xl md:text-2xl font-bold whitespace-nowrap transition-colors transition-transform focus-visible focus:outline-none rounded-sm ${
                  selectedSeason === season.season_number
                    ? "text-white scale-105"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {season.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {!seasonData ? (
               <div className="col-span-full py-20 text-center text-white/50 animate-pulse">Carregando episódios...</div>
            ) : (
               seasonData.episodes?.map((episode: any) => (
                 <div 
                   key={episode.id} 
                   className="group relative flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer focus-visible focus:outline-none focus:ring-4 focus:ring-white"
                   tabIndex={0}
                 >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/50">
                      <img 
                        src={tmdbImageUrl(episode.still_path, "w500")} 
                        alt={episode.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                         <Play size={40} fill="white" className="text-white" />
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-bold rounded">
                         {episode.runtime ? `${episode.runtime} min` : "Lançamento"}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight group-hover:text-primary transition-colors">
                        {episode.episode_number}. {episode.name}
                      </h4>
                      <p className="text-white/50 text-sm mt-2 line-clamp-3 leading-relaxed">
                        {episode.overview || "Nenhuma sinopse disponível para este episódio."}
                      </p>
                    </div>
                 </div>
               ))
            )}
          </div>
        </section>
      )}

      {/* Footer Pushed Down */}
      <div className="mt-auto">
        <Footer />
      </div>

      {/* Fullscreen Video Player */}
      {isPlayerOpen && (
        <NetflixPlayer 
          url={trailerUrl || ""} 
          title={data.title || data.name} 
          onClose={() => setIsPlayerOpen(false)} 
        />
      )}
    </div>
  );
};

export default Details;
