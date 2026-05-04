// TMDB API Configuration
// Token de Acesso de Leitura: eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiMjc1Y2U4ZTFhNmIzZDVkODc5YmIwOTA3ZTRmNTZhZCIsIm5iZiI6MTc2NzA1NjIxNS43MTI5OTk4LCJzdWIiOiI2OTUzMjM1NzFjNTI4MjJkM2JjYmRjYTYiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.ZkuZDskKQh1Wx3TQnh4Nk2VIB6ARPsY-ImkTZ6BdM5k
// Chave da API: b275ce8e1a6b3d5d879bb0907e4f56ad
const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
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

// URL otimizada para banners hero - usa original para máxima qualidade
export const tmdbBannerUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Usar original para banners garantir qualidade máxima
  return `${TMDB_IMAGE_BASE_URL}/${TMDB_IMAGE_SIZES.BACKDROP_ORIGINAL}${path}`;
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
  
  if (trailer) return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}`;
  return null;
};

// Buscar imagens (backdrops) para hero banners
export const fetchTmdbImages = async (tmdbId: string, type: "movie" | "tv") => {
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${tmdbId}/images?api_key=${TMDB_API_KEY}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching TMDB images:", error);
    return null;
  }
};

// Buscar backdrop específico - retorna o path do melhor backdrop disponível
export const getTmdbBackdropPath = async (tmdbId: string, type: "movie" | "tv") => {
  const data = await fetchTmdbImages(tmdbId, type);
  if (!data?.backdrops?.length) return null;
  
  // Ordenar por vote_average e pegar o melhor
  const sorted = data.backdrops.sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0));
  return sorted[0]?.file_path || null;
};

// Buscar detalhes completos com backdrop
export const fetchTmdbDetailsWithBackdrop = async (tmdbId: string, type: "movie" | "tv") => {
  try {
    // Buscar detalhes + imagens em uma chamada
    const res = await fetch(
      `${TMDB_BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=images,videos,credits`
    );
    if (!res.ok) return null;
    const data = await res.json();
    
    // Retornar backdrop_path preferencialmente, senão pegar da lista de backdrops
    let backdropPath = data.backdrop_path;
    if (!backdropPath && data.images?.backdrops?.length > 0) {
      const sorted = data.images.backdrops.sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0));
      backdropPath = sorted[0]?.file_path;
    }
    
    return {
      ...data,
      backdrop_path: backdropPath
    };
  } catch (error) {
    console.error("Error fetching TMDB details with backdrop:", error);
    return null;
  }
};
