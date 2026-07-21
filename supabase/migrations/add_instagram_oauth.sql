-- =============================================
-- Migration: Add Instagram Business OAuth columns
-- Run this in Supabase SQL Editor AFTER schema.sql
-- =============================================

ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS instagram_connected     BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS instagram_business_id   TEXT,
  ADD COLUMN IF NOT EXISTS instagram_username      TEXT,
  ADD COLUMN IF NOT EXISTS instagram_access_token  TEXT,       -- long-lived token (encrypted at rest by Supabase)
  ADD COLUMN IF NOT EXISTS instagram_token_expires_at TIMESTAMPTZ;

-- Revoke direct SELECT on the sensitive token column from the anon/authenticated roles.
-- The token is only read by the Edge Function (service-role key), never by the client.
REVOKE SELECT (instagram_access_token) ON public.influencers FROM anon, authenticated;
