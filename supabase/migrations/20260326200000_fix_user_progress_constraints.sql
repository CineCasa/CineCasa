-- Fix user_progress table constraints for upsert operations
-- This migration adds the necessary unique constraint for on_conflict to work

-- Drop existing constraint if it exists (to avoid conflicts)
ALTER TABLE user_progress 
DROP CONSTRAINT IF EXISTS user_progress_user_content_episode_unique;

-- Add unique constraint for upsert operations
-- This matches the onConflict: 'user_id,content_id,content_type,episode_id' used in the code
ALTER TABLE user_progress 
ADD CONSTRAINT user_progress_user_content_episode_unique 
UNIQUE (user_id, content_id, content_type, episode_id);

-- Also create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_progress_lookup 
ON user_progress(user_id, content_id, content_type, episode_id);
