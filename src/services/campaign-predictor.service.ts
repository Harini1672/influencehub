/**
 * Campaign Performance Predictor — pure client-side AI engine.
 *
 * Scoring model (total 100 pts):
 *   Niche match         25 pts
 *   Engagement quality  25 pts
 *   Audience size       20 pts
 *   Platform fit        15 pts
 *   Location relevance  15 pts
 *
 * From the success score the engine derives estimated reach, engagement,
 * clicks, conversions, and ROI using calibrated multipliers per platform.
 */

import type {
  CampaignPrediction,
  PredictionInput,
  PredictionScoreBreakdown,
} from '@/types'

// ── Platform multipliers ──────────────────────────────────────────────────────

interface PlatformProfile {
  reachMultiplier: number      // fraction of followers typically reached per post
  clickThroughRate: number     // clicks / engagement
  conversionRate: number       // conversions / clicks
  avgCostPerEngagement: number // USD — used for ROI denominator baseline
}

const PLATFORM_PROFILES: Record<string, PlatformProfile> = {
  instagram: { reachMultiplier: 0.35, clickThroughRate: 0.025, conversionRate: 0.045, avgCostPerEngagement: 0.12 },
  youtube:   { reachMultiplier: 0.55, clickThroughRate: 0.04,  conversionRate: 0.055, avgCostPerEngagement: 0.20 },
  tiktok:    { reachMultiplier: 0.65, clickThroughRate: 0.018, conversionRate: 0.035, avgCostPerEngagement: 0.08 },
  twitter:   { reachMultiplier: 0.28, clickThroughRate: 0.015, conversionRate: 0.025, avgCostPerEngagement: 0.06 },
  other:     { reachMultiplier: 0.30, clickThroughRate: 0.02,  conversionRate: 0.03,  avgCostPerEngagement: 0.10 },
}

// ── Industry → niche keyword map (same as AI recommendation service) ──────────

const INDUSTRY_NICHE_MAP: Record<string, string[]> = {
  fashion:       ['fashion', 'style', 'clothing', 'apparel', 'outfit', 'lifestyle'],
  beauty:        ['beauty', 'makeup', 'skincare', 'cosmetics', 'wellness', 'health'],
  technology:    ['tech', 'technology', 'gadgets', 'software', 'coding', 'gaming', 'ai'],
  gaming:        ['gaming', 'esports', 'game', 'streamer', 'twitch'],
  fitness:       ['fitness', 'gym', 'workout', 'health', 'sport', 'nutrition'],
  food:          ['food', 'cooking', 'recipe', 'culinary', 'restaurant', 'chef'],
  travel:        ['travel', 'adventure', 'tourism', 'photography', 'lifestyle'],
  education:     ['education', 'learning', 'teaching', 'training', 'coaching', 'business'],
  entertainment: ['entertainment', 'music', 'art', 'comedy', 'movies', 'celebrity'],
  sports:        ['sports', 'athletics', 'football', 'basketball', 'soccer', 'fitness'],
  finance:       ['finance', 'business', 'investing', 'crypto', 'money', 'economy'],
  health:        ['health', 'wellness', 'medical', 'mental health', 'yoga', 'nutrition'],
  lifestyle:     ['lifestyle', 'vlogs', 'daily', 'family', 'home', 'diy'],
  music:         ['music', 'artist', 'band', 'singer', 'producer', 'dj'],
  art:           ['art', 'design', 'illustration', 'photography', 'creative'],
}

const PLATFORM_INDUSTRY_AFFINITY: Record<string, string[]> = {
  instagram: ['fashion', 'beauty', 'food', 'travel', 'lifestyle', 'fitness', 'art', 'health'],
  youtube:   ['technology', 'gaming', 'education', 'entertainment', 'music', 'finance', 'fitness'],
  tiktok:    ['entertainment', 'food', 'fashion', 'beauty', 'lifestyle', 'music', 'sports'],
  twitter:   ['technology', 'finance', 'sports', 'gaming', 'education'],
  other:     [],
}

// ── Individual scorers ────────────────────────────────────────────────────────

function scoreNiche(input: PredictionInput): number {
  const MAX = 25
  const industry = (input.brand.industry ?? '').toLowerCase()
  const keywords = INDUSTRY_NICHE_MAP[industry] ?? [industry]
  const campaignText = input.campaign
    ? (input.campaign.title + ' ' + input.campaign.description).toLowerCase()
    : ''
  const allKeywords = [...new Set([...keywords, ...campaignText.split(/\W+/).filter(w => w.length > 3)])]

  const niche = (input.influencer.niche ?? '').toLowerCase()
  const bio   = (input.influencer.bio   ?? '').toLowerCase()
  const combined = niche + ' ' + bio

  const matched = allKeywords.filter(kw => combined.includes(kw))
  if (matched.length === 0) return 0
  return Math.round(MAX * Math.min(matched.length / Math.max(allKeywords.length, 1), 1))
}

