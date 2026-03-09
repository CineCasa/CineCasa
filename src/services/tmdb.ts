const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const tmdbImageUrl = (path: string | null, size: "w500" | "w780" | "original" = "w500") => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const fetchTmdbDetails = async (tmdbId: string, type: "movie" | "tv") => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos,credits`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching TMDB details:", error);
    return null;
  }
};

export const fetchTmdbSeason = async (tmdbId: string, seasonNumber: number) => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching TMDB season ${seasonNumber}:`, error);
    return null;
  }
};

export const fetchTmdbMovie = async (tmdbId: string) => {
  return fetchTmdbDetails(tmdbId, "movie");
};

export const fetchTmdbSeries = async (tmdbId: string) => {
  return fetchTmdbDetails(tmdbId, "tv");
};

export const fetchTmdbDiscoverWatchProvider = async (providerId: number) => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_watch_providers=${providerId}&watch_region=BR&sort_by=popularity.desc&page=1`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching provider ${providerId}:`, error);
    return null;
  }
};

export const fetchTmdbTrendingWeek = async (type: "movie" | "tv") => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/${type}/week?api_key=${TMDB_API_KEY}&language=pt-BR`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error(`Error fetching trending ${type}:`, error);
    return null;
  }
};

export const getTmdbTrailerUrl = (videos: any) => {
  if (!videos?.results?.length) return null;
  // Prioritize YouTube Trailers
  const trailer = videos.results.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  ) || videos.results.find((v: any) => v.site === "YouTube");
  
  if (trailer) return `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&rel=0&showinfo=0&origin=${window.location.origin}`;
  return null;
};
