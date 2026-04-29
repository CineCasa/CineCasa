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

// Gamification Services
export { avatarService, type AvatarItem, type UserAvatarItem, type EquippedSlots, type AvatarCategory, type ItemRarity } from './AvatarService';
export { xpService, type UserXP, type UserLevel, type LevelConfig, type XPSourceType, type XPGainResult, type LevelInfo } from './XPService';
export { achievementService, type Achievement, type UserAchievement, type AchievementCategory, type AchievementTier } from './AchievementService';
export { gamificationService, type GamificationEvent, type GamificationResult } from './GamificationService';