function scoreEngagement(input: PredictionInput): number {
  const MAX = 25
  const r = input.influencer.engagement_rate ?? 0
  if (r >= 10) return MAX
  if (r >= 6)  return Math.round(MAX * 0.88)
  if (r >= 3)  return Math.round(MAX * 0.72)
  if (r >= 1)  return Math.round(MAX * 0.48)
  return Math.round(MAX * 0.2)
}

function scoreAudienceSize(input: PredictionInput): number {
  const MAX = 20
  const f = input.influencer.followers_count ?? 0
  const budget = input.campaign?.budget ?? 0

  // Budget-aware tiers
  const [mega, macro, mid, micro] = budget > 50_000
    ? [500_000, 200_000, 50_000, 10_000]
    : budget < 5_000
    ? [200_000, 100_000, 30_000, 5_000]
    : [1_000_000, 500_000, 100_000, 10_000]

  if (f >= mega)  return MAX
  if (f >= macro) return Math.round(MAX * 0.85)
  if (f >= mid)   return Math.round(MAX * 0.7)
  if (f >= micro) return Math.round(MAX * 0.55)
  return Math.round(MAX * 0.3)
}

function scorePlatformFit(input: PredictionInput): number {
  const MAX = 15
  const platform = input.influencer.platform ?? ''
  const industry = (input.brand.industry ?? '').toLowerCase()
  const affinity = PLATFORM_INDUSTRY_AFFINITY[platform] ?? []

  if (affinity.includes(industry)) return MAX
  if (affinity.some(p => industry.includes(p) || p.includes(industry))) return Math.round(MAX * 0.7)
  return Math.round(MAX * 0.3)
}

function scoreLocation(input: PredictionInput): number {
  const MAX = 15
  const loc = (input.influencer.location ?? '').toLowerCase()
  if (!loc) return Math.round(MAX * 0.2)

  const brandDesc = (input.brand.description ?? '').toLowerCase()
  if (brandDesc.includes(loc)) return MAX

  const highReach = ['usa', 'us', 'united states', 'uk', 'united kingdom', 'canada', 'australia',
    'germany', 'france', 'india', 'singapore', 'new york', 'london', 'mumbai', 'dubai']
  const isHighReach = highReach.some(m => loc.includes(m))
  return isHighReach ? Math.round(MAX * 0.6) : Math.round(MAX * 0.3)
}

// ── Confidence scorer ─────────────────────────────────────────────────────────

function calcConfidence(input: PredictionInput, successScore: number): number {
  let conf = 50
  // More data → higher confidence
  if (input.influencer.followers_count > 10_000) conf += 10
  if (input.influencer.engagement_rate > 1)       conf += 10
  if (input.influencer.location)                  conf += 5
  if (input.campaign?.budget)                     conf += 10
  if (input.campaign?.description)                conf += 5
  if (successScore > 70)                          conf += 10
  return Math.min(conf, 95) // never claim 100% confidence
}

// ── Reach / metric estimators ─────────────────────────────────────────────────

function estimateMetrics(input: PredictionInput, successScore: number) {
  const platform = (input.influencer.platform ?? 'other') as string
  const pp = PLATFORM_PROFILES[platform] ?? PLATFORM_PROFILES.other
  const followers = input.influencer.followers_count ?? 0
  const engRate   = (input.influencer.engagement_rate ?? 1) / 100
  const budget    = input.campaign?.budget ?? 1000

  // Scale multipliers by success score (50–100 → 0.5–1.2 modifier)
  const scoreMod = 0.4 + (successScore / 100) * 0.8

  const estimatedReach       = Math.round(followers * pp.reachMultiplier * scoreMod)
  const estimatedEngagement  = Math.round(estimatedReach * engRate * scoreMod)
  const expectedClicks       = Math.round(estimatedEngagement * pp.clickThroughRate)
  const expectedConversions  = Math.round(expectedClicks * pp.conversionRate)

  // ROI = (conversions * avg order value estimate) / budget
  // We estimate avg order value as $35 — conservative cross-industry default
  const AVG_ORDER_VALUE = 35
  const revenue = expectedConversions * AVG_ORDER_VALUE
  const predictedRoi = budget > 0 ? parseFloat((revenue / budget).toFixed(2)) : 0

  return { estimatedReach, estimatedEngagement, expectedClicks, expectedConversions, predictedRoi }
}

