import { motion } from 'framer-motion'
import { Bell, Briefcase, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useInfluencer } from '@/hooks/useInfluencer'
import { useInfluencerDashboardStats, useInfluencerRequests, useBrandCampaigns } from '@/hooks/useCampaigns'
import { useRealtimeRequests } from '@/hooks/useRealtimeCampaign'
import { StatCard } from '@/components/shared/StatCard'
import { SkeletonStatCard } from '@/components/shared/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export function InfluencerDashboard() {
  const { user, profile } = useAuth()
  const { data: influencer } = useInfluencer(user?.id)
  const { data: stats, isLoading: statsLoading } = useInfluencerDashboardStats(influencer?.id)
  const { data: requests = [] } = useInfluencerRequests(influencer?.id)

  useRealtimeRequests(user?.id, 'influencer')

  const pendingRequests = requests.filter(r => r.status === 'requested').slice(0, 5)
  const recentCampaigns = requests.filter(r => r.status === 'accepted').slice(0, 3)

  const completionPercent = influencer ? (() => {
    let score = 0
    if (influencer.bio) score += 20
    if (influencer.niche) score += 20
    if (influencer.location) score += 15
    if (influencer.followers_count > 0) score += 20
    if (influencer.engagement_rate > 0) score += 15
    if (influencer.instagram_url || influencer.youtube_url || influencer.tiktok_url) score += 10
    return score
  })() : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your campaigns</p>
      </motion.div>

      {/* Profile completion */}
      {completionPercent < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-900/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Complete your profile</p>
                <span className="text-sm font-semibold text-violet-600">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2" />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">A complete profile gets 5x more requests</p>
                <Button asChild variant="link" size="sm" className="text-xs h-auto p-0">
                  <Link to="/influencer/profile">Complete profile <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              title="Pending Requests"
              value={stats?.pending ?? 0}
              icon={Bell}
              color="blue"
              delay={0.1}
              description="Awaiting your response"
            />
            <StatCard
              title="Active Campaigns"
              value={stats?.accepted ?? 0}
              icon={Briefcase}
              color="violet"
              delay={0.2}
              description="Currently in progress"
            />
            <StatCard
              title="Completed"
              value={stats?.completed ?? 0}
              icon={CheckCircle}
              color="emerald"
              delay={0.3}
              description="Campaigns finished"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Pending Requests</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/influencer/requests">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition-colors">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={req.brands?.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(req.brands?.company_name ?? 'B')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">{req.brands?.company_name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-emerald-600">
                        {formatCurrency(req.campaigns?.budget ?? 0)}
                      </p>
                      <Badge variant="info" className="text-xs mt-0.5">New</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Active Campaigns</CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link to="/influencer/campaigns">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-6">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active campaigns yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20">
                      <TrendingUp className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.campaigns?.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(req.campaigns?.deadline ?? '')}</p>
                    </div>
                    <StatusBadge status={req.campaigns?.status ?? 'in_progress'} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
