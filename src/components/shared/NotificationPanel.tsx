import { useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { notificationService } from '@/services/notification.service'
import { useQueryClient } from '@tanstack/react-query'

interface NotificationPanelProps {
  onClose: () => void
}

const typeColors: Record<string, string> = {
  request: 'bg-blue-500',
  accepted: 'bg-emerald-500',
  rejected: 'bg-red-500',
  completed: 'bg-violet-500',
  note: 'bg-amber-500',
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { user } = useAuth()
  const { data: notifications = [] } = useNotifications(user?.id)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const queryClient = useQueryClient()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleMarkRead = (id: string) => {
    markRead.mutate(id)
  }

  const handleMarkAllRead = () => {
    if (user) markAllRead.mutate(user.id)
  }

  const handleDelete = async (id: string) => {
    await notificationService.delete(id)
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
  }

  const unread = notifications.filter(n => !n.read)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute right-0 top-12 z-50 w-80 rounded-2xl border bg-popover shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="font-semibold">Notifications</span>
          {unread.length > 0 && (
            <Badge className="text-xs">{unread.length}</Badge>
          )}
        </div>
        {unread.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-7">
            <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'group flex gap-3 items-start rounded-xl p-3 transition-colors hover:bg-accent cursor-pointer',
                  !notif.read && 'bg-violet-50 dark:bg-violet-900/10'
                )}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
              >
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', typeColors[notif.type] ?? 'bg-gray-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notif.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id) }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:text-red-600"
                    onClick={(e) => { e.stopPropagation(); handleDelete(notif.id) }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  )
}
