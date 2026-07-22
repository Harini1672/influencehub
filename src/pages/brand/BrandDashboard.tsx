import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase, Bell, CheckCircle, TrendingUp, ArrowRight, Plus,
  Sparkles, RefreshCw, ChevronRight, Send, Bot, BarChart3, History,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns, useBrandRequests, useBrandDashboardStats, useSendCampaignRequest } from '@/hooks/useCampaigns'
import { useRealtimeRequests } from '@/hooks/useRealtimeCampaign'
import { useAIRecommendations } from '@/hooks/useAIRecommendations'
import { usePredictionHistory } from '@/hooks/useCampaignPredictor'
import { useToast } from '@/hooks/useToast'
import { StatCard } from '@/components/shared/StatCard'
import { SkeletonStatCard, SkeletonCard } from '@/components/shared/SkeletonCard'
import { AIRecommendationCard } from '@/components/shared/AIRecommendationCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, getInitials } from '@/lib/utils'
import type { Influencer, Campaign } from '@/types'

// ── Request dialog form ───────────────────────────────────────────────────────

const requestSchema = z.object({
  campaign_id: z.string().min(1, 'Select a campaign'),
  message: z.string().optional(),
})
type RequestFormData = z.infer<typeof requestSchema>

// ── Component ─────────────────────────────────────────────────────────────────

