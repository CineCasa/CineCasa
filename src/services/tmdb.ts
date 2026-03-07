const TMDB_API_KEY = "b275ce8e1a6b3d5d879bb0907e4f56ad";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const tmdbImageUrl = (path: string | null, size: string = "w500") => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const fetchTmdbMovie = async (tmdbId: string) => {
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos`
  );
  if (!res.ok) return null;
  return res.json();
};

export const fetchTmdbSeries = async (tmdbId: string) => {
  const res = await fetch(
    `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=videos`
  );
  if (!res.ok) return null;
  return res.json();
};

export const searchTmdb = async (query: string, type: "movie" | "tv" = "movie") => {
  const res = await fetch(
    `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
};

export const getTmdbTrailerUrl = (videos: any) => {
  if (!videos?.results?.length) return null;
  const trailer = videos.results.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );
  if (trailer) return `https://www.youtube.com/watch?v=${trailer.key}`;
  return null;
};
