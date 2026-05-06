-- Ensure profiles table exists and has correct RLS policies
-- This table is used for role-based access (e.g., Admin for Test Mode)

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'admin'
    credits NUMERIC(10, 2) DEFAULT 500.00, -- Default credit balance
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- TRIGGER: Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, credits)
    VALUES (new.id, new.email, 'user', 500.00);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Decrement credits safely
CREATE OR REPLACE FUNCTION public.decrement_credits(u_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET credits = GREATEST(0, credits - amount)
    WHERE id = u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
