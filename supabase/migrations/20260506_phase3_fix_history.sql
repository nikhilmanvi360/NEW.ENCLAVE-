-- Fix for truth_engine_history table to include user_id and fix schema cache issues
-- This also adds RLS policies to the history table

-- 1. Add user_id column if it doesn't exist
ALTER TABLE public.truth_engine_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Update existing policies or add new ones
ALTER TABLE public.truth_engine_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_read_policy" ON public.truth_engine_history;
DROP POLICY IF EXISTS "history_insert_policy" ON public.truth_engine_history;

-- Allow users to see only their own history (and public if needed, but here we restrict)
CREATE POLICY "history_read_policy" ON public.truth_engine_history 
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "history_insert_policy" ON public.truth_engine_history 
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