// ── Insight & risk generator ──────────────────────────────────────────────────

function generateInsights(input: PredictionInput, breakdown: PredictionScoreBreakdown, successScore: number): string[] {
  const insights: string[] = []
  const inf = input.influencer
  const platform = inf.platform ?? 'this platform'

  if (breakdown.nicheMatch >= 20) {
    insights.push(`Strong niche alignment — "${inf.niche}" resonates well with ${input.brand.industry} audiences.`)
  } else if (breakdown.nicheMatch >= 12) {
    insights.push(`Moderate niche overlap with your industry — expect mid-funnel engagement.`)
  }

  if (inf.engagement_rate >= 6) {
    insights.push(`Exceptional ${inf.engagement_rate}% engagement rate is well above the ${platform} average of ~2–3%.`)
  } else if (inf.engagement_rate >= 3) {
    insights.push(`Healthy ${inf.engagement_rate}% engagement rate signals an active, loyal audience.`)
  }

  if (breakdown.audienceSize >= 17) {
    insights.push(`Large follower base (${inf.followers_count.toLocaleString()}) delivers significant organic reach.`)
  } else if (breakdown.audienceSize >= 11) {
    insights.push(`Mid-tier reach — often yields better CPE than mega-influencers for niche products.`)
  }

  if (breakdown.platformFit >= 13) {
    insights.push(`${capitalize(platform)} is a top-performing channel for ${input.brand.industry} brand campaigns.`)
  }

  if (successScore >= 80) {
    insights.push(`Overall, this partnership has a high probability of exceeding campaign KPIs.`)
  } else if (successScore >= 60) {
    insights.push(`Solid potential — minor optimisation (creative brief, clear CTA) can push results higher.`)
  }

  return insights.slice(0, 4)
}

function generateRisks(input: PredictionInput, breakdown: PredictionScoreBreakdown, successScore: number): string[] {
  const risks: string[] = []
  const inf = input.influencer

  if (breakdown.nicheMatch < 10) {
    risks.push(`Low niche alignment may reduce audience resonance and conversion rates.`)
  }
  if (inf.engagement_rate < 1) {
    risks.push(`Engagement rate below 1% — audience may be inactive or inflated.`)
  }
  if (!inf.location) {
    risks.push(`No location data available — geo-targeting precision is limited.`)
  }
  if (!input.campaign?.budget || input.campaign.budget < 500) {
    risks.push(`Low or undefined budget may restrict content quality and boosting options.`)
  }
  if (breakdown.platformFit < 7) {
    risks.push(`${capitalize(inf.platform)} has lower historical performance for ${input.brand.industry} verticals.`)
  }
  if (successScore < 50) {
    risks.push(`Below-average success score — consider pairing with a higher-alignment influencer.`)
  }

  return risks.slice(0, 3)
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ── Public API ────────────────────────────────────────────────────────────────

export const campaignPredictorService = {
  predict(input: PredictionInput): CampaignPrediction {
    const breakdown: PredictionScoreBreakdown = {
      nicheMatch:          scoreNiche(input),
      engagementQuality:   scoreEngagement(input),
      audienceSize:        scoreAudienceSize(input),
      platformFit:         scorePlatformFit(input),
      locationRelevance:   scoreLocation(input),
    }

    const successScore = Math.min(
      breakdown.nicheMatch +
      breakdown.engagementQuality +
      breakdown.audienceSize +
      breakdown.platformFit +
      breakdown.locationRelevance,
      100,
    )

    const confidenceScore = calcConfidence(input, successScore)
    const metrics         = estimateMetrics(input, successScore)
    const insights        = generateInsights(input, breakdown, successScore)
    const riskFactors     = generateRisks(input, breakdown, successScore)

    const inf = input.influencer
    const cam = input.campaign

    return {
      // inputs snapshot
      influencer_name:              inf.profiles?.full_name ?? 'Influencer',
      influencer_platform:          inf.platform,
      influencer_niche:             inf.niche,
      influencer_followers:         inf.followers_count,
      influencer_engagement_rate:   inf.engagement_rate,
      influencer_location:          inf.location,
      campaign_title:               cam?.title ?? null,
      campaign_budget:              cam?.budget ?? null,
      // outputs
      success_score:       successScore,
      confidence_score:    confidenceScore,
      estimated_reach:      metrics.estimatedReach,
      estimated_engagement: metrics.estimatedEngagement,
      expected_clicks:      metrics.expectedClicks,
      expected_conversions: metrics.expectedConversions,
      predicted_roi:        metrics.predictedRoi,
      score_breakdown:     breakdown,
      insights,
      risk_factors:        riskFactors,
    }
  },
}
