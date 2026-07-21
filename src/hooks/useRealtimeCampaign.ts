import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeCampaign(campaignId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!campaignId) return

    const notesChannel = supabase
      .channel(`campaign-notes:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_notes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notes', campaignId] })
        }
      )
      .subscribe()

    const campaignChannel = supabase
      .channel(`campaign:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
        }
      )
      .subscribe()

    const requestsChannel = supabase
      .channel(`campaign-requests:${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_requests',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['requests', 'campaign', campaignId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notesChannel)
      supabase.removeChannel(campaignChannel)
      supabase.removeChannel(requestsChannel)
    }
  }, [campaignId, queryClient])
}

export function useRealtimeRequests(userId?: string, role?: 'influencer' | 'brand') {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId || !role) return

    const channel = supabase
      .channel(`requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['requests'] })
          queryClient.invalidateQueries({ queryKey: ['stats'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, role, queryClient])
}
