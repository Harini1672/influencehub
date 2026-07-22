import { motion } from 'framer-motion'
import {
  Sparkles, Target, Users, TrendingUp, MousePointerClick,
  ShoppingCart, DollarSign, Shield, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn, formatNumber } from '@/lib/utils'
import type { CampaignPrediction } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-500'
  return 'text-rose-500'
}
function scoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}
function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Moderate'
  return 'Low'
}
function scoreGradient(score: number) {
  if (score >= 80) return 'from-emerald-500 to-teal-500'
  if (score >= 60) return 'from-blue-500 to-violet-500'
  if (score >= 40) return 'from-amber-400 to-orange-500'
  return 'from-rose-500 to-red-600'
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricTileProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  color: string
  delay?: number
}

function MetricTile({ icon: Icon, label, value, sub, color, delay = 0 }: MetricTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="flex flex-col gap-1 p-4 rounded-2xl border bg-card"
    >
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-xl', color)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className="text-xl font-bold leading-none">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </motion.div>
  )
}

interface ScoreRingProps { score: number; size?: number }

function ScoreRing({ score, size = 96 }: ScoreRingProps) {
  const r = size * 0.38
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={size * 0.08} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          strokeWidth={size * 0.08} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className={cn('transition-all duration-700',
            score >= 80 ? 'stroke-emerald-500'
              : score >= 60 ? 'stroke-blue-500'
              : score >= 40 ? 'stroke-amber-500'
              : 'stroke-rose-500')}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('font-bold leading-none', size > 80 ? 'text-2xl' : 'text-lg', scoreColor(score))}>
          {score}
        </span>
        <span className="text-[10px] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface PredictionResultCardProps {
  prediction: CampaignPrediction
  /** When true renders a compact summary row instead of the full card */
  compact?: boolean
}

export function PredictionResultCard({ prediction, compact = false }: PredictionResultCardProps) {
  const p = prediction

  // Radar data
  const radarData = [
    { subject: 'Niche',      A: p.score_breakdown.nicheMatch,        fullMark: 25 },
    { subject: 'Engagement', A: p.score_breakdown.engagementQuality, fullMark: 25 },
    { subject: 'Audience',   A: p.score_breakdown.audienceSize,      fullMark: 20 },
    { subject: 'Platform',   A: p.score_breakdown.platformFit,       fullMark: 15 },
    { subject: 'Location',   A: p.score_breakdown.locationRelevance, fullMark: 15 },
  ]

  // Compact row variant (used in history table)
  if (compact) {
    return (
      <div className="flex items-center gap-4 flex-wrap">
        <ScoreRing score={p.success_score} size={56} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', scoreColor(p.success_score))}>
            {scoreLabel(p.success_score)} · {p.success_score}/100
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Reach {formatNumber(p.estimated_reach)} · Eng {formatNumber(p.estimated_engagement)} · ROI {p.predicted_roi}×
          </p>
        </div>
        <Badge className={cn('shrink-0 text-white border-0', `bg-gradient-to-r ${scoreGradient(p.success_score)}`)}>
          {scoreLabel(p.success_score)}
        </Badge>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Hero score row ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20"
      >
        <ScoreRing score={p.success_score} size={112} />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Campaign Success Score</span>
          </div>
          <p className={cn('text-4xl font-extrabold', scoreColor(p.success_score))}>
            {p.success_score}<span className="text-xl font-normal text-muted-foreground">/100</span>
          </p>
          <p className={cn('text-lg font-semibold mt-0.5', scoreColor(p.success_score))}>
            {scoreLabel(p.success_score)} Match
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Influencer: <span className="font-medium text-foreground">{p.influencer_name}</span>
            {p.campaign_title && (
              <> · Campaign: <span className="font-medium text-foreground">{p.campaign_title}</span></>
            )}
          </p>
        </div>

        {/* Confidence */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Shield className="h-3.5 w-3.5" />
            Confidence
          </div>
          <ScoreRing score={p.confidence_score} size={72} />
        </div>
      </motion.div>

      {/* ── Metric tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricTile icon={Users}            label="Est. Reach"      value={formatNumber(p.estimated_reach)}     color="bg-violet-500"  delay={0.05} />
        <MetricTile icon={TrendingUp}       label="Engagement"      value={formatNumber(p.estimated_engagement)} color="bg-blue-500"    delay={0.08} />
        <MetricTile icon={MousePointerClick} label="Clicks"          value={formatNumber(p.expected_clicks)}     color="bg-cyan-500"    delay={0.11} />
        <MetricTile icon={ShoppingCart}     label="Conversions"     value={formatNumber(p.expected_conversions)} color="bg-emerald-500" delay={0.14} />
        <MetricTile
          icon={DollarSign}
          label="Predicted ROI"
          value={`${p.predicted_roi}×`}
          sub={`${((p.predicted_roi - 1) * 100).toFixed(0)}% return`}
          color={p.predicted_roi >= 2 ? 'bg-emerald-500' : 'bg-amber-500'}
          delay={0.17}
        />
        <MetricTile
          icon={Target}
          label="Budget"
          value={p.campaign_budget ? `$${formatNumber(p.campaign_budget)}` : 'N/A'}
          color="bg-orange-500"
          delay={0.2}
        />
      </div>

      {/* ── Score breakdown + Radar ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Progress bars breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Niche Match',          value: p.score_breakdown.nicheMatch,          max: 25 },
              { label: 'Engagement Quality',   value: p.score_breakdown.engagementQuality,   max: 25 },
              { label: 'Audience Size',        value: p.score_breakdown.audienceSize,        max: 20 },
              { label: 'Platform Fit',         value: p.score_breakdown.platformFit,         max: 15 },
              { label: 'Location Relevance',   value: p.score_breakdown.locationRelevance,   max: 15 },
            ].map(({ label, value, max }) => {
              const pct = Math.round((value / max) * 100)
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}<span className="text-muted-foreground">/{max}</span></span>
                  </div>
                  <Progress value={pct} className="h-2"
                    indicatorClassName={scoreBg(pct)} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Radar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Performance Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(val: number, _name: string, { payload }) => [`${val} / ${payload.fullMark}`, payload.subject]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Insights + Risks ── */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Card className="border-emerald-200 dark:border-emerald-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.insights.length === 0 ? (
              <p className="text-xs text-muted-foreground">No insights generated.</p>
            ) : p.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm leading-snug">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {p.risk_factors.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                No significant risks identified.
              </div>
            ) : p.risk_factors.map((risk, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm leading-snug">{risk}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
