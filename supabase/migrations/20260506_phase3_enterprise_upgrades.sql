-- Phase 3 Upgrades: Enterprise API & Webhook Reliability
-- NOTE: Requires phase0_foundation.sql to have been run first
--       (webhooks and access_logs tables must exist before this runs)

-- Table for managing API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL, -- e.g., 'lum_'
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for webhook delivery logs (for retry tracking)
-- FK to public.webhooks which is created in phase0_foundation.sql
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    status TEXT NOT NULL, -- 'delivered', 'retrying', 'failed'
    attempt_count INTEGER DEFAULT 1,
    latency_ms INTEGER,   -- delivery latency in milliseconds
    last_error TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view logs for their webhooks" ON public.webhook_logs;
CREATE POLICY "Users can view logs for their webhooks" ON public.webhook_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.webhooks 
        WHERE webhooks.id = webhook_logs.webhook_id
        AND webhooks.user_id = auth.uid()
    ));
