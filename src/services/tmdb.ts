// TMDB API Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Tamanhos de imagem otimizados para diferentes usos
export const TMDB_IMAGE_SIZES = {
  // Para banners hero - alta qualidade
  BACKDROP_ORIGINAL: 'original',
  BACKDROP_W1280: 'w1280',
  BACKDROP_W780: 'w780',
  
  // Para posters
  POSTER_ORIGINAL: 'original',
  POSTER_W780: 'w780',
  POSTER_W500: 'w500',
  POSTER_W342: 'w342',
  POSTER_W185: 'w185',
  
  // Para thumbnails
  STILL_W300: 'w300',
  STILL_W185: 'w185',
};

// Generate TMDB image URL com alta qualidade para banners
export const tmdbImageUrl = (path: string, size: string = 'w500'): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// URL otimizada para banners hero - usa original para máxima qualidade (1080p+)
export const tmdbBannerUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Usar original para banners garantir qualidade máxima (acima de 1080p)
  return `${TMDB_IMAGE_BASE_URL}/original${path}`;
};

// URL para posters com fallback de qualidade
export const tmdbPosterUrl = (path: string, highQuality: boolean = false): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const size = highQuality ? TMDB_IMAGE_SIZES.POSTER_W780 : TMDB_IMAGE_SIZES.POSTER_W500;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const fetchTmdbDetails = async (tmdbId: string, type: "movie" | "tv") => {
  try {
    const endpoint = type === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
    const res = await fetch(
      `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,external_ids`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    if (!res.ok) {
      console.error(`TMDB API error: ${res.status} for ${type} ${tmdbId}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching TMDB details:", error);
    return null;
  }
};

export const fetchTmdbSeason = async (tmdbId: string, seasonNumber: number) => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    if (!res.ok) {
      console.error(`TMDB API error: ${res.status} for season ${seasonNumber}`);
      return null;
    }
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


export const getTmdbTrailerUrl = (videos: any) => {
  if (!videos?.results?.length) return null;
  // Prioritize YouTube Trailers
  const trailer = videos.results.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  ) || videos.results.find((v: any) => v.site === "YouTube");
  
  if (trailer) return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}`;
  return null;
};
