-- Fix watch_history table constraints for upsert operations
-- This migration adds the necessary unique constraint for on_conflict to work

-- Drop existing constraint if it exists
ALTER TABLE watch_history 
DROP CONSTRAINT IF EXISTS watch_history_profile_content_unique;

-- Add unique constraint for upsert operations
-- This matches the fields used in VideoJSPlayer.tsx upsert
ALTER TABLE watch_history 
ADD CONSTRAINT watch_history_profile_content_unique 
UNIQUE (profile_id, content_id, content_type, episode_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_watch_history_lookup 
ON watch_history(profile_id, content_id, content_type, episode_id);
