-- ============================================
-- CINECASA COMMAND CENTER - ADMIN SCHEMA
-- Zero-Trust Security + Automation Infrastructure
-- ============================================

-- ============================================
-- 1. USER SESSIONS (Multi-Access Control)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('mobile', 'tv', 'web', 'tablet')),
  device_name TEXT,
  device_fingerprint TEXT,
  ip_address INET,
  location_city TEXT,
  location_country TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  
  UNIQUE(user_id, device_id)
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(device_id);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all sessions" ON user_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 2. AUDIT LOGS (Observability)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN (
    'auth', 'security', 'billing', 'catalog', 'user', 'system', 'api'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  target_id TEXT,
  target_type TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'info',
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can view own logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 3. CATALOG ALERTS (Intelligence System)
-- ============================================
CREATE TABLE IF NOT EXISTS catalog_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT CHECK (alert_type IN (
    'missing_season', 'new_release', 'collection_incomplete', 
    'link_broken', 'quality_issue', 'metadata_missing'
  )),
  content_id TEXT,
  content_type TEXT CHECK (content_type IN ('movie', 'series', 'collection')),
  title TEXT NOT NULL,
  poster_url TEXT,
  tmdb_id TEXT,
  imdb_id TEXT,
  details JSONB,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'processing', 'resolved', 'ignored')) DEFAULT 'pending',
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  auto_resolved BOOLEAN DEFAULT false,
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_catalog_alerts_status ON catalog_alerts(status);
CREATE INDEX IF NOT EXISTS idx_catalog_alerts_severity ON catalog_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_catalog_alerts_type ON catalog_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_catalog_alerts_detected ON catalog_alerts(detected_at DESC);

-- Enable RLS
ALTER TABLE catalog_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage alerts" ON catalog_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 4. FINANCIAL RECORDS (Billing & Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('free', 'basic', 'premium', 'family')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'boleto', 'manual')),
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  external_payment_id TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_user_id ON billing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_records(status);
CREATE INDEX IF NOT EXISTS idx_billing_due_date ON billing_records(due_date);

-- Enable RLS
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own billing" ON billing_records
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all billing" ON billing_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 5. SYSTEM HEALTH (Monitoring)
-- ============================================
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_type TEXT CHECK (service_type IN ('vercel', 'supabase', 'cloudflare', 'tmdb', 'evolution', 'resend')),
  status TEXT CHECK (status IN ('healthy', 'degraded', 'down')) DEFAULT 'healthy',
  latency_ms INTEGER,
  uptime_percent DECIMAL(5, 2),
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  metadata JSONB,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checked ON system_health(checked_at DESC);

-- Enable RLS
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Only admins can view health" ON system_health
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to log user actions automatically
CREATE OR REPLACE FUNCTION log_user_action(
  p_action TEXT,
  p_category TEXT,
  p_details JSONB DEFAULT '{}',
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action,
    action_category,
    user_id,
    user_email,
    severity,
    details,
    ip_address,
    created_at
  )
  VALUES (
    p_action,
    p_category,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    p_severity,
    p_details,
    inet_client_addr(),
    now()
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to check and block concurrent sessions (Zero-Trust)
CREATE OR REPLACE FUNCTION check_concurrent_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_active_sessions INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (admins bypass session limit)
  SELECT is_admin INTO v_is_admin 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  
  -- Count active sessions for this user
  SELECT COUNT(*) INTO v_active_sessions
  FROM user_sessions
  WHERE user_id = NEW.user_id 
    AND is_active = true 
    AND id != NEW.id;
  
  -- If user already has an active session, block this one
  IF v_active_sessions > 0 THEN
    NEW.is_blocked := true;
    NEW.block_reason := 'Multi-access detected: Another active session exists';
    
    -- Log the security event
    INSERT INTO audit_logs (
      action,
      action_category,
      user_id,
      severity,
      details,
      created_at
    )
    VALUES (
      'USER_LOGIN_BLOCKED',
      'security',
      NEW.user_id,
      'warning',
      jsonb_build_object(
        'device_id', NEW.device_id,
        'device_type', NEW.device_type,
        'ip_address', NEW.ip_address,
        'reason', 'Concurrent session detected'
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check concurrent sessions
DROP TRIGGER IF EXISTS trg_check_concurrent_sessions ON user_sessions;
CREATE TRIGGER trg_check_concurrent_sessions
  BEFORE INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_concurrent_sessions();

-- Function to update session last_active
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET last_active_at = now()
  WHERE id = p_session_id 
    AND user_id = p_user_id
    AND is_active = true;
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- 7. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for admin tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE catalog_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE billing_records;
ALTER PUBLICATION supabase_realtime ADD TABLE system_health;

-- ============================================
-- 8. SCHEDULED FUNCTIONS (CRON JOBS)
-- ============================================

-- Note: These require pg_cron extension enabled in Supabase

-- Clean old sessions (runs every hour)
SELECT cron.schedule(
  'cleanup-old-sessions',
  '0 * * * *',
  $$DELETE FROM user_sessions WHERE last_active_at < now() - interval '24 hours' AND is_active = false$$
);

-- Archive old audit logs (runs daily at 3am)
SELECT cron.schedule(
  'archive-old-logs',
  '0 3 * * *',
  $$DELETE FROM audit_logs WHERE created_at < now() - interval '90 days'$$
);

-- Reset monthly billing counters (runs 1st of month at midnight)
SELECT cron.schedule(
  'reset-billing-counters',
  '0 0 1 * *',
  $$UPDATE billing_records SET metadata = metadata || '{"notified": false}' WHERE status = 'pending'$$
);

-- ============================================
-- 9. EXTENSIONS
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ============================================
-- 10. VIEWS FOR ADMIN DASHBOARD
-- ============================================

-- View: Pending Approvals (users awaiting authorization)
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.avatar_url,
  p.created_at,
  p.approved,
  p.is_admin,
  p.status,
  us.device_id,
  us.ip_address,
  us.device_type
FROM profiles p
LEFT JOIN user_sessions us ON us.user_id = p.id AND us.is_active = true
WHERE p.approved = false OR p.approved IS NULL
ORDER BY p.created_at DESC;

-- View: Active Sessions Summary
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
  us.id,
  us.user_id,
  p.name as user_name,
  p.email as user_email,
  us.device_id,
  us.device_type,
  us.device_name,
  us.ip_address,
  us.location_city,
  us.location_country,
  us.is_active,
  us.is_blocked,
  us.created_at,
  us.last_active_at,
  EXTRACT(EPOCH FROM (now() - us.last_active_at))/60 as idle_minutes
FROM user_sessions us
JOIN profiles p ON p.id = us.user_id
WHERE us.is_active = true
ORDER BY us.last_active_at DESC;

-- View: Billing Summary
CREATE OR REPLACE VIEW v_billing_summary AS
SELECT 
  br.user_id,
  p.name as user_name,
  p.email as user_email,
  p.phone,
  br.plan_type,
  br.amount,
  br.status,
  br.due_date,
  br.paid_at,
  CASE 
    WHEN br.due_date < CURRENT_DATE AND br.status = 'pending' THEN 'overdue'
    ELSE br.status
  END as computed_status,
  br.pix_copy_paste,
  br.created_at
FROM billing_records br
JOIN profiles p ON p.id = br.user_id
WHERE br.created_at = (
  SELECT MAX(created_at) 
  FROM billing_records 
  WHERE user_id = br.user_id
)
ORDER BY br.due_date ASC;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON catalog_alerts TO authenticated;
GRANT ALL ON billing_records TO authenticated;
GRANT ALL ON system_health TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_action TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
