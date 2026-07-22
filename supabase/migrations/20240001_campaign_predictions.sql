-- Campaign Performance Predictions
-- Run this in your Supabase SQL editor or via supabase db push

create table if not exists public.campaign_predictions (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid not null references public.brands(id) on delete cascade,
  campaign_id         uuid references public.campaigns(id) on delete set null,
  influencer_id       uuid not null references public.influencers(id) on delete cascade,

  -- Inputs snapshot (so history stays meaningful even if influencer data changes)
  influencer_name     text not null,
  influencer_platform text not null,
  influencer_niche    text not null,
  influencer_followers bigint not null,
  influencer_engagement_rate numeric(6,3) not null,
  influencer_location text,
  campaign_title      text,
  campaign_budget     numeric(12,2),

  -- Prediction outputs
  success_score       integer not null check (success_score between 0 and 100),
  confidence_score    integer not null check (confidence_score between 0 and 100),
  estimated_reach     bigint not null,
  estimated_engagement bigint not null,
  expected_clicks     bigint not null,
  expected_conversions bigint not null,
  predicted_roi       numeric(8,2) not null,

  -- AI insight text
  insights            text[] not null default '{}',
  risk_factors        text[] not null default '{}',

  created_at          timestamptz not null default now()
);

-- Index for fast brand history lookups
create index if not exists idx_campaign_predictions_brand_id
  on public.campaign_predictions(brand_id, created_at desc);

create index if not exists idx_campaign_predictions_influencer_id
  on public.campaign_predictions(influencer_id);

-- RLS
alter table public.campaign_predictions enable row level security;

-- Brands can only see and write their own predictions
create policy "brands_select_own_predictions"
  on public.campaign_predictions for select
  using (
    brand_id in (
      select id from public.brands where user_id = auth.uid()
    )
  );

create policy "brands_insert_own_predictions"
  on public.campaign_predictions for insert
  with check (
    brand_id in (
      select id from public.brands where user_id = auth.uid()
    )
  );

create policy "brands_delete_own_predictions"
  on public.campaign_predictions for delete
  using (
    brand_id in (
      select id from public.brands where user_id = auth.uid()
    )
  );
