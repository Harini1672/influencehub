import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Users, TrendingUp, Instagram, Youtube, Video } from 'lucide-react'
import type { Influencer } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber, getInitials } from '@/lib/utils'

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Video,
}

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-600',
  youtube: 'from-red-500 to-red-600',
  tiktok: 'from-cyan-400 to-blue-600',
  twitter: 'from-blue-400 to-blue-600',
  other: 'from-gray-400 to-gray-600',
}

interface InfluencerCardProps {
  influencer: Influencer
  onSendRequest?: (influencer: Influencer) => void
  delay?: number
}

export function InfluencerCard({ influencer, onSendRequest, delay = 0 }: InfluencerCardProps) {
  const PlatformIcon = platformIcons[influencer.platform] ?? TrendingUp
  const gradientClass = platformColors[influencer.platform] ?? platformColors.other
  const profile = influencer.profiles

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="card-hover overflow-hidden group">
        {/* Header banner */}
        <div className={`h-20 bg-gradient-to-r ${gradientClass} relative`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3),transparent)]" />
        </div>

        <CardContent className="pt-0 p-5">
          {/* Avatar */}
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <Avatar className="h-16 w-16 border-4 border-background shadow-md">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(profile?.full_name ?? 'U')}
              </AvatarFallback>
            </Avatar>
            <Badge variant="secondary" className="capitalize flex items-center gap-1">
              <PlatformIcon className="h-3 w-3" />
              {influencer.platform}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-base truncate">
                {profile?.full_name ?? 'Influencer'}
              </h3>
              {influencer.niche && (
                <Badge variant="outline" className="text-xs mt-1">{influencer.niche}</Badge>
              )}
            </div>

            {influencer.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {influencer.location}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5 text-violet-600" />
                <span className="font-semibold">{formatNumber(influencer.followers_count)}</span>
                <span className="text-muted-foreground">followers</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-semibold">{influencer.engagement_rate}%</span>
                <span className="text-muted-foreground">engagement</span>
              </div>
            </div>

            {influencer.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{influencer.bio}</p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
              <Link to={`/influencer/${influencer.id}`}>View Profile</Link>
            </Button>
            {onSendRequest && (
              <Button
                size="sm"
                variant="gradient"
                className="flex-1 text-xs"
                onClick={() => onSendRequest(influencer)}
              >
                Collaborate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
