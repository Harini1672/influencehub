import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, IndianRupee, Users, Briefcase, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns, useBrandRequests, useBrandDashboardStats } from '@/hooks/useCampaigns'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'

export function BrandAnalytics() {
  const { user } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: stats } = useBrandDashboardStats(brand?.id)
  const { data: campaigns = [] } = useBrandCampaigns(brand?.id)
  const { data: requests = [] } = useBrandRequests(brand?.id)

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const activeBudget = campaigns.filter(c => c.status === 'in_progress').reduce((sum, c) => sum + c.budget, 0)
  const acceptanceRate = requests.length > 0
    ? Math.round((requests.filter(r => r.status === 'accepted').length / requests.length) * 100)
    : 0

  const byStatus = {
    requested: campaigns.filter(c => c.status === 'requested').length,
    accepted: campaigns.filter(c => c.status === 'accepted').length,
    in_progress: campaigns.filter(c => c.status === 'in_progress').length,
    completed: campaigns.filter(c => c.status === 'completed').length,
    rejected: campaigns.filter(c => c.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Overview of your campaign performance</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Campaigns" value={campaigns.length} icon={Briefcase} color="violet" delay={0.05} />
        <StatCard title="Active Budget" value={formatCurrency(activeBudget)} icon={IndianRupee} color="emerald" delay={0.1} />
        <StatCard title="Acceptance Rate" value={`${acceptanceRate}%`} icon={TrendingUp} color="blue" delay={0.15} />
        <StatCard title="Completed" value={stats?.completed ?? 0} icon={CheckCircle} color="amber" delay={0.2} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Campaign breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-600" /> Campaign Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status as never} />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all"
                      style={{ width: campaigns.length > 0 ? `${(count / campaigns.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-medium w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600" /> Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted">
              <span className="text-sm text-muted-foreground">Total Committed</span>
              <span className="font-bold text-lg">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-sm text-muted-foreground">Currently Active</span>
              <span className="font-bold text-lg text-emerald-600">{formatCurrency(activeBudget)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <span className="text-sm text-muted-foreground">Avg per Campaign</span>
              <span className="font-bold text-lg text-blue-600">
                {campaigns.length > 0 ? formatCurrency(totalBudget / campaigns.length) : formatCurrency(0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Campaign Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No campaign activity yet.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 10).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-emerald-600">{formatCurrency(c.budget)}</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
