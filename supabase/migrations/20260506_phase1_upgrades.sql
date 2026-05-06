-- Phase 1 Upgrades: Caching and Usage Dashboard

-- Table for caching results to reduce API costs and latency
CREATE TABLE IF NOT EXISTS public.verdict_cache (
    cache_key TEXT PRIMARY KEY, -- SHA-256(normalize(claim) + domain)
    claim TEXT NOT NULL,
    domain TEXT NOT NULL,
    verdict JSONB NOT NULL,
    agent_results JSONB NOT NULL,
    hit_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    stale_after TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Table for tracking every API interaction for the Usage Dashboard
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL, -- 'verify', 'batch_item', 'webhook_sent', 'cache_hit'
    domain TEXT,
    cached BOOLEAN DEFAULT FALSE,
    credit_cost NUMERIC(10, 2) DEFAULT 0,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON public.usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_event ON public.usage_logs(event_type);

-- RLS Policies (Basic)
ALTER TABLE public.verdict_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow reading cache for everyone (or authenticated)
CREATE POLICY "Enable read access for all users" ON public.verdict_cache FOR SELECT USING (true);

-- Usage logs restricted to user or admin
CREATE POLICY "Users can view own usage logs" ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);
