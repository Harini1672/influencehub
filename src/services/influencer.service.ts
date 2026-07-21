import { supabase } from '@/lib/supabase'
import type { Influencer, InfluencerFilters } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const influencerService = {
  async getByUserId(userId: string) {
    const { data, error } = await db
      .from('influencers')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .single()
    return { data: data as Influencer | null, error }
  },

  async getById(id: string) {
    const { data, error } = await db
      .from('influencers')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
    return { data: data as Influencer | null, error }
  },

  async upsert(userId: string, updates: Partial<Influencer>) {
    const { data, error } = await db
      .from('influencers')
      .upsert({ ...updates, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single()
    return { data, error }
  },

  async browse(filters: Partial<InfluencerFilters>, page = 0, pageSize = 12) {
    let query = db
      .from('influencers')
      .select('*, profiles(*)', { count: 'exact' })
      .eq('is_public', true)

    if (filters.search) {
      query = query.or(
        `niche.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      )
    }
    if (filters.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform)
    }
    if (filters.niche && filters.niche !== 'all') {
      query = query.ilike('niche', `%${filters.niche}%`)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters.minFollowers) {
      query = query.gte('followers_count', filters.minFollowers)
    }
    if (filters.maxFollowers) {
      query = query.lte('followers_count', filters.maxFollowers)
    }

    const sortCol = filters.sortBy ?? 'followers_count'
    const sortAsc = filters.sortOrder === 'asc'
    query = query.order(sortCol, { ascending: sortAsc })
    query = query.range(page * pageSize, (page + 1) * pageSize - 1)

    const { data, error, count } = await query
    return { data: (data ?? []) as Influencer[], error, count: count ?? 0 }
  },

  async delete(userId: string) {
    const { error } = await db.from('influencers').delete().eq('user_id', userId)
    return { error }
  },
}
