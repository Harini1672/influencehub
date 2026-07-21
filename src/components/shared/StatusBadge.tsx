import { Badge } from '@/components/ui/badge'
import type { CampaignStatus, RequestStatus } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' }> = {
  requested: { label: 'Requested', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
}

interface StatusBadgeProps {
  status: CampaignStatus | RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
