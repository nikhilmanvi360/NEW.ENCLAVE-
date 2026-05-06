-- Phase 2 Upgrades: AI Intelligence & Memory
-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to verdict_cache if it doesn't exist
-- Note: text-embedding-004 from Gemini uses 768 dimensions by default
ALTER TABLE public.verdict_cache ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create a function for similarity search via RPC
-- This allows us to find previously analyzed claims that are semantically similar to the current one
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

-- Create an index for faster vector searches (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_verdict_cache_embedding ON public.verdict_cache USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