export function BrandDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const { data: brand } = useBrand(user?.id)
  const { data: stats, isLoading: statsLoading } = useBrandDashboardStats(brand?.id)
  const { data: campaigns = [] } = useBrandCampaigns(brand?.id)
  const { data: requests = [] } = useBrandRequests(brand?.id)
  const sendRequest = useSendCampaignRequest()

  // Pick the most recent active/in-progress campaign to sharpen recommendations
  const activeCampaign: Campaign | undefined = campaigns.find(
    (c) => c.status === 'in_progress' || c.status === 'accepted',
  ) ?? campaigns[0]

  const {
    data: recommendations = [],
    isLoading: recsLoading,
    refetch: refetchRecs,
    isFetching: recsFetching,
  } = useAIRecommendations(brand ?? undefined, activeCampaign, 6)

  const { data: predictionHistory = [] } = usePredictionHistory(brand?.id)

  useRealtimeRequests(user?.id, 'brand')

  const recentCampaigns = campaigns.slice(0, 5)
  const recentRequests = requests.filter((r) => r.status === 'requested').slice(0, 5)

  // ── Collaboration request dialog ──────────────────────────────────────────
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  })

  const handleSendRequest = (influencer: Influencer) => {
    setSelectedInfluencer(influencer)
    setRequestDialogOpen(true)
    reset()
  }

  const onSubmitRequest = async (formData: RequestFormData) => {
    if (!brand || !selectedInfluencer) return
    const campaign = campaigns.find((c) => c.id === formData.campaign_id)
    if (!campaign) return

    try {
      await sendRequest.mutateAsync({
        campaign_id: formData.campaign_id,
        brand_id: brand.id,
        influencer_id: selectedInfluencer.id,
        message: formData.message,
        influencer_user_id: selectedInfluencer.user_id,
        campaign_title: campaign.title,
        brand_name: brand.company_name,
      })
      toast({
        title: 'Request sent!',
        description: `Collaboration request sent to ${selectedInfluencer.profiles?.full_name}.`,
        variant: 'success',
      })
      setRequestDialogOpen(false)
      setSelectedInfluencer(null)
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.includes('unique') || message.includes('duplicate')) {
        toast({ title: 'Already requested', description: 'You already sent a request for this campaign.', variant: 'destructive' })
      } else {
        toast({ title: 'Error', description: message, variant: 'destructive' })
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {brand?.company_name ?? profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your campaign overview</p>
        </div>
        <Button asChild variant="gradient">
          <Link to="/brand/campaigns">
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Link>
        </Button>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard title="Total Campaigns" value={stats?.total ?? 0} icon={Briefcase} color="violet" delay={0.1} />
            <StatCard title="Active" value={stats?.active ?? 0} icon={TrendingUp} color="blue" delay={0.15} description="In progress" />
            <StatCard title="Pending" value={stats?.pending ?? 0} icon={Bell} color="amber" delay={0.2} description="Awaiting response" />
            <StatCard title="Completed" value={stats?.completed ?? 0} icon={CheckCircle} color="emerald" delay={0.25} />
          </>
        )}
      </div>

      {/* ── AI Recommended Influencers ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Card className="border-violet-200 dark:border-violet-800/50 overflow-hidden">
          {/* Section header */}
          <CardHeader className="pb-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-b border-violet-100 dark:border-violet-800/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    AI Recommended Influencers
                    <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-[10px] px-1.5 py-0">
                      BETA
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activeCampaign
                      ? `Matched for "${activeCampaign.title}"`
                      : `Matched for ${brand?.industry ?? 'your industry'}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => refetchRecs()}
                  disabled={recsFetching}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${recsFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild variant="ghost" size="sm" className="text-xs h-8">
                  <Link to="/brand/browse">
                    Browse all <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Score legend */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-[11px] text-muted-foreground">
              <span className="font-medium">Match score:</span>
              {[
                { label: 'Excellent (80–100)', color: 'bg-emerald-500' },
                { label: 'Great (60–79)', color: 'bg-blue-500' },
                { label: 'Good (40–59)', color: 'bg-amber-500' },
                { label: 'Partial (<40)', color: 'bg-rose-500' },
              ].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                  {label}
                </span>
              ))}
            </div>

            {/* Cards grid */}
            {recsLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20 mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-violet-500" />
                </div>
                <p className="text-sm font-medium mb-1">No recommendations yet</p>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  Complete your brand profile and add a campaign so the AI can match you with the right influencers.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/brand/settings">Complete profile</Link>
                  </Button>
                  <Button asChild size="sm" variant="gradient">
                    <Link to="/brand/campaigns">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add campaign
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, i) => (
                  <AIRecommendationCard
                    key={rec.influencer.id}
                    recommendation={rec}
                    onSendRequest={campaigns.length > 0 ? handleSendRequest : undefined}
                    delay={i * 0.06}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Campaign Performance Predictor CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4 }}
      >
        <Card className="border-blue-200 dark:border-blue-800/40 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20">
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-md">
              <Bot className="h-7 w-7 text-white" />
            </div>

            {/* Copy */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold">Campaign Performance Predictor</h3>
                <Badge className="bg-gradient-to-r from-blue-500 to-violet-600 text-white border-0 text-[10px] px-1.5 py-0">AI</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Predict success score, reach, engagement, clicks, conversions, and ROI before committing your budget.
              </p>

              {/* Stats row */}
              {predictionHistory.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <History className="h-3 w-3" />
                    {predictionHistory.length} prediction{predictionHistory.length !== 1 ? 's' : ''} run
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BarChart3 className="h-3 w-3" />
                    Avg success score:{' '}
                    <span className="font-semibold text-foreground">
                      {Math.round(predictionHistory.reduce((s, p) => s + p.success_score, 0) / predictionHistory.length)}/100
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Avg ROI:{' '}
                    <span className="font-semibold text-foreground">
                      {(predictionHistory.reduce((s, p) => s + p.predicted_roi, 0) / predictionHistory.length).toFixed(1)}×
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
              <Button asChild variant="gradient" className="gap-1.5">
                <Link to="/brand/predictor">
                  <Sparkles className="h-3.5 w-3.5" /> Run Prediction
                </Link>
              </Button>
              {predictionHistory.length > 0 && (
                <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Link to="/brand/predictor#history">
                    <History className="h-3.5 w-3.5" /> View History
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Recent campaigns + Pending requests ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Recent campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Campaigns</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/brand/campaigns">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No campaigns yet</p>
                <Button asChild size="sm" variant="gradient">
                  <Link to="/brand/campaigns">Create your first campaign</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/brand/campaigns/${campaign.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20 shrink-0">
                      <Briefcase className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(campaign.deadline)}</p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Pending Requests</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/brand/browse">Browse influencers <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No pending requests</p>
                <Button asChild size="sm" variant="gradient">
                  <Link to="/brand/browse">Find influencers</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={(req as never as { influencers?: { profiles?: { avatar_url?: string } } }).influencers?.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials((req as never as { influencers?: { profiles?: { full_name?: string } } }).influencers?.profiles?.full_name ?? 'I')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {(req as never as { influencers?: { profiles?: { full_name?: string } } }).influencers?.profiles?.full_name}
                      </p>
                    </div>
                    <Badge variant="info" className="text-xs shrink-0">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Send collaboration request dialog ── */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-violet-500" />
              Send Collaboration Request
            </DialogTitle>
            <DialogDescription>
              Send a request to <span className="font-medium">{selectedInfluencer?.profiles?.full_name}</span> to collaborate on a campaign.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Campaign <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => setValue('campaign_id', v)}>
                <SelectTrigger className={errors.campaign_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No campaigns yet.{' '}
                      <Link to="/brand/campaigns" className="text-violet-600 underline" onClick={() => setRequestDialogOpen(false)}>
                        Create one
                      </Link>
                    </div>
                  ) : (
                    campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.campaign_id && (
                <p className="text-xs text-destructive">{errors.campaign_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Message <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                {...register('message')}
                placeholder="Introduce your brand and describe what you're looking for..."
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={sendRequest.isPending} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                {sendRequest.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
