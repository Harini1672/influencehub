import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignRequest, CampaignNote, CampaignStatus } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const campaignService = {
  // ── Campaigns ──────────────────────────────────────────
  async getByBrandId(brandId: string) {
    const { data, error } = await db
      .from('campaigns')
      .select('*, brands(*)')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
    return { data: (data ?? []) as Campaign[], error }
  },

  async getById(id: string) {
    const { data, error } = await db
      .from('campaigns')
      .select('*, brands(*, profiles(*))')
      .eq('id', id)
      .single()
    return { data: data as Campaign | null, error }
  },

  async create(campaign: Omit<Campaign, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await db
      .from('campaigns')
      .insert({ ...campaign, status: 'requested' })
      .select()
      .single()
    return { data, error }
  },

  async update(id: string, updates: Partial<Campaign>) {
    const { data, error } = await db
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async updateStatus(id: string, status: CampaignStatus) {
    const { data, error } = await db
      .from('campaigns')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await db.from('campaigns').delete().eq('id', id)
    return { error }
  },

  // ── Campaign Requests ──────────────────────────────────
  async getRequestsForInfluencer(influencerId: string) {
    const { data, error } = await db
      .from('campaign_requests')
      .select('*, campaigns(*, brands(*, profiles(*))), brands(*, profiles(*))')
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false })
    return { data: (data ?? []) as CampaignRequest[], error }
  },

  async getRequestsForBrand(brandId: string) {
    const { data, error } = await db
      .from('campaign_requests')
      .select('*, campaigns(*), influencers(*, profiles(*))')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
    return { data: (data ?? []) as CampaignRequest[], error }
  },

  async getRequestsByCampaign(campaignId: string) {
    const { data, error } = await db
      .from('campaign_requests')
      .select('*, influencers(*, profiles(*))')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
    return { data: (data ?? []) as CampaignRequest[], error }
  },

  async createRequest(request: {
    campaign_id: string
    brand_id: string
    influencer_id: string
    message?: string
  }) {
    const { data, error } = await db
      .from('campaign_requests')
      .insert({ ...request, status: 'requested' })
      .select()
      .single()
    return { data, error }
  },

  async updateRequestStatus(id: string, status: 'accepted' | 'rejected') {
    const { data, error } = await db
      .from('campaign_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async deleteRequest(id: string) {
    const { error } = await db.from('campaign_requests').delete().eq('id', id)
    return { error }
  },

  // ── Campaign Notes ─────────────────────────────────────
  async getNotes(campaignId: string) {
    const { data, error } = await db
      .from('campaign_notes')
      .select('*, profiles(*)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
    return { data: (data ?? []) as CampaignNote[], error }
  },

  async addNote(campaignId: string, senderId: string, message: string) {
    const { data, error } = await db
      .from('campaign_notes')
      .insert({ campaign_id: campaignId, sender_id: senderId, message })
      .select('*, profiles(*)')
      .single()
    return { data, error }
  },

  async updateNote(id: string, message: string) {
    const { data, error } = await db
      .from('campaign_notes')
      .update({ message })
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  async deleteNote(id: string) {
    const { error } = await db.from('campaign_notes').delete().eq('id', id)
    return { error }
  },

  // ── Dashboard stats ────────────────────────────────────
  async getBrandStats(brandId: string) {
    const { data: campaigns } = await db
      .from('campaigns')
      .select('status')
      .eq('brand_id', brandId)

    const { data: requests } = await db
      .from('campaign_requests')
      .select('status')
      .eq('brand_id', brandId)

    const active = (campaigns as { status: string }[])?.filter(c => c.status === 'in_progress').length ?? 0
    const completed = (campaigns as { status: string }[])?.filter(c => c.status === 'completed').length ?? 0
    const pending = (requests as { status: string }[])?.filter(r => r.status === 'requested').length ?? 0
    const total = campaigns?.length ?? 0

    return { active, completed, pending, total }
  },

  async getInfluencerStats(influencerId: string) {
    const { data: requests } = await db
      .from('campaign_requests')
      .select('status')
      .eq('influencer_id', influencerId)

    const pending = (requests as { status: string }[])?.filter(r => r.status === 'requested').length ?? 0
    const accepted = (requests as { status: string }[])?.filter(r => r.status === 'accepted').length ?? 0

    const { data: campaigns } = await db
      .from('campaign_requests')
      .select('campaigns(status)')
      .eq('influencer_id', influencerId)
      .eq('status', 'accepted')

    const completed =
      (campaigns as { campaigns: { status: string } | null }[])?.filter(
        r => r.campaigns?.status === 'completed'
      ).length ?? 0

    return { pending, accepted, completed }
  },
}
