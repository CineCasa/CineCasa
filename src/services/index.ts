// Exportações do módulo de serviços

export {
  updateGenrePreferences,
  getUserFavoriteGenres,
  getContentByGenrePreferences,
  resetGenrePreferences,
  extractGenres,
  normalizeGenre,
  processGenres,
  GENRE_SCORE_CONFIG,
  type GenrePreference,
  type UserFavoriteGenre,
  type GenreActionType,
} from './genrePreferencesService';
