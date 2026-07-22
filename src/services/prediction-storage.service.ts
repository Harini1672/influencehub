import { supabase } from '@/lib/supabase'
import type { CampaignPrediction } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

/** Shape stored in / returned from Supabase (snake_case, no score_breakdown). */
interface DbPrediction {
  id: string
  brand_id: string
  campaign_id: string | null
  influencer_id: string
  influencer_name: string
  influencer_platform: string
  influencer_niche: string
  influencer_followers: number
  influencer_engagement_rate: number
  influencer_location: string | null
  campaign_title: string | null
  campaign_budget: number | null
  success_score: number
  confidence_score: number
  estimated_reach: number
  estimated_engagement: number
  expected_clicks: number
  expected_conversions: number
  predicted_roi: number
  insights: string[]
  risk_factors: string[]
  created_at: string
}

function toAppModel(row: DbPrediction): CampaignPrediction {
  return {
    ...row,
    // score_breakdown isn't persisted — re-materialise as zeros for history rows
    score_breakdown: {
      nicheMatch: 0,
      engagementQuality: 0,
      audienceSize: 0,
      platformFit: 0,
      locationRelevance: 0,
    },
  }
}

export const predictionStorageService = {
  /** Persist a new prediction row and return the saved record with its id. */
  async save(payload: {
    brand_id: string
    campaign_id?: string | null
    influencer_id: string
    prediction: CampaignPrediction
  }): Promise<{ data: CampaignPrediction | null; error: unknown }> {
    const { brand_id, campaign_id, influencer_id, prediction } = payload

    const row = {
      brand_id,
      campaign_id:                   campaign_id ?? null,
      influencer_id,
      influencer_name:               prediction.influencer_name,
      influencer_platform:           prediction.influencer_platform,
      influencer_niche:              prediction.influencer_niche,
      influencer_followers:          prediction.influencer_followers,
      influencer_engagement_rate:    prediction.influencer_engagement_rate,
      influencer_location:           prediction.influencer_location,
      campaign_title:                prediction.campaign_title,
      campaign_budget:               prediction.campaign_budget,
      success_score:                 prediction.success_score,
      confidence_score:              prediction.confidence_score,
      estimated_reach:               prediction.estimated_reach,
      estimated_engagement:          prediction.estimated_engagement,
      expected_clicks:               prediction.expected_clicks,
      expected_conversions:          prediction.expected_conversions,
      predicted_roi:                 prediction.predicted_roi,
      insights:                      prediction.insights,
      risk_factors:                  prediction.risk_factors,
    }

    const { data, error } = await db
      .from('campaign_predictions')
      .insert(row)
      .select()
      .single()

    if (error) return { data: null, error }
    return { data: toAppModel(data as DbPrediction), error: null }
  },

  /** Fetch all predictions for a brand, newest first. */
  async getByBrand(brandId: string): Promise<{ data: CampaignPrediction[]; error: unknown }> {
    const { data, error } = await db
      .from('campaign_predictions')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })

    if (error) return { data: [], error }
    return { data: ((data ?? []) as DbPrediction[]).map(toAppModel), error: null }
  },

  /** Delete a single prediction by id. */
  async delete(id: string): Promise<{ error: unknown }> {
    const { error } = await db
      .from('campaign_predictions')
      .delete()
      .eq('id', id)
    return { error }
  },
}
