import { motion } from 'framer-motion'
import { Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useInfluencer } from '@/hooks/useInfluencer'
import { useInfluencerRequests } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/shared/CampaignCard'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Campaign } from '@/types'

export function InfluencerCampaigns() {
  const { user } = useAuth()
  const { data: influencer } = useInfluencer(user?.id)
  const { data: requests = [], isLoading } = useInfluencerRequests(influencer?.id)

  const accepted = requests.filter(r => r.status === 'accepted' && r.campaigns)
  const inProgress = accepted.filter(r => r.campaigns?.status === 'in_progress')
  const completed = accepted.filter(r => r.campaigns?.status === 'completed')
  const all = accepted

  const renderGrid = (items: typeof requests) => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((req, i) => req.campaigns && (
        <CampaignCard
          key={req.id}
          campaign={req.campaigns as Campaign}
          linkBase="/influencer"
          delay={i * 0.05}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        <p className="text-muted-foreground mt-1">Track all your collaboration campaigns</p>
      </motion.div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            <TabsTrigger value="active">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {all.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No campaigns yet"
                description="Accept collaboration requests to start your first campaign."
              />
            ) : renderGrid(all)}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {inProgress.length === 0 ? (
              <EmptyState icon={Briefcase} title="No active campaigns" description="Campaigns in progress will appear here." />
            ) : renderGrid(inProgress)}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              <EmptyState icon={Briefcase} title="No completed campaigns" description="Finished campaigns will appear here." />
            ) : renderGrid(completed)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
