-- Função para incrementar preferências do usuário
CREATE OR REPLACE FUNCTION increment_user_preference(
  p_user_id UUID,
  p_category VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_preferences (
    user_id, 
    category, 
    view_count, 
    total_watch_time, 
    last_viewed_at
  ) VALUES (
    p_user_id,
    p_category,
    1,
    1,
    NOW()
  )
  ON CONFLICT (user_id, category) 
  DO UPDATE SET
    view_count = user_preferences.view_count + 1,
    total_watch_time = user_preferences.total_watch_time + 1,
    last_viewed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar progresso do usuário
CREATE OR REPLACE FUNCTION update_user_progress(
  p_user_id UUID,
  p_content_id VARCHAR(255),
  p_content_type VARCHAR(50),
  p_progress_seconds INTEGER,
  p_total_seconds INTEGER,
  p_percentage_completed INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_progress (
    user_id,
    content_id,
    content_type,
    progress_seconds,
    total_seconds,
    percentage_completed,
    last_watched_at
  ) VALUES (
    p_user_id,
    p_content_id,
    p_content_type,
    p_progress_seconds,
    p_total_seconds,
    p_percentage_completed,
    NOW()
  )
  ON CONFLICT (user_id, content_id) 
  DO UPDATE SET
    progress_seconds = GREATEST(user_progress.progress_seconds, p_progress_seconds),
    total_seconds = p_total_seconds,
    percentage_completed = GREATEST(user_progress.percentage_completed, p_percentage_completed),
    last_watched_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- View para conteúdo mais assistido por categoria
CREATE OR REPLACE VIEW most_watched_by_category AS
SELECT 
  up.category,
  COUNT(up.id) as total_views,
  AVG(up.percentage_completed) as avg_completion_rate,
  COUNT(DISTINCT up.user_id) as unique_users
FROM user_progress up
JOIN user_preferences pref ON up.user_id = pref.user_id
GROUP BY up.category
ORDER BY total_views DESC;

-- View para preferências dos usuários
CREATE OR REPLACE VIEW user_category_preferences AS
SELECT 
  u.email,
  pref.category,
  pref.view_count,
  pref.total_watch_time,
  pref.last_viewed_at,
  RANK() OVER (PARTITION BY pref.user_id ORDER BY pref.view_count DESC) as preference_rank
FROM auth.users u
JOIN user_preferences pref ON u.id = pref.user_id
WHERE pref.view_count > 0
ORDER BY pref.user_id, pref.view_count DESC;
