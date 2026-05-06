-- =============================================================
-- LUMINA FORENSIC ENGINE: MASTER SCHEMA (IDEMPOTENT)
-- This script safely initializes or updates the entire database.
-- Run this in the Supabase SQL Editor.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. USER PROFILES & ROLES
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user',
    credits NUMERIC(10, 2) DEFAULT 500.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created by a previous limited script
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits NUMERIC(10, 2) DEFAULT 500.00;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);


-- ---------------------------------------------------------------
-- 2. TRUTH ENGINE HISTORY
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

-- Ensure columns exist if table was created by a previous limited script
ALTER TABLE public.truth_engine_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.truth_engine_history ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'GENERAL';
ALTER TABLE public.truth_engine_history ADD COLUMN IF NOT EXISTS agent_results JSONB;
ALTER TABLE public.truth_engine_history ADD COLUMN IF NOT EXISTS judge_result JSONB;

ALTER TABLE public.truth_engine_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_read_policy" ON public.truth_engine_history;
CREATE POLICY "history_read_policy" ON public.truth_engine_history
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "history_insert_policy" ON public.truth_engine_history;
CREATE POLICY "history_insert_policy" ON public.truth_engine_history
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- ---------------------------------------------------------------
-- 3. CACHING & SEMANTIC SEARCH
-- ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.verdict_cache (
    cache_key TEXT PRIMARY KEY,
    claim TEXT NOT NULL,
    domain TEXT NOT NULL,
    verdict JSONB NOT NULL,
    agent_results JSONB NOT NULL,
    embedding vector(768),
    hit_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    stale_after TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Ensure embedding exists
ALTER TABLE public.verdict_cache ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE public.verdict_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.verdict_cache;
CREATE POLICY "Enable read access for all users" ON public.verdict_cache FOR SELECT USING (true);

-- Semantic search function
CREATE OR REPLACE FUNCTION match_claims (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  cache_key text,
  claim text,
  verdict jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vc.cache_key,
    vc.claim,
    vc.verdict,
    1 - (vc.embedding <=> query_embedding) AS similarity
  FROM verdict_cache vc
  WHERE 1 - (vc.embedding <=> query_embedding) > match_threshold
  ORDER BY vc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ---------------------------------------------------------------
-- 4. USAGE & ANALYTICS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    domain TEXT,
    cached BOOLEAN DEFAULT FALSE,
    credit_cost NUMERIC(10, 2) DEFAULT 0,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id exists
ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage logs" ON public.usage_logs;
CREATE POLICY "Users can view own usage logs" ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 5. WEBHOOKS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    url        TEXT NOT NULL,
    events     TEXT[] NOT NULL DEFAULT '{verdict.ready}',
    is_active  BOOLEAN DEFAULT true,
    secret     TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id exists
ALTER TABLE public.webhooks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own webhooks" ON public.webhooks;
CREATE POLICY "Users can manage their own webhooks" ON public.webhooks
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "webhooks_read_policy" ON public.webhooks;
CREATE POLICY "webhooks_read_policy" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 4. PERFORMANCE LOGS (Analytics)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event      TEXT NOT NULL,
    provider   TEXT NOT NULL,
    latency    INTEGER NOT NULL,
    tokens     INTEGER DEFAULT 0,
    cost       NUMERIC(10, 6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_read_policy" ON public.performance_logs;
CREATE POLICY "performance_read_policy" ON public.performance_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "performance_insert_policy" ON public.performance_logs;
CREATE POLICY "performance_insert_policy" ON public.performance_logs FOR INSERT WITH CHECK (true);


-- ---------------------------------------------------------------
-- 5. ACCESS LOGS (Audit Trail)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action     TEXT NOT NULL,
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_logs_read_policy" ON public.access_logs;
CREATE POLICY "access_logs_read_policy" ON public.access_logs FOR SELECT USING (true);


-- ---------------------------------------------------------------
-- 6. SYSTEM SETTINGS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_read_policy" ON public.system_settings;
CREATE POLICY "settings_read_policy" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_upsert_policy" ON public.system_settings;
CREATE POLICY "settings_upsert_policy" ON public.system_settings FOR ALL USING (true);

INSERT INTO public.system_settings (key, value) VALUES
    ('test_mode', 'false'),
    ('model_skeptic', 'google/gemini-1.5-flash'),
    ('model_supporter', 'google/gemini-1.5-flash'),
    ('model_analyst', 'google/gemini-1.5-flash'),
    ('model_judge', 'google/gemini-1.5-flash')
ON CONFLICT (key) DO NOTHING;


-- ---------------------------------------------------------------
-- 7. API KEYS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);


-- ---------------------------------------------------------------
-- 8. WEBHOOK LOGS
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    status TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    latency_ms INTEGER,
    last_error TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view logs for their webhooks" ON public.webhook_logs;
CREATE POLICY "Users can view logs for their webhooks" ON public.webhook_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.webhooks 
        WHERE webhooks.id = webhook_logs.webhook_id
        AND webhooks.user_id = auth.uid()
    ));


-- ---------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------

-- 1. Automate Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, credits)
    VALUES (new.id, new.email, 'user', 500.00);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Credit Management RPC
CREATE OR REPLACE FUNCTION public.decrement_credits(u_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET credits = GREATEST(0, credits - amount)
    WHERE id = u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
