import { supabase } from '@/lib/supabase'
import type { Brand } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const brandService = {
  async getByUserId(userId: string) {
    const { data, error } = await db
      .from('brands')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .single()
    return { data: data as Brand | null, error }
  },

  async getById(id: string) {
    const { data, error } = await db
      .from('brands')
      .select('*, profiles(*)')
      .eq('id', id)
      .single()
    return { data: data as Brand | null, error }
  },

  async upsert(userId: string, updates: Partial<Brand>) {
    const { data, error } = await db
      .from('brands')
      .upsert({ ...updates, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single()
    return { data, error }
  },

  async delete(userId: string) {
    const { error } = await db.from('brands').delete().eq('user_id', userId)
    return { error }
  },
}
