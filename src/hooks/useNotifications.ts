import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notification.service'
import { supabase } from '@/lib/supabase'

export function useNotifications(userId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getForUser(userId!),
    enabled: !!userId,
    select: (result) => result.data ?? [],
  })

  const unreadCount = useQuery({
    queryKey: ['notifications-count', userId],
    queryFn: () => notificationService.getUnreadCount(userId!),
    enabled: !!userId,
    select: (result) => result.count,
  })

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
          queryClient.invalidateQueries({ queryKey: ['notifications-count', userId] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, queryClient])

  return { ...query, unreadCount: unreadCount.data ?? 0 }
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => notificationService.markAllRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })
}
