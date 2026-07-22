import { supabase } from '@/lib/supabase'
import type { Influencer, Brand, Campaign } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface AIRecommendedInfluencer {
  influencer: Influencer
  matchScore: number          // 0–100
  reasons: string[]           // human-readable recommendation reasons
  scoreBreakdown: {
    nicheScore: number        // 0–30
    engagementScore: number   // 0–25
    followersScore: number    // 0–20
    platformScore: number     // 0–15
    locationScore: number     // 0–10
  }
}

// ── Scoring weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  niche: 30,
  engagement: 25,
  followers: 20,
  platform: 15,
  location: 10,
}

// Industry → niche keyword map for semantic matching
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

// Derive niche keywords from brand industry + campaign description
function extractKeywords(brand: Brand, campaign?: Campaign): string[] {
  const industryKey = (brand.industry ?? '').toLowerCase()
  const baseKeywords = INDUSTRY_NICHE_MAP[industryKey] ?? [industryKey]

  const campaignWords = campaign
    ? (campaign.description + ' ' + campaign.title)
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
    : []

  return [...new Set([...baseKeywords, ...campaignWords])]
}

// ── Individual scoring functions ─────────────────────────────────────────────

function scoreNiche(influencer: Influencer, keywords: string[]): number {
  const niche = (influencer.niche ?? '').toLowerCase()
  const bio = (influencer.bio ?? '').toLowerCase()
  const combined = niche + ' ' + bio

  const matched = keywords.filter((kw) => combined.includes(kw))
  if (matched.length === 0) return 0

  const ratio = Math.min(matched.length / Math.max(keywords.length, 1), 1)
  return Math.round(WEIGHTS.niche * ratio)
}

function scoreEngagement(influencer: Influencer): number {
  const rate = influencer.engagement_rate ?? 0
  // Tiers: <1% poor, 1-3% average, 3-6% good, 6-10% great, >10% excellent
  if (rate >= 10) return WEIGHTS.engagement
  if (rate >= 6) return Math.round(WEIGHTS.engagement * 0.88)
  if (rate >= 3) return Math.round(WEIGHTS.engagement * 0.72)
  if (rate >= 1) return Math.round(WEIGHTS.engagement * 0.48)
  return Math.round(WEIGHTS.engagement * 0.2)
}

function scoreFollowers(influencer: Influencer, campaign?: Campaign): number {
  const followers = influencer.followers_count ?? 0
  const budget = campaign?.budget ?? 0

  // Tier thresholds adjusted by campaign budget
  let megaThreshold = 1_000_000
  let macroThreshold = 500_000
  let midThreshold = 100_000
  let microThreshold = 10_000

  if (budget > 50_000) {
    // High-budget campaign → prefer mega/macro
    megaThreshold = 500_000
    macroThreshold = 200_000
    midThreshold = 50_000
    microThreshold = 10_000
  } else if (budget < 5_000) {
    // Low-budget campaign → micro/nano more affordable
    megaThreshold = 200_000
    macroThreshold = 100_000
    midThreshold = 30_000
    microThreshold = 5_000
  }

  if (followers >= megaThreshold) return WEIGHTS.followers
  if (followers >= macroThreshold) return Math.round(WEIGHTS.followers * 0.85)
  if (followers >= midThreshold) return Math.round(WEIGHTS.followers * 0.7)
  if (followers >= microThreshold) return Math.round(WEIGHTS.followers * 0.55)
  return Math.round(WEIGHTS.followers * 0.3)
}

function scorePlatform(influencer: Influencer, brand: Brand, campaign?: Campaign): number {
  const industry = (brand.industry ?? '').toLowerCase()
  const platform = influencer.platform ?? ''

  // Platform–industry affinity map
  const affinities: Record<string, string[]> = {
    instagram: ['fashion', 'beauty', 'food', 'travel', 'lifestyle', 'fitness', 'art', 'health'],
    youtube:   ['technology', 'gaming', 'education', 'entertainment', 'music', 'finance', 'fitness'],
    tiktok:    ['entertainment', 'food', 'fashion', 'beauty', 'lifestyle', 'music', 'sports'],
    twitter:   ['technology', 'finance', 'sports', 'gaming', 'education', 'news'],
    other:     [],
  }

  // Also check if campaign description mentions a platform
  const campaignText = ((campaign?.description ?? '') + ' ' + (campaign?.title ?? '')).toLowerCase()
  if (campaignText.includes(platform)) return WEIGHTS.platform

  const preferred = affinities[platform] ?? []
  if (preferred.includes(industry)) return WEIGHTS.platform
  if (preferred.some((p) => industry.includes(p) || p.includes(industry))) {
    return Math.round(WEIGHTS.platform * 0.7)
  }
  return Math.round(WEIGHTS.platform * 0.3)
}

