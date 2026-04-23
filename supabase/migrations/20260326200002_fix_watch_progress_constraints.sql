-- Fix watch_progress table constraints for upsert operations
-- This migration adds the necessary unique constraint for on_conflict to work

-- Drop existing constraint if it exists
ALTER TABLE watch_progress 
DROP CONSTRAINT IF EXISTS watch_progress_user_content_episode_season_unique;

-- Add unique constraint for upsert operations
-- This matches the onConflict: 'user_id,content_id,content_type,episode_number,season_number' used in useWatchProgress.ts
ALTER TABLE watch_progress 
ADD CONSTRAINT watch_progress_user_content_episode_season_unique 
UNIQUE (user_id, content_id, content_type, episode_number, season_number);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_watch_progress_lookup 
ON watch_progress(user_id, content_id, content_type, episode_number, season_number);
