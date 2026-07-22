import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Users,
  TrendingUp,
  Instagram,
  Youtube,
  Video,
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react'
import type { AIRecommendedInfluencer } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn, formatNumber, getInitials } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-rose-500'
}

function scoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent Match'
  if (score >= 60) return 'Great Match'
  if (score >= 40) return 'Good Match'
  return 'Partial Match'
}

// ── Circular score ring ───────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56" viewBox="0 0 56 56">
        {/* Track */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/30"
        />
        {/* Progress */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            'transition-all duration-700',
            score >= 80
              ? 'stroke-emerald-500'
              : score >= 60
              ? 'stroke-blue-500'
              : score >= 40
              ? 'stroke-amber-500'
              : 'stroke-rose-500',
          )}
        />
      </svg>
      <span className={cn('text-sm font-bold leading-none', scoreColor(score))}>
        {score}
      </span>
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────

interface AIRecommendationCardProps {
  recommendation: AIRecommendedInfluencer
  onSendRequest?: (influencer: AIRecommendedInfluencer['influencer']) => void
  delay?: number
}

export function AIRecommendationCard({
  recommendation,
  onSendRequest,
  delay = 0,
}: AIRecommendationCardProps) {
  const { influencer, matchScore, reasons, scoreBreakdown } = recommendation
  const profile = influencer.profiles
  const PlatformIcon = platformIcons[influencer.platform] ?? TrendingUp
  const gradientClass = platformColors[influencer.platform] ?? platformColors.other

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden border-2 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group h-full flex flex-col">
        {/* Gradient banner */}
        <div className={`h-16 bg-gradient-to-r ${gradientClass} relative shrink-0`}>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent)]" />
          {/* AI badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Sparkles className="h-3 w-3 text-yellow-300" />
            <span className="text-[10px] font-semibold text-white">AI Pick</span>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 gap-3 pt-0">
          {/* Avatar row */}
          <div className="-mt-8 flex items-end justify-between">
            <Avatar className="h-14 w-14 border-4 border-background shadow-md">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-base font-semibold">
                {getInitials(profile?.full_name ?? 'U')}
              </AvatarFallback>
            </Avatar>
            <ScoreRing score={matchScore} />
          </div>

          {/* Name + match label */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {profile?.full_name ?? 'Influencer'}
              </h3>
              <Badge variant="secondary" className="capitalize flex items-center gap-1 text-[10px] shrink-0">
                <PlatformIcon className="h-2.5 w-2.5" />
                {influencer.platform}
              </Badge>
            </div>
            <p className={cn('text-[11px] font-medium mt-0.5', scoreColor(matchScore))}>
              {scoreLabel(matchScore)} · {matchScore}% match
            </p>
          </div>

          {/* Niche + location */}
          <div className="flex flex-wrap gap-1.5">
            {influencer.niche && (
              <Badge variant="outline" className="text-[10px]">{influencer.niche}</Badge>
            )}
            {influencer.location && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {influencer.location}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <span className="font-semibold">{formatNumber(influencer.followers_count)}</span>
              <span className="text-muted-foreground">followers</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="font-semibold">{influencer.engagement_rate}%</span>
              <span className="text-muted-foreground">eng.</span>
            </div>
          </div>

          {/* Match score bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Match score</span>
              <span className={cn('text-[10px] font-bold', scoreColor(matchScore))}>{matchScore}/100</span>
            </div>
            <Progress
              value={matchScore}
              className="h-1.5"
              indicatorClassName={scoreBgColor(matchScore)}
            />
          </div>

          {/* Score breakdown */}
          <div className="grid grid-cols-5 gap-1 text-center">
            {[
              { label: 'Niche', value: scoreBreakdown.nicheScore, max: 30 },
              { label: 'Engage', value: scoreBreakdown.engagementScore, max: 25 },
              { label: 'Reach', value: scoreBreakdown.followersScore, max: 20 },
              { label: 'Platform', value: scoreBreakdown.platformScore, max: 15 },
              { label: 'Location', value: scoreBreakdown.locationScore, max: 10 },
            ].map(({ label, value, max }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className={cn(
                  'text-[11px] font-bold leading-none',
                  value >= max * 0.7 ? 'text-emerald-600' : value >= max * 0.4 ? 'text-amber-500' : 'text-muted-foreground',
                )}>
                  {value}
                </span>
                <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Reasons */}
          <div className="space-y-1 flex-1">
            {reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-snug">{reason}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
              <Link to={`/influencer/${influencer.id}`}>View Profile</Link>
            </Button>
            {onSendRequest && (
              <Button
                size="sm"
                variant="gradient"
                className="flex-1 text-xs h-8 gap-1"
                onClick={() => onSendRequest(influencer)}
              >
                <Send className="h-3 w-3" />
                Collaborate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
