export type UserRole = 'influencer' | 'brand'

export type CampaignStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'completed'

export type RequestStatus = 'requested' | 'accepted' | 'rejected'

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'other'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface Influencer {
  id: string
  user_id: string
  platform: Platform
  niche: string
  followers_count: number
  engagement_rate: number
  bio: string | null
  location: string | null
  instagram_url: string | null
  youtube_url: string | null
  tiktok_url: string | null
  is_public: boolean
  // Instagram Business OAuth — access_token is never sent to the client
  instagram_connected: boolean
  instagram_business_id: string | null
  instagram_username: string | null
  instagram_token_expires_at: string | null
  created_at: string
  profiles?: Profile
}

export interface Brand {
  id: string
  user_id: string
  company_name: string
  industry: string
  website: string | null
  logo: string | null
  description: string | null
  created_at: string
  profiles?: Profile
}

export interface Campaign {
  id: string
  brand_id: string
  title: string
  description: string
  budget: number
  deadline: string
  status: CampaignStatus
  created_at: string
  brands?: Brand
}

export interface CampaignRequest {
  id: string
  campaign_id: string
  brand_id: string
  influencer_id: string
  status: RequestStatus
  message: string | null
  created_at: string
  campaigns?: Campaign
  brands?: Brand
  influencers?: Influencer
}

export interface CampaignNote {
  id: string
  campaign_id: string
  sender_id: string
  message: string
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  read: boolean
  type: 'request' | 'accepted' | 'rejected' | 'completed' | 'note'
  link: string | null
  created_at: string
}

export interface DashboardStats {
  pendingRequests: number
  acceptedCampaigns: number
  completedCampaigns: number
  activeCampaigns?: number
  totalBudget?: number
}

// ── Campaign Performance Predictor ───────────────────────────────────────────

export interface PredictionInput {
  influencer: Influencer
  campaign?: Campaign
  brand: Brand
}

export interface PredictionScoreBreakdown {
  nicheMatch: number       // 0–25
  engagementQuality: number // 0–25
  audienceSize: number     // 0–20
  platformFit: number      // 0–15
  locationRelevance: number // 0–15
}

export interface CampaignPrediction {
  // Meta
  id?: string
  brand_id?: string
  campaign_id?: string | null
  influencer_id?: string
  created_at?: string

  // Inputs snapshot
  influencer_name: string
  influencer_platform: string
  influencer_niche: string
  influencer_followers: number
  influencer_engagement_rate: number
  influencer_location: string | null
  campaign_title: string | null
  campaign_budget: number | null

  // Outputs
  success_score: number        // 0–100
  confidence_score: number     // 0–100
  estimated_reach: number
  estimated_engagement: number
  expected_clicks: number
  expected_conversions: number
  predicted_roi: number        // e.g. 3.2 = 320% ROI

  // Breakdown + narrative
  score_breakdown: PredictionScoreBreakdown
  insights: string[]
  risk_factors: string[]
}

export interface AIRecommendedInfluencer {
  influencer: Influencer
  matchScore: number
  reasons: string[]
  scoreBreakdown: {
    nicheScore: number
    engagementScore: number
    followersScore: number
    platformScore: number
    locationScore: number
  }
}

export interface InfluencerFilters {
  search: string
  platform: string
  niche: string
  location: string
  minFollowers: number
  maxFollowers: number
  sortBy: 'followers_count' | 'engagement_rate' | 'created_at'
  sortOrder: 'asc' | 'desc'
}
