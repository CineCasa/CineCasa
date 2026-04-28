-- Migration: Sistema profissional de pesos de gênero
ALTER TABLE public.genre_weights 
ADD COLUMN IF NOT EXISTS completion_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trending_score numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS growth_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_watch_time integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS popularity_score numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_score numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_user_rating numeric(3,1) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_genre_weights_weight ON public.genre_weights(weight DESC);
CREATE INDEX IF NOT EXISTS idx_genre_weights_trending ON public.genre_weights(trending_score DESC) WHERE trending_score > 0;
CREATE INDEX IF NOT EXISTS idx_genre_weights_engagement ON public.genre_weights(engagement_score DESC) WHERE engagement_score > 0;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_genre_weights_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS genre_weights_updated_at ON public.genre_weights;
CREATE TRIGGER genre_weights_updated_at BEFORE UPDATE ON public.genre_weights FOR EACH ROW EXECUTE FUNCTION update_genre_weights_updated_at();

-- Função: Calcular peso inteligente
CREATE OR REPLACE FUNCTION calculate_genre_weight(
  p_retention numeric DEFAULT 0, p_abandon numeric DEFAULT 0, p_rating numeric DEFAULT 0,
  p_interactions integer DEFAULT 0, p_completion numeric DEFAULT 0, p_engagement numeric DEFAULT 0
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_retention_factor numeric; v_engagement_factor numeric; v_final_weight numeric; BEGIN v_retention_factor := GREATEST(0, LEAST(1, (p_retention/100.0)*0.7 + (1-p_abandon/100.0)*0.3)); v_engagement_factor := GREATEST(0, LEAST(1, (p_engagement/100.0)*0.4 + (p_completion/100.0)*0.4 + LEAST(p_interactions::numeric/1000.0, 1)*0.2)); v_final_weight := 1.0 + (v_retention_factor*0.30 + v_engagement_factor*0.30 + LEAST(p_rating/5.0, 1)*0.25 + LN(GREATEST(p_interactions,1)+1)/LN(10000)*0.15)*2.0; RETURN GREATEST(0.5, LEAST(5.0, v_final_weight)); END; $$;

-- Função: Atualizar métricas de gênero
CREATE OR REPLACE FUNCTION update_genre_metrics(p_genre text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_retention numeric; v_abandon numeric; v_interactions bigint; v_completion numeric; v_engagement numeric; v_weight numeric; BEGIN SELECT COALESCE(AVG(CASE WHEN wh.progress >= 90 THEN 100 ELSE wh.progress END), 0), COALESCE(AVG(CASE WHEN wh.progress < 25 THEN 100 ELSE 0 END), 0), COUNT(*), COALESCE(AVG(wh.progress), 0) INTO v_retention, v_abandon, v_interactions, v_completion FROM public.watch_history wh JOIN public.cinema c ON c.id = wh.content_id::integer WHERE c.category ILIKE '%' || p_genre || '%'; v_engagement := (v_retention*0.4 + (100-v_abandon)*0.3 + v_completion*0.3); v_weight := calculate_genre_weight(v_retention, v_abandon, 0, v_interactions::integer, v_completion, v_engagement); INSERT INTO public.genre_weights (genre, weight, retention_rate, abandonment_rate, total_interactions, completion_rate, engagement_score, last_calculated_at) VALUES (p_genre, v_weight, v_retention, v_abandon, v_interactions::integer, v_completion, v_engagement, NOW()) ON CONFLICT (genre) DO UPDATE SET weight = EXCLUDED.weight, retention_rate = EXCLUDED.retention_rate, abandonment_rate = EXCLUDED.abandonment_rate, total_interactions = EXCLUDED.total_interactions, completion_rate = EXCLUDED.completion_rate, engagement_score = EXCLUDED.engagement_score, last_calculated_at = NOW(), updated_at = NOW(); RETURN true; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Erro: %', SQLERRM; RETURN false; END; $$;

-- Função: Recalcular todos os gêneros
CREATE OR REPLACE FUNCTION recalculate_all_genre_weights() RETURNS TABLE (genre text, weight numeric) LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_genre text; BEGIN FOR v_genre IN SELECT unnest(array['ação','aventura','comédia','drama','terror','thriller','romance','ficção científica','fantasia','animação','documentário','crime','mistério','guerra','história','família','musical','faroeste']) LOOP PERFORM update_genre_metrics(v_genre); RETURN QUERY SELECT v_genre, (SELECT gw.weight FROM public.genre_weights gw WHERE gw.genre = v_genre); END LOOP; END; $$;

-- Função: Obter gêneros em tendência
CREATE OR REPLACE FUNCTION get_trending_genres(p_limit integer DEFAULT 10) RETURNS TABLE (genre text, weight numeric, trending_score numeric, engagement_score numeric) LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT gw.genre, gw.weight, gw.trending_score, gw.engagement_score FROM public.genre_weights gw WHERE gw.last_calculated_at > NOW() - INTERVAL '7 days' ORDER BY gw.trending_score DESC NULLS LAST, gw.weight DESC LIMIT p_limit; $$;

-- Função: Obter gêneros personalizados
CREATE OR REPLACE FUNCTION get_personalized_genres(p_user_id uuid, p_limit integer DEFAULT 10) RETURNS TABLE (genre text, user_score numeric, global_weight numeric, combined_score numeric) LANGUAGE sql SECURITY DEFINER STABLE AS $$ WITH user_prefs AS (SELECT ugp.genre, ugp.score FROM public.user_genre_preferences ugp WHERE ugp.user_id = p_user_id ORDER BY ugp.score DESC LIMIT p_limit*2) SELECT up.genre, up.score::numeric, COALESCE(gw.weight, 1.0), (up.score * COALESCE(gw.weight, 1.0) / 100.0)::numeric FROM user_prefs up LEFT JOIN public.genre_weights gw ON gw.genre = up.genre ORDER BY 4 DESC LIMIT p_limit; $$;

-- Função: Calcular recommendation score
CREATE OR REPLACE FUNCTION calculate_content_recommendation_score(p_content_id text, p_user_id uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE v_genres text[]; v_user_prefs jsonb; v_final_score numeric := 0; v_genre text; v_total_score numeric := 0; v_count integer := 0; v_user_score numeric; v_global_weight numeric; BEGIN SELECT array_agg(DISTINCT c.category) INTO v_genres FROM public.cinema c WHERE c.id::text = p_content_id; IF v_genres IS NULL THEN RETURN 1.0; END IF; SELECT jsonb_object_agg(ugp.genre, ugp.score) INTO v_user_prefs FROM public.user_genre_preferences ugp WHERE ugp.user_id = p_user_id; FOREACH v_genre IN ARRAY v_genres LOOP v_user_score := COALESCE((v_user_prefs->>v_genre)::numeric, 50); SELECT COALESCE(weight, 1.0) INTO v_global_weight FROM public.genre_weights WHERE genre = v_genre; v_total_score := v_total_score + (v_user_score * v_global_weight); v_count := v_count + 1; END LOOP; IF v_count > 0 THEN v_final_score := v_total_score / v_count / 100.0; ELSE v_final_score := 1.0; END IF; RETURN GREATEST(0.5, LEAST(5.0, v_final_score)); END; $$;

COMMENT ON TABLE public.genre_weights IS 'Pesos de gênero para recommendation engine';
