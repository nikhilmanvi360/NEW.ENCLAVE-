-- =============================================================
-- PHASE 0: Foundation Tables
-- Run this FIRST before all other migrations.
-- Creates all tables that other migrations reference via FK.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. TRUTH ENGINE HISTORY
--    Stores all verdicts rendered by the multi-agent system.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.truth_engine_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claim        TEXT NOT NULL,
    domain       TEXT NOT NULL DEFAULT 'GENERAL',
    verdict      TEXT NOT NULL,
    confidence   NUMERIC(5, 2),
    summary      TEXT,
    agent_results JSONB,
    judge_result  JSONB,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_user ON public.truth_engine_history(user_id, created_at DESC);

ALTER TABLE public.truth_engine_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_read_policy"   ON public.truth_engine_history;
DROP POLICY IF EXISTS "history_insert_policy" ON public.truth_engine_history;

CREATE POLICY "history_read_policy" ON public.truth_engine_history
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "history_insert_policy" ON public.truth_engine_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- ---------------------------------------------------------------
-- 2. WEBHOOKS
--    User-configured webhook endpoints for verdict notifications.
--    MUST exist before webhook_logs (which has a FK to this).
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    events     TEXT[] NOT NULL DEFAULT '{verdict.ready}',
    is_active  BOOLEAN DEFAULT true,
    secret     TEXT, -- Optional HMAC signing secret
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own webhooks" ON public.webhooks;
CREATE POLICY "Users can manage their own webhooks" ON public.webhooks
    FOR ALL USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 3. PERFORMANCE LOGS
--    Tracks model call latency and cost per agent invocation.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event      TEXT NOT NULL,         -- e.g., 'SKEPTIC_MODEL_CALL'
    provider   TEXT NOT NULL,         -- 'groq', 'openrouter', 'gemini'
    latency    INTEGER NOT NULL,      -- milliseconds
    tokens     INTEGER DEFAULT 0,
    cost       NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_logs_event ON public.performance_logs(event, created_at DESC);

ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- Only service role / admin should read perf logs; deny public client reads
CREATE POLICY "Service role only" ON public.performance_logs
    FOR SELECT USING (false); -- blocked for anon client; use server-side access


-- ---------------------------------------------------------------
-- 4. ACCESS LOGS
--    Tracks every authenticated action for the admin audit trail.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action     TEXT NOT NULL,         -- e.g., 'verify', 'login', 'api_call'
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id, created_at DESC);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only: no self-service reads (server-side only via service role)
CREATE POLICY "Service role only" ON public.access_logs
    FOR SELECT USING (false);


-- ---------------------------------------------------------------
-- 5. SYSTEM SETTINGS
--    Key-value store for runtime-configurable server settings.
--    Includes API key overrides and model routing config.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only writes; deny all client reads (server fetches via service role)
CREATE POLICY "Admins can manage settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed default settings (idempotent)
INSERT INTO public.system_settings (key, value) VALUES
    ('test_mode',       'false'),
    ('model_skeptic',   'google/gemini-1.5-flash'),
    ('model_supporter', 'google/gemini-1.5-flash'),
    ('model_analyst',   'google/gemini-1.5-flash'),
    ('model_judge',     'google/gemini-1.5-flash')
ON CONFLICT (key) DO NOTHING;
