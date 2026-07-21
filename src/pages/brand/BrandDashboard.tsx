import { motion } from 'framer-motion'
import { Briefcase, Bell, CheckCircle, TrendingUp, ArrowRight, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns, useBrandRequests, useBrandDashboardStats } from '@/hooks/useCampaigns'
import { useRealtimeRequests } from '@/hooks/useRealtimeCampaign'
import { StatCard } from '@/components/shared/StatCard'
import { SkeletonStatCard } from '@/components/shared/SkeletonCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'

export function BrandDashboard() {
  const { user, profile } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: stats, isLoading: statsLoading } = useBrandDashboardStats(brand?.id)
  const { data: campaigns = [] } = useBrandCampaigns(brand?.id)
  const { data: requests = [] } = useBrandRequests(brand?.id)
  const navigate = useNavigate()

  useRealtimeRequests(user?.id, 'brand')

  const recentCampaigns = campaigns.slice(0, 5)
  const recentRequests = requests.filter(r => r.status === 'requested').slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stats */}
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
    </div>
  )
}
