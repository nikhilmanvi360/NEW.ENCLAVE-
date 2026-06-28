-- RBAC hardening
-- Adds API-key scopes and prevents self-service role escalation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'reviewer', 'admin'))
  NOT VALID;

ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_role_check;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own non-admin profile fields" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own user profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT ARRAY['verify:run', 'cache:read', 'usage:read:self'];

ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_scopes_not_empty
  CHECK (array_length(scopes, 1) > 0)
  NOT VALID;

ALTER TABLE public.api_keys VALIDATE CONSTRAINT api_keys_scopes_not_empty;
