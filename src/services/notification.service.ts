import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const notificationService = {
  async getForUser(userId: string) {
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return { data: (data ?? []) as Notification[], error }
  },

  async markRead(id: string) {
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    return { error }
  },

  async markAllRead(userId: string) {
    const { error } = await db
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
    return { error }
  },

  async create(notification: {
    user_id: string
    title: string
    message: string
    type: string
    link?: string
  }) {
    const { data, error } = await db
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    return { data, error }
  },

  async delete(id: string) {
    const { error } = await db.from('notifications').delete().eq('id', id)
    return { error }
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    return { count: count ?? 0, error }
  },
}
