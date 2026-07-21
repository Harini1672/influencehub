-- =============================================
-- Run this AFTER schema.sql if you already have
-- users in auth.users with no profiles row.
-- =============================================

-- 1. Backfill profiles for any auth users that don't have one yet
INSERT INTO public.profiles (id, role, full_name, email)
SELECT
  u.id,
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'influencer'),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 2. Backfill influencer rows for any influencer profiles missing one
INSERT INTO public.influencers (user_id, platform, niche, followers_count, engagement_rate)
SELECT p.id, 'instagram', '', 0, 0
FROM public.profiles p
WHERE p.role = 'influencer'
AND NOT EXISTS (
  SELECT 1 FROM public.influencers i WHERE i.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Backfill brand rows for any brand profiles missing one
INSERT INTO public.brands (user_id, company_name, industry)
SELECT p.id, COALESCE(p.full_name, 'My Brand'), ''
FROM public.profiles p
WHERE p.role = 'brand'
AND NOT EXISTS (
  SELECT 1 FROM public.brands b WHERE b.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;
