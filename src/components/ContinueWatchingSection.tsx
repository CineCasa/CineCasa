import React from 'react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { ContinueWatching } from './ContinueWatching';
import { useAuth } from '@/components/AuthProvider';

interface WatchHistoryItem {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  coverImage?: string;
  backdropPath?: string;
  progress: number;
  episode_number?: number;
  season_number?: number;
}

export const ContinueWatchingSection: React.FC = () => {
  const { user } = useAuth();
  const { history, isLoading } = useWatchHistory({
    limit: 3,
    userId: user?.id
  });

  if (!user || isLoading || !history || (history as WatchHistoryItem[]).length === 0) return null;

  // Mapear para o formato do ContinueWatching
  const items = (history as WatchHistoryItem[]).map(item => ({
    id: item.content_id,
    title: item.title,
    poster: item.coverImage || '',
    banner: item.backdropPath || item.coverImage || '',
    backdrop: item.backdropPath || item.coverImage || '',
    type: item.content_type,
    progress: item.progress,
    episodeId: item.episode_number?.toString(),
    seasonNumber: item.season_number,
    episodeNumber: item.episode_number
  }));

  return (
    <ContinueWatching items={items} />
  );
};

export default ContinueWatchingSection;