function scoreLocation(influencer: Influencer, brand: Brand): number {
  if (!influencer.location) return 0

  const influencerLoc = influencer.location.toLowerCase()
  const brandDesc = (brand.description ?? '').toLowerCase()

  // Check if brand description mentions the influencer's region
  if (brandDesc.includes(influencerLoc)) return WEIGHTS.location

  // Common market regions — give partial credit for same broad market
  const regions: Record<string, string[]> = {
    northamerica: ['usa', 'us', 'united states', 'canada', 'mexico', 'new york', 'los angeles', 'chicago'],
    europe:       ['uk', 'united kingdom', 'germany', 'france', 'spain', 'italy', 'netherlands', 'london', 'paris'],
    asia:         ['india', 'china', 'japan', 'korea', 'singapore', 'dubai', 'mumbai', 'bangalore', 'delhi'],
    latam:        ['brazil', 'argentina', 'colombia', 'chile', 'mexico'],
    oceania:      ['australia', 'new zealand', 'sydney', 'melbourne'],
  }

  // Give partial score for influencers from high-reach markets
  const highReachMarkets = regions.northamerica.concat(regions.europe)
  const isHighReach = highReachMarkets.some((m) => influencerLoc.includes(m))
  return isHighReach ? Math.round(WEIGHTS.location * 0.5) : Math.round(WEIGHTS.location * 0.2)
}

// ── Reason generator ─────────────────────────────────────────────────────────

function generateReasons(
  influencer: Influencer,
  breakdown: AIRecommendedInfluencer['scoreBreakdown'],
  brand: Brand,
): string[] {
  const reasons: string[] = []

  if (breakdown.nicheScore >= WEIGHTS.niche * 0.7) {
    reasons.push(`Niche "${influencer.niche}" aligns closely with ${brand.industry} industry`)
  } else if (breakdown.nicheScore >= WEIGHTS.niche * 0.4) {
    reasons.push(`Content niche has partial relevance to your industry`)
  }

  if (breakdown.engagementScore >= WEIGHTS.engagement * 0.85) {
    reasons.push(`Exceptional engagement rate of ${influencer.engagement_rate}% (well above average)`)
  } else if (breakdown.engagementScore >= WEIGHTS.engagement * 0.65) {
    reasons.push(`Strong engagement rate of ${influencer.engagement_rate}%`)
  } else if (breakdown.engagementScore >= WEIGHTS.engagement * 0.4) {
    reasons.push(`Solid engagement rate of ${influencer.engagement_rate}%`)
  }

  if (breakdown.followersScore >= WEIGHTS.followers * 0.85) {
    const formatted = influencer.followers_count >= 1_000_000
      ? `${(influencer.followers_count / 1_000_000).toFixed(1)}M`
      : `${(influencer.followers_count / 1_000).toFixed(0)}K`
    reasons.push(`Large reach with ${formatted} followers`)
  }

  if (breakdown.platformScore >= WEIGHTS.platform * 0.85) {
    reasons.push(`${capitalize(influencer.platform)} is a top-performing channel for ${brand.industry}`)
  }

  if (breakdown.locationScore >= WEIGHTS.location * 0.85) {
    reasons.push(`Based in ${influencer.location} — matches your target market`)
  } else if (breakdown.locationScore >= WEIGHTS.location * 0.4) {
    reasons.push(`${influencer.location} is a high-reach market for brand campaigns`)
  }

  // Fallback reason
  if (reasons.length === 0) {
    reasons.push(`Active creator with ${influencer.followers_count.toLocaleString()} followers`)
  }

  return reasons.slice(0, 3)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ── Main recommendation engine ────────────────────────────────────────────────

export function scoreInfluencer(
  influencer: Influencer,
  brand: Brand,
  campaign?: Campaign,
  keywords?: string[],
): AIRecommendedInfluencer {
  const kw = keywords ?? extractKeywords(brand, campaign)

  const nicheScore = scoreNiche(influencer, kw)
  const engagementScore = scoreEngagement(influencer)
  const followersScore = scoreFollowers(influencer, campaign)
  const platformScore = scorePlatform(influencer, brand, campaign)
  const locationScore = scoreLocation(influencer, brand)

  const scoreBreakdown = { nicheScore, engagementScore, followersScore, platformScore, locationScore }
  const matchScore = Math.min(
    nicheScore + engagementScore + followersScore + platformScore + locationScore,
    100,
  )

  const reasons = generateReasons(influencer, scoreBreakdown, brand)

  return { influencer, matchScore, reasons, scoreBreakdown }
}

// ── Service layer ─────────────────────────────────────────────────────────────

export const aiRecommendationService = {
  /**
   * Fetches public influencers and ranks them by AI match score for the given brand
   * and optionally a specific campaign. Returns top N results.
   */
  async getRecommendations(
    brand: Brand,
    campaign?: Campaign,
    topN = 6,
  ): Promise<{ data: AIRecommendedInfluencer[]; error: unknown }> {
    try {
      // Pull a broad set of public influencers to score against
      const { data: influencers, error } = await db
        .from('influencers')
        .select('*, profiles(*)')
        .eq('is_public', true)
        .limit(100)

      if (error) return { data: [], error }

      const keywords = extractKeywords(brand, campaign)

      const scored: AIRecommendedInfluencer[] = (influencers as Influencer[]).map((inf) =>
        scoreInfluencer(inf, brand, campaign, keywords),
      )

      // Sort by match score desc, take top N with score > 10
      const recommendations = scored
        .filter((r) => r.matchScore > 10)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, topN)

      return { data: recommendations, error: null }
    } catch (err) {
      return { data: [], error: err }
    }
  },
}
