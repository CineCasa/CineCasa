// Exportar todos os componentes de conteúdo inteligente
export { ContinueWatchingRow } from './ContinueWatchingRow';
export { RecommendationRow, SpecificRecommendations } from './RecommendationRow';
export { ContentDiscovery } from './ContentDiscovery';
export { AdvancedSearch } from './AdvancedSearch';
export { ContentIntelligence, ContentDashboard, PersonalizedHome, ExplorePage, SearchPage } from './ContentIntelligence';

// Exportar todos os componentes de perfil e personalização
export { ProfileSwitcher, ProfileAvatar, MiniProfile } from './ProfileSwitcher';
export { PersonalizedRecommendations } from './PersonalizedRecommendations';
export { WatchHistory } from './WatchHistory';
export { AvatarCustomizer, AvatarPreview } from './AvatarCustomizer';
export { ProfileDashboard } from './ProfileDashboard';

// Re-exportar componentes UI
export * from './ui';

// Re-exportar hooks de conteúdo
export * from '../hooks/useWatchProgress';
export * from '../hooks/useContinueWatching';
export * from '../hooks/useRecommendations';
export * from '../hooks/useContentDiscovery';
export * from '../hooks/useAdvancedSearch';

// Re-exportar hooks de perfil
export * from '../hooks/useProfileSwitching';
export * from '../hooks/usePersonalizedRecommendations';
export * from '../hooks/useWatchHistory';
export * from '../hooks/useAvatarCustomization';
