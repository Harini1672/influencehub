import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, X, ChevronDown, Calendar, DollarSign, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useInfluencer } from '@/hooks/useInfluencer'
import { useInfluencerRequests, useRespondToRequest } from '@/hooks/useCampaigns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { SkeletonTable } from '@/components/shared/SkeletonCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import type { CampaignRequest } from '@/types'

export function InfluencerRequests() {
  const { user } = useAuth()
  const { data: influencer } = useInfluencer(user?.id)
  const { data: requests = [], isLoading } = useInfluencerRequests(influencer?.id)
  const respondMutation = useRespondToRequest()
  const { toast } = useToast()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const pending = requests.filter(r => r.status === 'requested')
  const accepted = requests.filter(r => r.status === 'accepted')
  const rejected = requests.filter(r => r.status === 'rejected')

  const handleRespond = async (req: CampaignRequest, status: 'accepted' | 'rejected') => {
    try {
      await respondMutation.mutateAsync({
        requestId: req.id,
        status,
        brandUserId: req.brands?.user_id ?? '',
        influencerName: influencer?.profiles?.full_name ?? 'The influencer',
        campaignTitle: req.campaigns?.title ?? '',
        campaignId: req.campaign_id,
      })
      toast({
        title: status === 'accepted' ? 'Request accepted!' : 'Request declined',
        description: status === 'accepted'
          ? 'The brand has been notified. Campaign is now in progress.'
          : 'You have declined this collaboration.',
        variant: status === 'accepted' ? 'success' : 'default',
      })
    } catch {
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' })
    }
  }

  const RequestCard = ({ req }: { req: CampaignRequest }) => {
    const isExpanded = expandedId === req.id
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={req.brands?.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(req.brands?.company_name ?? 'B')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{req.campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">{req.brands?.company_name}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="flex flex-wrap gap-4 mt-3 text-xs">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(req.campaigns?.budget ?? 0)}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Due {formatDate(req.campaigns?.deadline ?? '')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-3 border-t pt-4"
                >
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Campaign Description</p>
                    <p className="text-sm">{req.campaigns?.description}</p>
                  </div>
                  {req.message && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Message from brand
                      </p>
                      <p className="text-sm bg-muted rounded-xl p-3">{req.message}</p>
                    </div>
                  )}
                  {req.brands?.description && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">About the brand</p>
                      <p className="text-sm text-muted-foreground">{req.brands.description}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              {req.status === 'requested' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="gradient"
                    className="flex-1"
                    onClick={() => handleRespond(req, 'accepted')}
                    disabled={respondMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleRespond(req, 'rejected')}
                    disabled={respondMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Collaboration Requests</h1>
        <p className="text-muted-foreground mt-1">Review and respond to brand collaboration requests</p>
      </motion.div>

      {isLoading ? (
        <SkeletonTable />
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-xs">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted ({accepted.length})</TabsTrigger>
            <TabsTrigger value="declined">Declined ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pending.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No pending requests"
                description="When brands send you collaboration requests, they'll appear here."
              />
            ) : (
              pending.map(req => <RequestCard key={req.id} req={req} />)
            )}
          </TabsContent>

          <TabsContent value="accepted" className="mt-4 space-y-3">
            {accepted.length === 0 ? (
              <EmptyState
                icon={Check}
                title="No accepted requests"
                description="Requests you've accepted will appear here."
              />
            ) : (
              accepted.map(req => <RequestCard key={req.id} req={req} />)
            )}
          </TabsContent>

          <TabsContent value="declined" className="mt-4 space-y-3">
            {rejected.length === 0 ? (
              <EmptyState
                icon={X}
                title="No declined requests"
                description="Requests you've declined will appear here."
              />
            ) : (
              rejected.map(req => <RequestCard key={req.id} req={req} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
