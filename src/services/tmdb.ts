const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Validar se o caminho é um UUID (commit SHA do git)
const isUUID = (str: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const shortSHA = /^[0-9a-f]{7,40}$/i;
  return uuidPattern.test(str) || (str.length >= 7 && str.length <= 40 && shortSHA.test(str));
};

export const tmdbImageUrl = (path: string | null, size: "w500" | "w780" | "original" = "w500") => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Detectar se o path é um UUID/commit SHA inválido
  const cleanPath = path.replace(/^\//, ''); // Remove leading slash
  if (isUUID(cleanPath)) {
    console.error('🚫 ERRO: UUID/Commit SHA sendo usado como caminho de imagem:', path);
    console.error('   Isso indica que o campo poster/capa contém dados incorretos do banco.');
    return ""; // Retorna vazio para usar fallback
  }
  
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
