// TMDB API Configuration via Cloudflare Worker
const WORKER_URL = "https://cinecasa-worker.cinecasa-worker.workers.dev";
const TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMWY1ZjFmMzU5ZDk0ZjY5M2U4ZjFiNzY5ZTc1NjMzZDZhNyIsInN1YiI6IjY3ODM5ZmFkM2Q4ZDQ5MDJhOWJkNGU4ZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.1nCqkKQk6JX5N7Y8Z9T3mB1q2L3p4r5s6t7u8v9w0x";
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
    // Tentar Worker primeiro
    let res = await fetch(
      `${WORKER_URL}/tmdb/details?tmdb=${tmdbId}&type=${type}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Fallback para API direta se Worker falhar
    if (!res.ok) {
      console.log('[TMDB] Worker falhou, usando API direta');
      res = await fetch(
        `${TMDB_BASE_URL}/${type}/${tmdbId}?language=pt-BR`,
        {
          headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` }
        }
      );
    }
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching TMDB details:", error);
    return null;
  }
};

export const fetchTmdbSeason = async (tmdbId: string, seasonNumber: number) => {
  try {
    // Tentar Worker primeiro
    let res = await fetch(
      `${WORKER_URL}/tmdb/season?tmdb=${tmdbId}&season=${seasonNumber}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    // Fallback para API direta se Worker falhar
    if (!res.ok) {
      console.log('[TMDB] Worker falhou, usando API direta para season');
      res = await fetch(
        `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?language=pt-BR`,
        {
          headers: { 'Authorization': `Bearer ${TMDB_API_KEY}` }
        }
      );
    }
    
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


export const getTmdbTrailerUrl = (videos: any) => {
  if (!videos?.results?.length) return null;
  // Prioritize YouTube Trailers
  const trailer = videos.results.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  ) || videos.results.find((v: any) => v.site === "YouTube");
  
  if (trailer) return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}`;
  return null;
};

// ── Busca thumbnails do worker para preview na scrubber ──────────────────────
const SCRUBBER_WORKER_URL = "https://cinecasa-worker.cinecasa-worker.workers.dev";

export const fetchScrubberThumbnails = async (
  tmdbId: string,
  tmdbType: 'movie' | 'tv',
  duration: number
): Promise<{ time: number; url: string }[]> => {
  if (!tmdbId || !duration) return [];
  try {
    const endpoint = `${SCRUBBER_WORKER_URL}/tmdb/images?tmdb=${tmdbId}&type=${tmdbType}&duration=${Math.round(duration)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return data.thumbnails || [];
  } catch {
    return [];
  }
};

export const fetchEpisodeThumbnails = async (
  tmdbId: string,
  season: number,
  episode: number,
  duration: number
): Promise<{ time: number; url: string }[]> => {
  if (!tmdbId) return [];
  try {
    const endpoint = `${SCRUBBER_WORKER_URL}/tmdb/episode-images?tmdb=${tmdbId}&season=${season}&episode=${episode}&duration=${Math.round(duration)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];
    const data = await res.json();
    return data.thumbnails || [];
  } catch {
    return [];
  }
};
