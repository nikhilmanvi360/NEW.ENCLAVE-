-- Add credits column to profiles for token usage monitoring
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits NUMERIC(10, 2) DEFAULT 500.00;

-- Update existing profiles to have default credits if null
UPDATE public.profiles SET credits = 500.00 WHERE credits IS NULL;

-- Function to atomically decrement credits
CREATE OR REPLACE FUNCTION public.decrement_credits(u_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET credits = credits - amount
    WHERE id = u_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
