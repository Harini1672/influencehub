-- =============================================
-- InfluenceHub Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto (needed by seed.sql for crypt() / gen_salt())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('influencer', 'brand');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('requested', 'accepted', 'rejected', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('requested', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('request', 'accepted', 'rejected', 'completed', 'note');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INFLUENCERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  platform TEXT NOT NULL DEFAULT 'instagram',
  niche TEXT NOT NULL DEFAULT '',
  followers_count INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  bio TEXT,
  location TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  -- Instagram Business OAuth fields
  instagram_connected         BOOLEAN     NOT NULL DEFAULT FALSE,
  instagram_business_id       TEXT,
  instagram_username          TEXT,
  instagram_access_token      TEXT,        -- long-lived token; SELECT revoked from client roles
  instagram_token_expires_at  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- Protect the raw access token — only the Edge Function (service role) may read it
REVOKE SELECT (instagram_access_token) ON public.influencers FROM anon, authenticated;

-- =============================================
-- BRANDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  website TEXT,
  logo TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  status campaign_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CAMPAIGN REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'requested',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);

ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CAMPAIGN NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaign_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaign_notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  type notification_type NOT NULL DEFAULT 'request',
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- INFLUENCERS POLICIES
CREATE POLICY "Anyone can view public influencers" ON public.influencers
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Influencers can insert own profile" ON public.influencers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Influencers can update own profile" ON public.influencers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Influencers can delete own profile" ON public.influencers
  FOR DELETE USING (auth.uid() = user_id);

-- BRANDS POLICIES
CREATE POLICY "Anyone can view brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Brands can insert own profile" ON public.brands
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Brands can update own profile" ON public.brands
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Brands can delete own profile" ON public.brands
  FOR DELETE USING (auth.uid() = user_id);

-- CAMPAIGNS POLICIES
CREATE POLICY "Anyone can view campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Brands can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

CREATE POLICY "Brands can update own campaigns" ON public.campaigns
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

CREATE POLICY "Brands can delete own campaigns" ON public.campaigns
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

-- CAMPAIGN REQUESTS POLICIES
CREATE POLICY "Users can view own requests" ON public.campaign_requests
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
    OR
    auth.uid() IN (SELECT user_id FROM public.influencers WHERE id = influencer_id)
  );

CREATE POLICY "Brands can create requests" ON public.campaign_requests
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

CREATE POLICY "Influencers can update request status" ON public.campaign_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.influencers WHERE id = influencer_id)
    OR
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

CREATE POLICY "Brands can delete own requests" ON public.campaign_requests
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.brands WHERE id = brand_id)
  );

-- CAMPAIGN NOTES POLICIES
CREATE POLICY "Campaign participants can view notes" ON public.campaign_notes
  FOR SELECT USING (
    auth.uid() = sender_id
    OR
    auth.uid() IN (
      SELECT b.user_id FROM public.brands b
      JOIN public.campaigns c ON c.brand_id = b.id
      WHERE c.id = campaign_id
    )
    OR
    auth.uid() IN (
      SELECT i.user_id FROM public.influencers i
      JOIN public.campaign_requests cr ON cr.influencer_id = i.id
      WHERE cr.campaign_id = campaign_notes.campaign_id
      AND cr.status = 'accepted'
    )
  );

CREATE POLICY "Campaign participants can post notes" ON public.campaign_notes
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      auth.uid() IN (
        SELECT b.user_id FROM public.brands b
        JOIN public.campaigns c ON c.brand_id = b.id
        WHERE c.id = campaign_id
      )
      OR
      auth.uid() IN (
        SELECT i.user_id FROM public.influencers i
        JOIN public.campaign_requests cr ON cr.influencer_id = i.id
        WHERE cr.campaign_id = campaign_notes.campaign_id
        AND cr.status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can update own notes" ON public.campaign_notes
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own notes" ON public.campaign_notes
  FOR DELETE USING (auth.uid() = sender_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- STORAGE POLICIES
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Brand logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-logos');

CREATE POLICY "Brands can upload own logo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'influencer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create influencer/brand record on profile create
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'influencer' THEN
    INSERT INTO public.influencers (user_id, platform, niche, followers_count, engagement_rate)
    VALUES (NEW.id, 'instagram', '', 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF NEW.role = 'brand' THEN
    INSERT INTO public.brands (user_id, company_name, industry)
    VALUES (NEW.id, COALESCE(NEW.full_name, 'My Brand'), '')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
