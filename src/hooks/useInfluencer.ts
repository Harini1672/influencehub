import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { influencerService } from '@/services/influencer.service'
import { storageService } from '@/services/storage.service'
import { supabase } from '@/lib/supabase'
import type { Influencer, InfluencerFilters } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any
export function useInfluencer(userId?: string) {
  return useQuery({
    queryKey: ['influencer', userId],
    queryFn: () => influencerService.getByUserId(userId!),
    enabled: !!userId,
    select: (result) => result.data,
  })
}

export function useInfluencerById(id?: string) {
  return useQuery({
    queryKey: ['influencer-by-id', id],
    queryFn: () => influencerService.getById(id!),
    enabled: !!id,
    select: (result) => result.data,
  })
}

export function useBrowseInfluencers(filters: Partial<InfluencerFilters>, page = 0) {
  return useQuery({
    queryKey: ['influencers', filters, page],
    queryFn: () => influencerService.browse(filters, page),
    placeholderData: (prev) => prev,
  })
}

export function useUpsertInfluencer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
      avatarFile,
    }: {
      userId: string
      updates: Partial<Influencer>
      avatarFile?: File
    }) => {
      if (avatarFile) {
        const { url, error } = await storageService.uploadAvatar(userId, avatarFile)
        if (error) throw error
        if (url) {
          await db.from('profiles').update({ avatar_url: url }).eq('id', userId)
        }
      }
      const { data, error } = await influencerService.upsert(userId, updates)
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['influencer', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
    },
  })
}

// ── Instagram OAuth hooks ─────────────────────────────────────────────────────

/**
 * Calls the instagram-disconnect Edge Function which clears all OAuth fields
 * for the authenticated user using the service role key (bypasses RLS).
 */
export function useDisconnectInstagram() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const res = await fetch(`${supabaseUrl}/functions/v1/instagram-disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Failed to disconnect Instagram')
      }
      return userId
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['influencer', userId] })
      queryClient.invalidateQueries({ queryKey: ['influencers'] })
    },
  })
}
