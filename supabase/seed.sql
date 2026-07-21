-- =============================================
-- InfluenceHub Demo Data Seed  (v2 — schema-synced)
-- Run this AFTER schema.sql in Supabase SQL Editor.
-- Safe to run multiple times — idempotent.
-- =============================================

CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- ── Fixed brand auth-user UUIDs ──────────────────────────────────────────
  v_nike_uid    UUID := 'a0000001-0000-0000-0000-000000000001';
  v_adidas_uid  UUID := 'a0000002-0000-0000-0000-000000000001';
  v_puma_uid    UUID := 'a0000003-0000-0000-0000-000000000001';
  v_amazon_uid  UUID := 'a0000004-0000-0000-0000-000000000001';
  v_myntra_uid  UUID := 'a0000005-0000-0000-0000-000000000001';
  v_nykaa_uid   UUID := 'a0000006-0000-0000-0000-000000000001';
  v_samsung_uid UUID := 'a0000007-0000-0000-0000-000000000001';
  v_boat_uid    UUID := 'a0000008-0000-0000-0000-000000000001';
  v_swiggy_uid  UUID := 'a0000009-0000-0000-0000-000000000001';
  v_zomato_uid  UUID := 'a0000010-0000-0000-0000-000000000001';

  -- ── Fixed influencer auth-user UUIDs ─────────────────────────────────────
  v_inf01_uid UUID := 'b0000001-0000-0000-0000-000000000001';
  v_inf02_uid UUID := 'b0000002-0000-0000-0000-000000000001';
  v_inf03_uid UUID := 'b0000003-0000-0000-0000-000000000001';
  v_inf04_uid UUID := 'b0000004-0000-0000-0000-000000000001';
  v_inf05_uid UUID := 'b0000005-0000-0000-0000-000000000001';
  v_inf06_uid UUID := 'b0000006-0000-0000-0000-000000000001';
  v_inf07_uid UUID := 'b0000007-0000-0000-0000-000000000001';
  v_inf08_uid UUID := 'b0000008-0000-0000-0000-000000000001';
  v_inf09_uid UUID := 'b0000009-0000-0000-0000-000000000001';
  v_inf10_uid UUID := 'b0000010-0000-0000-0000-000000000001';
  v_inf11_uid UUID := 'b0000011-0000-0000-0000-000000000001';
  v_inf12_uid UUID := 'b0000012-0000-0000-0000-000000000001';
  v_inf13_uid UUID := 'b0000013-0000-0000-0000-000000000001';
  v_inf14_uid UUID := 'b0000014-0000-0000-0000-000000000001';
  v_inf15_uid UUID := 'b0000015-0000-0000-0000-000000000001';
  v_inf16_uid UUID := 'b0000016-0000-0000-0000-000000000001';
  v_inf17_uid UUID := 'b0000017-0000-0000-0000-000000000001';
  v_inf18_uid UUID := 'b0000018-0000-0000-0000-000000000001';
  v_inf19_uid UUID := 'b0000019-0000-0000-0000-000000000001';
  v_inf20_uid UUID := 'b0000020-0000-0000-0000-000000000001';

  -- ── Brand table row IDs (resolved after insert) ──────────────────────────
  v_nike_bid    UUID; v_adidas_bid  UUID; v_puma_bid    UUID;
  v_amazon_bid  UUID; v_myntra_bid  UUID; v_nykaa_bid   UUID;
  v_samsung_bid UUID; v_boat_bid    UUID; v_swiggy_bid  UUID;
  v_zomato_bid  UUID;

  -- ── Influencer table row IDs ──────────────────────────────────────────────
  v_inf01_iid UUID; v_inf02_iid UUID; v_inf03_iid UUID; v_inf04_iid UUID;
  v_inf05_iid UUID; v_inf06_iid UUID; v_inf07_iid UUID; v_inf08_iid UUID;
  v_inf09_iid UUID; v_inf10_iid UUID; v_inf11_iid UUID; v_inf12_iid UUID;
  v_inf13_iid UUID; v_inf14_iid UUID; v_inf15_iid UUID; v_inf16_iid UUID;
  v_inf17_iid UUID; v_inf18_iid UUID; v_inf19_iid UUID; v_inf20_iid UUID;

  -- ── Fixed campaign UUIDs (enables idempotent ON CONFLICT) ────────────────
  v_camp01 UUID := 'c0000001-0000-0000-0000-000000000001';
  v_camp02 UUID := 'c0000002-0000-0000-0000-000000000001';
  v_camp03 UUID := 'c0000003-0000-0000-0000-000000000001';
  v_camp04 UUID := 'c0000004-0000-0000-0000-000000000001';
  v_camp05 UUID := 'c0000005-0000-0000-0000-000000000001';
  v_camp06 UUID := 'c0000006-0000-0000-0000-000000000001';
  v_camp07 UUID := 'c0000007-0000-0000-0000-000000000001';
  v_camp08 UUID := 'c0000008-0000-0000-0000-000000000001';
  v_camp09 UUID := 'c0000009-0000-0000-0000-000000000001';
  v_camp10 UUID := 'c0000010-0000-0000-0000-000000000001';

