import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Instagram, Youtube, Video, MapPin, Users, TrendingUp, ArrowLeft, ExternalLink } from 'lucide-react'
import { useInfluencerById } from '@/hooks/useInfluencer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/shared/SkeletonCard'
import { formatNumber, getInitials } from '@/lib/utils'

export function PublicInfluencerProfile() {
  const { id } = useParams<{ id: string }>()
  const { data: influencer, isLoading } = useInfluencerById(id)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Influencer not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Go Home</Link>
        </Button>
      </div>
    )
  }

  const profile = influencer.profiles

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 to-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/brand/browse"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile header */}
          <Card className="overflow-hidden mb-6">
            <div className="h-32 bg-gradient-to-r from-violet-600 to-purple-600" />
            <CardContent className="pt-0 p-6">
              <div className="-mt-12 flex items-end justify-between mb-4">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile?.full_name ?? 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2 pb-2">
                  {influencer.instagram_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={influencer.instagram_url} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4 text-pink-600" />
                      </a>
                    </Button>
                  )}
                  {influencer.youtube_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={influencer.youtube_url} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4 text-red-600" />
                      </a>
                    </Button>
                  )}
                  {influencer.tiktok_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={influencer.tiktok_url} target="_blank" rel="noopener noreferrer">
                        <Video className="h-4 w-4 text-cyan-600" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize">{influencer.platform}</Badge>
                  {influencer.niche && <Badge variant="outline">{influencer.niche}</Badge>}
                </div>
                {influencer.location && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" /> {influencer.location}
                  </p>
                )}
                {influencer.bio && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{influencer.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Followers</p>
                  <p className="text-xl font-bold">{formatNumber(influencer.followers_count)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                  <p className="text-xl font-bold">{influencer.engagement_rate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button variant="gradient" className="w-full" asChild>
            <Link to="/signup">Collaborate with this creator</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