BEGIN
  -- ── Guard: skip entirely if demo data already exists ─────────────────────
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'a0000001-0000-0000-0000-000000000001') THEN
    RETURN jsonb_build_object('status','skipped','reason','Demo data already seeded');
  END IF;

  RAISE NOTICE '[seed] Starting demo data seed…';

  -- ── Disable triggers so the seed fully controls what gets inserted ────────
  -- Without this, handle_new_user fires on every auth.users INSERT and creates
  -- minimal profile/influencer/brand rows that would then block our rich data.
  ALTER TABLE auth.users       DISABLE TRIGGER on_auth_user_created;
  ALTER TABLE public.profiles  DISABLE TRIGGER on_profile_created;


  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 1 — auth.users  (fake rows — no real password, never log-in-able)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES
    (v_nike_uid,    '00000000-0000-0000-0000-000000000000','demo.nike@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Nike India","role":"brand"}',
     'authenticated','authenticated'),
    (v_adidas_uid,  '00000000-0000-0000-0000-000000000000','demo.adidas@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Adidas","role":"brand"}',
     'authenticated','authenticated'),
    (v_puma_uid,    '00000000-0000-0000-0000-000000000000','demo.puma@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Puma","role":"brand"}',
     'authenticated','authenticated'),
    (v_amazon_uid,  '00000000-0000-0000-0000-000000000000','demo.amazon@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Amazon India","role":"brand"}',
     'authenticated','authenticated'),
    (v_myntra_uid,  '00000000-0000-0000-0000-000000000000','demo.myntra@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Myntra","role":"brand"}',
     'authenticated','authenticated'),
    (v_nykaa_uid,   '00000000-0000-0000-0000-000000000000','demo.nykaa@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Nykaa","role":"brand"}',
     'authenticated','authenticated'),
    (v_samsung_uid, '00000000-0000-0000-0000-000000000000','demo.samsung@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Samsung India","role":"brand"}',
     'authenticated','authenticated'),
    (v_boat_uid,    '00000000-0000-0000-0000-000000000000','demo.boat@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"boAt","role":"brand"}',
     'authenticated','authenticated'),
    (v_swiggy_uid,  '00000000-0000-0000-0000-000000000000','demo.swiggy@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Swiggy","role":"brand"}',
     'authenticated','authenticated'),
    (v_zomato_uid,  '00000000-0000-0000-0000-000000000000','demo.zomato@influencehub.dev',
     crypt('demo-seed-no-login', gen_salt('bf')),
     NOW(), NOW(), NOW(),
     '{"provider":"email","providers":["email"]}','{"full_name":"Zomato","role":"brand"}',
     'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES
    (v_inf01_uid,'00000000-0000-0000-0000-000000000000','demo.priya@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Priya Sharma","role":"influencer"}',     'authenticated','authenticated'),
    (v_inf02_uid,'00000000-0000-0000-0000-000000000000','demo.rohan@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Rohan Verma","role":"influencer"}',      'authenticated','authenticated'),
    (v_inf03_uid,'00000000-0000-0000-0000-000000000000','demo.ananya@influencehub.dev',     crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Ananya Kapoor","role":"influencer"}',    'authenticated','authenticated'),
    (v_inf04_uid,'00000000-0000-0000-0000-000000000000','demo.arjun@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Arjun Singh","role":"influencer"}',      'authenticated','authenticated'),
    (v_inf05_uid,'00000000-0000-0000-0000-000000000000','demo.neha@influencehub.dev',       crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Neha Gupta","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf06_uid,'00000000-0000-0000-0000-000000000000','demo.vikram@influencehub.dev',     crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Vikram Malhotra","role":"influencer"}',  'authenticated','authenticated'),
    (v_inf07_uid,'00000000-0000-0000-0000-000000000000','demo.sakshi@influencehub.dev',     crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Sakshi Joshi","role":"influencer"}',     'authenticated','authenticated'),
    (v_inf08_uid,'00000000-0000-0000-0000-000000000000','demo.dev@influencehub.dev',        crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Dev Khanna","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf09_uid,'00000000-0000-0000-0000-000000000000','demo.ishaan@influencehub.dev',     crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Ishaan Chaudhary","role":"influencer"}', 'authenticated','authenticated'),
    (v_inf10_uid,'00000000-0000-0000-0000-000000000000','demo.meera@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Meera Iyer","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf11_uid,'00000000-0000-0000-0000-000000000000','demo.kabir@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Kabir Nair","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf12_uid,'00000000-0000-0000-0000-000000000000','demo.tanvi@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Tanvi Mehta","role":"influencer"}',      'authenticated','authenticated'),
    (v_inf13_uid,'00000000-0000-0000-0000-000000000000','demo.aditya@influencehub.dev',     crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Aditya Rao","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf14_uid,'00000000-0000-0000-0000-000000000000','demo.zara@influencehub.dev',       crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Zara Khan","role":"influencer"}',        'authenticated','authenticated'),
    (v_inf15_uid,'00000000-0000-0000-0000-000000000000','demo.rahul@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Rahul Bajaj","role":"influencer"}',      'authenticated','authenticated'),
    (v_inf16_uid,'00000000-0000-0000-0000-000000000000','demo.divya@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Divya Patel","role":"influencer"}',      'authenticated','authenticated'),
    (v_inf17_uid,'00000000-0000-0000-0000-000000000000','demo.siddharth@influencehub.dev',  crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Siddharth Mishra","role":"influencer"}', 'authenticated','authenticated'),
    (v_inf18_uid,'00000000-0000-0000-0000-000000000000','demo.nidhi@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Nidhi Sharma","role":"influencer"}',     'authenticated','authenticated'),
    (v_inf19_uid,'00000000-0000-0000-0000-000000000000','demo.yash@influencehub.dev',       crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Yash Dubey","role":"influencer"}',       'authenticated','authenticated'),
    (v_inf20_uid,'00000000-0000-0000-0000-000000000000','demo.pooja@influencehub.dev',      crypt('demo-seed-no-login',gen_salt('bf')),NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Pooja Reddy","role":"influencer"}',      'authenticated','authenticated')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '[seed] Step 1 complete — auth users inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 2 — profiles  (trigger is disabled; we insert directly)
  -- Exact columns: id, role, full_name, email, avatar_url, created_at
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.profiles (id, role, full_name, email, avatar_url, created_at) VALUES
    (v_nike_uid,    'brand','Nike India',    'demo.nike@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=NK&backgroundColor=111827&fontColor=ffffff',    NOW()-INTERVAL '90 days'),
    (v_adidas_uid,  'brand','Adidas',        'demo.adidas@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundColor=0f172a&fontColor=ffffff',    NOW()-INTERVAL '85 days'),
    (v_puma_uid,    'brand','Puma',          'demo.puma@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=dc2626&fontColor=ffffff',    NOW()-INTERVAL '80 days'),
    (v_amazon_uid,  'brand','Amazon India',  'demo.amazon@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=AZ&backgroundColor=f97316&fontColor=ffffff',    NOW()-INTERVAL '75 days'),
    (v_myntra_uid,  'brand','Myntra',        'demo.myntra@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=MY&backgroundColor=ec4899&fontColor=ffffff',    NOW()-INTERVAL '70 days'),
    (v_nykaa_uid,   'brand','Nykaa',         'demo.nykaa@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=NY&backgroundColor=e11d48&fontColor=ffffff',    NOW()-INTERVAL '65 days'),
    (v_samsung_uid, 'brand','Samsung India', 'demo.samsung@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=SS&backgroundColor=1d4ed8&fontColor=ffffff',    NOW()-INTERVAL '60 days'),
    (v_boat_uid,    'brand','boAt',          'demo.boat@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=BT&backgroundColor=7c3aed&fontColor=ffffff',    NOW()-INTERVAL '55 days'),
    (v_swiggy_uid,  'brand','Swiggy',        'demo.swiggy@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=SW&backgroundColor=ea580c&fontColor=ffffff',    NOW()-INTERVAL '50 days'),
    (v_zomato_uid,  'brand','Zomato',        'demo.zomato@influencehub.dev',
     'https://api.dicebear.com/7.x/initials/svg?seed=ZM&backgroundColor=dc2626&fontColor=ffffff',    NOW()-INTERVAL '45 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, role, full_name, email, avatar_url, created_at) VALUES
    (v_inf01_uid,'influencer','Priya Sharma',     'demo.priya@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=b6e3f4',     NOW()-INTERVAL '88 days'),
    (v_inf02_uid,'influencer','Rohan Verma',      'demo.rohan@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan&backgroundColor=c0aede',     NOW()-INTERVAL '82 days'),
    (v_inf03_uid,'influencer','Ananya Kapoor',    'demo.ananya@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&backgroundColor=ffd5dc',    NOW()-INTERVAL '78 days'),
    (v_inf04_uid,'influencer','Arjun Singh',      'demo.arjun@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=d1fae5',     NOW()-INTERVAL '74 days'),
    (v_inf05_uid,'influencer','Neha Gupta',       'demo.neha@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Neha&backgroundColor=fef3c7',      NOW()-INTERVAL '70 days'),
    (v_inf06_uid,'influencer','Vikram Malhotra',  'demo.vikram@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram&backgroundColor=e0e7ff',    NOW()-INTERVAL '66 days'),
    (v_inf07_uid,'influencer','Sakshi Joshi',     'demo.sakshi@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakshi&backgroundColor=fce7f3',    NOW()-INTERVAL '62 days'),
    (v_inf08_uid,'influencer','Dev Khanna',       'demo.dev@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev&backgroundColor=cffafe',       NOW()-INTERVAL '58 days'),
    (v_inf09_uid,'influencer','Ishaan Chaudhary', 'demo.ishaan@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishaan&backgroundColor=dcfce7',    NOW()-INTERVAL '54 days'),
    (v_inf10_uid,'influencer','Meera Iyer',       'demo.meera@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera&backgroundColor=fdf4ff',     NOW()-INTERVAL '50 days'),
    (v_inf11_uid,'influencer','Kabir Nair',       'demo.kabir@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Kabir&backgroundColor=ffe4e6',     NOW()-INTERVAL '46 days'),
    (v_inf12_uid,'influencer','Tanvi Mehta',      'demo.tanvi@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanvi&backgroundColor=f0fdf4',     NOW()-INTERVAL '42 days'),
    (v_inf13_uid,'influencer','Aditya Rao',       'demo.aditya@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya&backgroundColor=eff6ff',    NOW()-INTERVAL '38 days'),
    (v_inf14_uid,'influencer','Zara Khan',        'demo.zara@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=fdf2f8',      NOW()-INTERVAL '34 days'),
    (v_inf15_uid,'influencer','Rahul Bajaj',      'demo.rahul@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&backgroundColor=f0f9ff',     NOW()-INTERVAL '30 days'),
    (v_inf16_uid,'influencer','Divya Patel',      'demo.divya@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya&backgroundColor=fefce8',     NOW()-INTERVAL '26 days'),
    (v_inf17_uid,'influencer','Siddharth Mishra', 'demo.siddharth@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Siddharth&backgroundColor=f0fdf4', NOW()-INTERVAL '22 days'),
    (v_inf18_uid,'influencer','Nidhi Sharma',     'demo.nidhi@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Nidhi&backgroundColor=fff7ed',     NOW()-INTERVAL '18 days'),
    (v_inf19_uid,'influencer','Yash Dubey',       'demo.yash@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Yash&backgroundColor=f5f3ff',      NOW()-INTERVAL '14 days'),
    (v_inf20_uid,'influencer','Pooja Reddy',      'demo.pooja@influencehub.dev',
     'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja&backgroundColor=fce7f3',     NOW()-INTERVAL '10 days')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '[seed] Step 2 complete — profiles inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 3 — brands
  -- Exact columns: user_id, company_name, industry, website, logo,
  --                description, created_at
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.brands
    (user_id, company_name, industry, website, logo, description, created_at)
  VALUES
    (v_nike_uid,   'Nike India',    'Sports & Fitness',     'https://www.nike.com/in',
     'https://api.dicebear.com/7.x/initials/svg?seed=NK&backgroundColor=111827&fontColor=ffffff',
     'World''s leading athletic footwear and apparel brand inspiring athletes worldwide.',
     NOW()-INTERVAL '90 days'),
    (v_adidas_uid, 'Adidas',        'Sports & Fitness',     'https://www.adidas.co.in',
     'https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundColor=0f172a&fontColor=ffffff',
     'German multinational sportswear brand known for quality athletic gear.',
     NOW()-INTERVAL '85 days'),
    (v_puma_uid,   'Puma',          'Sports & Fitness',     'https://in.puma.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=PM&backgroundColor=dc2626&fontColor=ffffff',
     'Global sports brand designing footwear, apparel and accessories for sport and lifestyle.',
     NOW()-INTERVAL '80 days'),
    (v_amazon_uid, 'Amazon India',  'E-Commerce',           'https://www.amazon.in',
     'https://api.dicebear.com/7.x/initials/svg?seed=AZ&backgroundColor=f97316&fontColor=ffffff',
     'India''s largest online marketplace offering millions of products across all categories.',
     NOW()-INTERVAL '75 days'),
    (v_myntra_uid, 'Myntra',        'Fashion & Retail',     'https://www.myntra.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=MY&backgroundColor=ec4899&fontColor=ffffff',
     'India''s leading fashion e-commerce platform for clothing, shoes and accessories.',
     NOW()-INTERVAL '70 days'),
    (v_nykaa_uid,  'Nykaa',         'Beauty & Cosmetics',   'https://www.nykaa.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=NY&backgroundColor=e11d48&fontColor=ffffff',
     'India''s #1 beauty and personal care destination with 3000+ brands.',
     NOW()-INTERVAL '65 days'),
    (v_samsung_uid,'Samsung India', 'Consumer Electronics', 'https://www.samsung.com/in',
     'https://api.dicebear.com/7.x/initials/svg?seed=SS&backgroundColor=1d4ed8&fontColor=ffffff',
     'Leading technology brand offering smartphones, TVs, appliances and more in India.',
     NOW()-INTERVAL '60 days'),
    (v_boat_uid,   'boAt',          'Consumer Electronics', 'https://www.boat-lifestyle.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=BT&backgroundColor=7c3aed&fontColor=ffffff',
     'India''s #1 audio brand delivering quality audio products at accessible prices.',
     NOW()-INTERVAL '55 days'),
    (v_swiggy_uid, 'Swiggy',        'Food & Beverage',      'https://www.swiggy.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=SW&backgroundColor=ea580c&fontColor=ffffff',
     'India''s leading food delivery platform connecting millions to local restaurants.',
     NOW()-INTERVAL '50 days'),
    (v_zomato_uid, 'Zomato',        'Food & Beverage',      'https://www.zomato.com',
     'https://api.dicebear.com/7.x/initials/svg?seed=ZM&backgroundColor=dc2626&fontColor=ffffff',
     'India''s most popular food delivery and restaurant discovery platform.',
     NOW()-INTERVAL '45 days')
  ON CONFLICT (user_id) DO NOTHING;

  -- Resolve brand row IDs
  SELECT id INTO v_nike_bid    FROM public.brands WHERE user_id = v_nike_uid;
  SELECT id INTO v_adidas_bid  FROM public.brands WHERE user_id = v_adidas_uid;
  SELECT id INTO v_puma_bid    FROM public.brands WHERE user_id = v_puma_uid;
  SELECT id INTO v_amazon_bid  FROM public.brands WHERE user_id = v_amazon_uid;
  SELECT id INTO v_myntra_bid  FROM public.brands WHERE user_id = v_myntra_uid;
  SELECT id INTO v_nykaa_bid   FROM public.brands WHERE user_id = v_nykaa_uid;
  SELECT id INTO v_samsung_bid FROM public.brands WHERE user_id = v_samsung_uid;
  SELECT id INTO v_boat_bid    FROM public.brands WHERE user_id = v_boat_uid;
  SELECT id INTO v_swiggy_bid  FROM public.brands WHERE user_id = v_swiggy_uid;
  SELECT id INTO v_zomato_bid  FROM public.brands WHERE user_id = v_zomato_uid;

  RAISE NOTICE '[seed] Step 3 complete — brands inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 4 — influencers
  -- Exact columns (from schema.sql):
  --   user_id, platform, niche, followers_count, engagement_rate,
  --   bio, location, instagram_url, youtube_url, tiktok_url, is_public,
  --   instagram_connected, instagram_business_id, instagram_username,
  --   instagram_token_expires_at, created_at
  -- NOTE: instagram_access_token is intentionally omitted — the REVOKE
  --   on SELECT means even service_role can't SELECT it via PostgREST,
  --   but we can still INSERT NULL via direct SQL (SECURITY DEFINER).
  --   We leave it NULL for demo rows since no real OAuth flow ran.
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.influencers (
    user_id, platform, niche, followers_count, engagement_rate,
    bio, location, instagram_url, youtube_url, tiktok_url,
    is_public, instagram_connected, instagram_business_id,
    instagram_username, instagram_token_expires_at, created_at
  ) VALUES
    (v_inf01_uid,'instagram','Fashion',    1200000,4.8,
     'Fashion blogger & style curator. Sharing daily OOTD and styling tips from Mumbai.',
     'Mumbai, India','https://instagram.com/priya.styles',NULL,NULL,
     TRUE,TRUE,NULL,'priya.styles',NULL,NOW()-INTERVAL '88 days'),

    (v_inf02_uid,'youtube','Technology',   850000, 6.2,
     'Tech reviewer & gadget enthusiast. Breaking down the latest tech for everyday Indians.',
     'Bangalore, India','https://instagram.com/rohan.techtalks','https://youtube.com/@rohanvermatech',NULL,
     TRUE,TRUE,NULL,'rohan.techtalks',NULL,NOW()-INTERVAL '82 days'),

    (v_inf03_uid,'instagram','Beauty',     620000, 5.5,
     'Makeup artist & beauty influencer. Indian skin tone tips, product reviews & tutorials.',
     'Delhi, India','https://instagram.com/ananya.beauty',NULL,NULL,
     TRUE,TRUE,NULL,'ananya.beauty',NULL,NOW()-INTERVAL '78 days'),

    (v_inf04_uid,'youtube','Fitness',      980000, 7.1,
     'Certified personal trainer sharing workouts, diet plans and fitness motivation.',
     'Pune, India','https://instagram.com/arjun.fitlife','https://youtube.com/@arjunfitness',NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '74 days'),

    (v_inf05_uid,'instagram','Food',       430000, 5.9,
     'Home chef & food blogger. Recreating restaurant dishes at home with a desi twist.',
     'Hyderabad, India','https://instagram.com/neha.foodlove',NULL,NULL,
     TRUE,TRUE,NULL,'neha.foodlove',NULL,NOW()-INTERVAL '70 days'),

    (v_inf06_uid,'instagram','Travel',     290000, 4.3,
     'Solo travel photographer exploring India''s hidden gems on a budget.',
     'Jaipur, India','https://instagram.com/vikram.wanderer',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '66 days'),

    (v_inf07_uid,'tiktok','Lifestyle',     510000, 8.4,
     'Lifestyle content creator — morning routines, productivity hacks and mindful living.',
     'Chennai, India','https://instagram.com/sakshi.lifestyle',NULL,NULL,
     TRUE,TRUE,NULL,'sakshi.lifestyle',NULL,NOW()-INTERVAL '62 days'),

    (v_inf08_uid,'youtube','Gaming',       760000, 9.2,
     'Pro gamer and content creator. BGMI, Valorant and gaming hardware reviews.',
     'Kolkata, India','https://instagram.com/dev.gamerx','https://youtube.com/@devgamerx',NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '58 days'),

    (v_inf09_uid,'instagram','Education',  185000, 6.7,
     'IIT alumni making engineering and science concepts simple for Indian students.',
     'Ahmedabad, India','https://instagram.com/ishaan.learns',NULL,NULL,
     TRUE,TRUE,NULL,'ishaan.learns',NULL,NOW()-INTERVAL '54 days'),

    (v_inf10_uid,'instagram','Finance',    340000, 5.1,
     'Chartered Accountant breaking down personal finance, investing & tax-saving for millennials.',
     'Surat, India','https://instagram.com/meera.moneywise',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '50 days'),

    (v_inf11_uid,'instagram','Fashion',    92000,  7.8,
     'Sustainable fashion advocate. Thrift hauls, eco-friendly brands and slow fashion tips.',
     'Kochi, India','https://instagram.com/kabir.sustainstyle',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '46 days'),

    (v_inf12_uid,'instagram','Beauty',     48000,  9.1,
     'Skincare minimalist. Honest reviews of drugstore and premium skincare for Indian skin.',
     'Nagpur, India','https://instagram.com/tanvi.skincared',NULL,NULL,
     TRUE,TRUE,NULL,'tanvi.skincared',NULL,NOW()-INTERVAL '42 days'),

    (v_inf13_uid,'youtube','Technology',   1500000,5.4,
     'India''s most watched smartphone reviewer. Unboxings, comparisons and long-term reviews.',
     'Bangalore, India','https://instagram.com/aditya.techprime','https://youtube.com/@adityarao',NULL,
     TRUE,TRUE,NULL,'aditya.techprime',NULL,NOW()-INTERVAL '38 days'),

    (v_inf14_uid,'instagram','Fashion',    275000, 6.0,
     'Luxury & contemporary fashion curator. Street style, brand hauls and fashion weeks.',
     'Mumbai, India','https://instagram.com/zara.luxestyle',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '34 days'),

    (v_inf15_uid,'instagram','Fitness',    65000,  8.8,
     'Marathon runner & triathlete sharing training plans, gear reviews and race recaps.',
     'Gurgaon, India','https://instagram.com/rahul.runstrong',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '30 days'),

    (v_inf16_uid,'instagram','Food',       120000, 7.3,
     'Street food explorer documenting India''s best chaat, biryani and regional cuisines.',
     'Lucknow, India','https://instagram.com/divya.streetfood',NULL,NULL,
     TRUE,TRUE,NULL,'divya.streetfood',NULL,NOW()-INTERVAL '26 days'),

    (v_inf17_uid,'youtube','Education',    520000, 6.9,
     'UPSC and competitive exam coach making civil services accessible to rural India.',
     'Bhopal, India','https://instagram.com/siddharth.upscpro','https://youtube.com/@siddharthmishra',NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '22 days'),

    (v_inf18_uid,'instagram','Lifestyle',  210000, 5.7,
     'Wellness & mental health advocate. Yoga, meditation and self-care for busy professionals.',
     'Pune, India','https://instagram.com/nidhi.wellbeing',NULL,NULL,
     TRUE,TRUE,NULL,'nidhi.wellbeing',NULL,NOW()-INTERVAL '18 days'),

    (v_inf19_uid,'instagram','Gaming',     38000,  11.2,
     'Mobile gaming micro-influencer. BGMI tips, CODM strategies and esports commentary.',
     'Indore, India','https://instagram.com/yash.gaminghub',NULL,NULL,
     TRUE,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '14 days'),

    (v_inf20_uid,'instagram','Finance',    155000, 6.4,
     'Stock market educator and options trader. Making equity investing accessible to beginners.',
     'Hyderabad, India','https://instagram.com/pooja.investsmart',NULL,NULL,
     TRUE,TRUE,NULL,'pooja.investsmart',NULL,NOW()-INTERVAL '10 days')
  ON CONFLICT (user_id) DO NOTHING;

  -- Resolve influencer row IDs
  SELECT id INTO v_inf01_iid FROM public.influencers WHERE user_id = v_inf01_uid;
  SELECT id INTO v_inf02_iid FROM public.influencers WHERE user_id = v_inf02_uid;
  SELECT id INTO v_inf03_iid FROM public.influencers WHERE user_id = v_inf03_uid;
  SELECT id INTO v_inf04_iid FROM public.influencers WHERE user_id = v_inf04_uid;
  SELECT id INTO v_inf05_iid FROM public.influencers WHERE user_id = v_inf05_uid;
  SELECT id INTO v_inf06_iid FROM public.influencers WHERE user_id = v_inf06_uid;
  SELECT id INTO v_inf07_iid FROM public.influencers WHERE user_id = v_inf07_uid;
  SELECT id INTO v_inf08_iid FROM public.influencers WHERE user_id = v_inf08_uid;
  SELECT id INTO v_inf09_iid FROM public.influencers WHERE user_id = v_inf09_uid;
  SELECT id INTO v_inf10_iid FROM public.influencers WHERE user_id = v_inf10_uid;
  SELECT id INTO v_inf11_iid FROM public.influencers WHERE user_id = v_inf11_uid;
  SELECT id INTO v_inf12_iid FROM public.influencers WHERE user_id = v_inf12_uid;
  SELECT id INTO v_inf13_iid FROM public.influencers WHERE user_id = v_inf13_uid;
  SELECT id INTO v_inf14_iid FROM public.influencers WHERE user_id = v_inf14_uid;
  SELECT id INTO v_inf15_iid FROM public.influencers WHERE user_id = v_inf15_uid;
  SELECT id INTO v_inf16_iid FROM public.influencers WHERE user_id = v_inf16_uid;
  SELECT id INTO v_inf17_iid FROM public.influencers WHERE user_id = v_inf17_uid;
  SELECT id INTO v_inf18_iid FROM public.influencers WHERE user_id = v_inf18_uid;
  SELECT id INTO v_inf19_iid FROM public.influencers WHERE user_id = v_inf19_uid;
  SELECT id INTO v_inf20_iid FROM public.influencers WHERE user_id = v_inf20_uid;

  RAISE NOTICE '[seed] Step 4 complete — influencers inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 5 — campaigns
  -- Exact columns: id, brand_id, title, description, budget,
  --                deadline, status, created_at
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.campaigns
    (id, brand_id, title, description, budget, deadline, status, created_at)
  VALUES
    (v_camp01,v_nike_bid,
     'Summer Fashion Collection 2026',
     'We are looking for fashion and lifestyle influencers to showcase our new Summer 2026 collection. Create authentic content featuring our latest sneakers, apparel and accessories.',
     450000, CURRENT_DATE+45, 'in_progress', NOW()-INTERVAL '30 days'),

    (v_camp02,v_samsung_bid,
     'Galaxy S25 Smartphone Launch',
     'Seeking tech reviewers to unbox, review and compare the Samsung Galaxy S25 series. Focus on camera performance, AI features and battery life comparisons.',
     500000, CURRENT_DATE+30, 'in_progress', NOW()-INTERVAL '25 days'),

    (v_camp03,v_nykaa_bid,
     'Nykaa Beauty Festival 2026',
     'India''s biggest beauty sale is back! We need beauty influencers to drive awareness, showcase product demos and share exclusive discount codes with their audience.',
     350000, CURRENT_DATE+20, 'accepted', NOW()-INTERVAL '20 days'),

    (v_camp04,v_swiggy_bid,
     'Swiggy Monsoon Food Festival',
     'Partner with India''s favorite food delivery app to promote our exclusive Monsoon Food Festival. Share your favorite rainy-day food orders and comfort meals.',
     180000, CURRENT_DATE+35, 'in_progress', NOW()-INTERVAL '18 days'),

    (v_camp05,v_boat_bid,
     'boAt Audio Independence Day Sale',
     'Celebrate Independence Day with boAt. Influencers needed to promote our limited-edition audio products with patriotic themes and special discount codes.',
     120000, CURRENT_DATE+15, 'requested', NOW()-INTERVAL '15 days'),

    (v_camp06,v_myntra_bid,
     'Back to College Fashion Haul',
     'Help students gear up for college season with Myntra''s latest collection. Create haul videos, style guides and outfit ideas perfect for campus life.',
     280000, CURRENT_DATE+50, 'requested', NOW()-INTERVAL '12 days'),

    (v_camp07,v_amazon_bid,
     'Amazon Great Indian Festival Prep',
     'India''s biggest shopping festival is coming. We need creators to build hype, share wishlists, do unboxings and publish honest reviews of festival deals.',
     400000, CURRENT_DATE+60, 'accepted', NOW()-INTERVAL '10 days'),

    (v_camp08,v_zomato_bid,
     'Zomato Binge Campaign',
     'Late-night cravings meet Zomato Binge! Content creators needed to showcase late-night delivery experiences, review restaurant discoveries and share midnight snack moments.',
     150000, CURRENT_DATE+25, 'completed', NOW()-INTERVAL '45 days'),

    (v_camp09,v_puma_bid,
     'Puma Fitness Challenge',
     'Challenge accepted! Puma wants fitness influencers to run the 30-day #PumaFitChallenge — daily workouts, progress photos and community engagement.',
     220000, CURRENT_DATE-5, 'completed', NOW()-INTERVAL '60 days'),

    (v_camp10,v_adidas_bid,
     'Adidas Originals Street Style',
     'Celebrate street culture with Adidas Originals. We want content creators who live and breathe urban fashion to showcase Originals collections in authentic, creative ways.',
     320000, CURRENT_DATE+40, 'requested', NOW()-INTERVAL '8 days')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '[seed] Step 5 complete — campaigns inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 6 — campaign_requests
  -- Exact columns: campaign_id, brand_id, influencer_id, status,
  --                message, created_at
  -- Unique constraint: (campaign_id, influencer_id)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.campaign_requests
    (campaign_id, brand_id, influencer_id, status, message, created_at)
  VALUES
    (v_camp01,v_nike_bid,   v_inf01_iid,'accepted',
     'Hi Priya! Your fashion content is exactly what we need for our Summer 2026 campaign. Would love to collaborate on showcasing our new collection.',NOW()-INTERVAL '28 days'),
    (v_camp01,v_nike_bid,   v_inf14_iid,'accepted',
     'Zara, your luxury fashion aesthetics are a perfect match for Nike''s premium Summer line. Let''s create something iconic together!',NOW()-INTERVAL '26 days'),
    (v_camp01,v_nike_bid,   v_inf11_iid,'requested',
     'Kabir, we love your sustainable fashion angle! We''d like to explore eco-conscious storytelling for our recycled materials line.',NOW()-INTERVAL '24 days'),

    (v_camp02,v_samsung_bid,v_inf02_iid,'accepted',
     'Rohan! Your Samsung S24 review was incredible. We''d love to make you our official S25 launch partner.',NOW()-INTERVAL '23 days'),
    (v_camp02,v_samsung_bid,v_inf13_iid,'accepted',
     'Aditya, with 1.5M subscribers you''re the perfect partner to amplify our Galaxy S25 launch. Interested in an exclusive unboxing?',NOW()-INTERVAL '22 days'),
    (v_camp02,v_samsung_bid,v_inf08_iid,'requested',
     'Dev, your gaming audience would love to see the S25 Ultra''s gaming performance. We''d like a dedicated benchmark video.',NOW()-INTERVAL '20 days'),

    (v_camp03,v_nykaa_bid,  v_inf03_iid,'accepted',
     'Ananya! Your Nykaa reviews always drive incredible engagement. We want you as our lead beauty ambassador for the festival.',NOW()-INTERVAL '18 days'),
    (v_camp03,v_nykaa_bid,  v_inf12_iid,'accepted',
     'Tanvi, your skincare minimalist angle is refreshing! We''d love you to curate a festival skincare essentials edit.',NOW()-INTERVAL '17 days'),
    (v_camp03,v_nykaa_bid,  v_inf07_iid,'requested',
     'Sakshi, your lifestyle audience overlaps perfectly with Nykaa''s demographic. Would you share your beauty festival picks?',NOW()-INTERVAL '15 days'),

    (v_camp04,v_swiggy_bid, v_inf05_iid,'accepted',
     'Neha! Your food photography is stunning. We want you to create a series of monsoon comfort food stories for us.',NOW()-INTERVAL '16 days'),
    (v_camp04,v_swiggy_bid, v_inf16_iid,'requested',
     'Divya, your street food content is incredibly authentic. We''d love you to explore Swiggy''s new street food partners.',NOW()-INTERVAL '14 days'),

    (v_camp05,v_boat_bid,   v_inf07_iid,'requested',
     'Sakshi, your lifestyle content would be perfect for boAt''s Independence Day campaign. Share your celebration soundtrack!',NOW()-INTERVAL '13 days'),
    (v_camp05,v_boat_bid,   v_inf18_iid,'requested',
     'Nidhi, your wellness audience would love boAt''s new wellness audio products. Feature us in your morning routine?',NOW()-INTERVAL '12 days'),

    (v_camp06,v_myntra_bid, v_inf01_iid,'requested',
     'Priya, your college fashion content is always trending. Help us create the ultimate back-to-college lookbook for 2026!',NOW()-INTERVAL '11 days'),
    (v_camp06,v_myntra_bid, v_inf03_iid,'requested',
     'Ananya, we''d love a beauty + fashion collab — makeup looks paired with Myntra''s new college collection!',NOW()-INTERVAL '10 days'),

    (v_camp07,v_amazon_bid, v_inf02_iid,'accepted',
     'Rohan, tech wishlist videos perform amazingly for Amazon sale campaigns. Create the ultimate tech deals guide.',NOW()-INTERVAL '9 days'),
    (v_camp07,v_amazon_bid, v_inf13_iid,'accepted',
     'Aditya, your audience trusts your tech recommendations. Create a Top 10 Tech Deals video for the festival.',NOW()-INTERVAL '8 days'),

    (v_camp08,v_zomato_bid, v_inf05_iid,'accepted',
     'Neha, late-night food stories with Zomato Binge — your audience would absolutely love this!',NOW()-INTERVAL '44 days'),
    (v_camp08,v_zomato_bid, v_inf16_iid,'accepted',
     'Divya, your street food expertise + Zomato Binge = perfect content! Let''s showcase the best midnight bites.',NOW()-INTERVAL '43 days'),

    (v_camp09,v_puma_bid,   v_inf04_iid,'accepted',
     'Arjun, you are the perfect face for Puma''s Fitness Challenge! Your training content is exactly what our audience needs.',NOW()-INTERVAL '58 days'),
    (v_camp09,v_puma_bid,   v_inf15_iid,'accepted',
     'Rahul, marathon runners represent the ultimate Puma spirit! Join our 30-day challenge as an elite runner.',NOW()-INTERVAL '56 days'),

    (v_camp10,v_adidas_bid, v_inf01_iid,'requested',
     'Priya, Adidas Originals street style needs your eye for fashion. Create an authentic urban lookbook with our Originals line.',NOW()-INTERVAL '7 days'),
    (v_camp10,v_adidas_bid, v_inf11_iid,'requested',
     'Kabir, sustainable meets street style — Adidas Originals eco collection needs your voice!',NOW()-INTERVAL '6 days')
  ON CONFLICT (campaign_id, influencer_id) DO NOTHING;

  RAISE NOTICE '[seed] Step 6 complete — campaign requests inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 7 — campaign_notes
  -- Exact columns: campaign_id, sender_id, message, created_at
  -- NO unique constraint on this table (only PK id) — use INSERT … WHERE
  -- NOT EXISTS to stay idempotent without an ON CONFLICT target.
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.campaign_notes (campaign_id, sender_id, message, created_at)
  SELECT * FROM (VALUES
    (v_camp01, v_nike_uid,    'Welcome to the Nike Summer 2026 campaign! We''ve sent the brand kit, mood board and content guidelines. Please review and confirm receipt.',        NOW()-INTERVAL '27 days'),
    (v_camp01, v_inf01_uid,   'Received everything! The mood board is stunning. I''ll have my first content draft ready by this weekend.',                                        NOW()-INTERVAL '26 days'),
    (v_camp01, v_nike_uid,    'Looking forward to it. Remember to tag @nikeindia and use #NikeSummer2026 on all posts.',                                                          NOW()-INTERVAL '25 days'),
    (v_camp02, v_samsung_uid, 'Galaxy S25 devices have been shipped to your address. Unboxing can go live from Monday 9 AM. Embargo strictly until then!',                       NOW()-INTERVAL '22 days'),
    (v_camp02, v_inf02_uid,   'Device received! Already setting up the studio shot. The camera upgrade is genuinely impressive.',                                                 NOW()-INTERVAL '21 days'),
    (v_camp03, v_nykaa_uid,   'Your press kit and PR products have been dispatched. Includes the full festival collection — 12 products!',                                        NOW()-INTERVAL '17 days'),
    (v_camp03, v_inf03_uid,   'Package arrived today! The packaging is gorgeous. I''ll do an unboxing this weekend and full reviews next week.',                                  NOW()-INTERVAL '16 days'),
    (v_camp08, v_zomato_uid,  'Campaign completed! Amazing results — both posts went viral with 2.3M combined reach. Thank you for the brilliant execution!',                    NOW()-INTERVAL '5 days'),
    (v_camp09, v_puma_uid,    'Day 30 Challenge Complete! Arjun and Rahul, you both absolutely crushed it. Final stats: 4.2M impressions, 28K new followers for Puma India.',    NOW()-INTERVAL '3 days')
  ) AS t(campaign_id, sender_id, message, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.campaign_notes n
    WHERE n.campaign_id = t.campaign_id
      AND n.sender_id   = t.sender_id
      AND n.message     = t.message
  );

  RAISE NOTICE '[seed] Step 7 complete — campaign notes inserted';

  -- ════════════════════════════════════════════════════════════════════════
  -- STEP 8 — notifications
  -- Exact columns: user_id, title, message, read, type, link, created_at
  -- NO unique constraint — same WHERE NOT EXISTS pattern.
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.notifications (user_id, title, message, read, type, link, created_at)
  SELECT * FROM (VALUES
    (v_inf01_uid,'Collaboration Accepted!',   'Nike India has accepted your collaboration for "Summer Fashion Collection 2026". Get started now!',       TRUE, 'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '27 days'),
    (v_inf01_uid,'New Collaboration Request', 'Myntra wants to collaborate with you on "Back to College Fashion Haul". Check the details!',              FALSE,'request'::notification_type, '/influencer/requests', NOW()-INTERVAL '11 days'),
    (v_inf01_uid,'New Collaboration Request', 'Adidas wants you for "Adidas Originals Street Style". View the request!',                                 FALSE,'request'::notification_type, '/influencer/requests', NOW()-INTERVAL '7 days'),
    (v_inf02_uid,'Collaboration Accepted!',   'Samsung India accepted your collaboration for "Galaxy S25 Smartphone Launch". Check your inbox!',         TRUE, 'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '22 days'),
    (v_inf02_uid,'Collaboration Accepted!',   'Amazon India accepted your collaboration for "Amazon Great Indian Festival Prep". Great work!',           FALSE,'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '9 days'),
    (v_inf03_uid,'Collaboration Accepted!',   'Nykaa has accepted your collaboration for "Nykaa Beauty Festival 2026". Products incoming!',             TRUE, 'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '17 days'),
    (v_inf03_uid,'New Collaboration Request', 'Myntra wants you for "Back to College Fashion Haul". View and respond to the request!',                   FALSE,'request'::notification_type, '/influencer/requests', NOW()-INTERVAL '10 days'),
    (v_inf04_uid,'Campaign Completed!',       'Congratulations! The Puma Fitness Challenge campaign has been marked complete. Great work!',              TRUE, 'completed'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '3 days'),
    (v_inf05_uid,'Collaboration Accepted!',   'Swiggy accepted your collaboration for "Swiggy Monsoon Food Festival". Looking forward to it!',          TRUE, 'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '16 days'),
    (v_inf05_uid,'Campaign Completed!',       'Zomato Binge campaign is complete! Your content drove incredible engagement. Thank you!',                TRUE, 'completed'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '5 days'),
    (v_inf13_uid,'Collaboration Accepted!',   'Samsung India selected you as a launch partner for the Galaxy S25 campaign. Embargo details sent!',      TRUE, 'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '21 days'),
    (v_inf13_uid,'Collaboration Accepted!',   'Amazon India confirmed your collaboration for the Great Indian Festival campaign. Let''s go!',           FALSE,'accepted'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '8 days'),
    (v_inf15_uid,'Campaign Completed!',       'Puma Fitness Challenge done! You ran 30 days of incredible content. A big win for the Puma community!', TRUE, 'completed'::notification_type,'/influencer/campaigns',NOW()-INTERVAL '3 days'),
    (v_myntra_uid,'New Influencer Response',  'Priya Sharma has viewed your Back to College campaign request. Awaiting response.',                       FALSE,'request'::notification_type, '/brand/campaigns',    NOW()-INTERVAL '10 days'),
    (v_adidas_uid,'New Influencer Response',  'Priya Sharma has viewed your Adidas Originals campaign request. Awaiting response.',                     FALSE,'request'::notification_type, '/brand/campaigns',    NOW()-INTERVAL '6 days'),
    (v_swiggy_uid,'Campaign Update',          'Your Monsoon Food Festival campaign is performing well! Two influencers are now active.',                 TRUE, 'accepted'::notification_type,'/brand/campaigns',    NOW()-INTERVAL '14 days'),
    (v_zomato_uid,'Campaign Completed!',      'Zomato Binge campaign wrapped up with 2.3M combined reach across both creators. Excellent ROI!',         TRUE, 'completed'::notification_type,'/brand/campaigns',   NOW()-INTERVAL '5 days'),
    (v_puma_uid,  'Campaign Completed!',      'Puma Fitness Challenge is complete! 4.2M impressions and 28K new followers gained. Outstanding!',        TRUE, 'completed'::notification_type,'/brand/campaigns',   NOW()-INTERVAL '3 days')
  ) AS t(user_id, title, message, read, type, link, created_at)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = t.user_id AND n.title = t.title AND n.message = t.message
  );

  RAISE NOTICE '[seed] Step 8 complete — notifications inserted';

  -- ── Re-enable triggers ────────────────────────────────────────────────────
  ALTER TABLE auth.users       ENABLE TRIGGER on_auth_user_created;
  ALTER TABLE public.profiles  ENABLE TRIGGER on_profile_created;

  RAISE NOTICE '[seed] ✅ Demo data seeding complete!';

  RETURN jsonb_build_object(
    'status',        'success',
    'brands',        10,
    'influencers',   20,
    'campaigns',     10,
    'requests',      22,
    'notes',         9,
    'notifications', 18
  );

EXCEPTION WHEN OTHERS THEN
  -- Always re-enable triggers even on failure
  BEGIN
    ALTER TABLE auth.users      ENABLE TRIGGER on_auth_user_created;
    ALTER TABLE public.profiles ENABLE TRIGGER on_profile_created;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RAISE WARNING '[seed] Error: %', SQLERRM;
  RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Grant execute to service_role (used by the TypeScript RPC caller)
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO service_role;

-- ── Run immediately (uncomment to seed right now) ────────────────────────────
-- SELECT public.seed_demo_data();
