import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Search, History, Download, Trash2, ChevronDown,
  ChevronUp, FileText, FileSpreadsheet, Loader2, Bot, ArrowRight,
  BarChart3,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns } from '@/hooks/useCampaigns'
import { useBrowseInfluencers } from '@/hooks/useInfluencer'
import { useRunPrediction, usePredictionHistory, useDeletePrediction } from '@/hooks/useCampaignPredictor'
import { useToast } from '@/hooks/useToast'
import { PredictionResultCard } from '@/components/shared/PredictionResultCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatNumber, getInitials } from '@/lib/utils'
import { format } from 'date-fns'
import type { Influencer, Campaign, CampaignPrediction } from '@/types'

// ── CSV export ────────────────────────────────────────────────────────────────

function exportCSV(predictions: CampaignPrediction[]) {
  const headers = [
    'Influencer', 'Platform', 'Niche', 'Followers', 'Engagement Rate',
    'Campaign', 'Budget', 'Success Score', 'Confidence', 'Est. Reach',
    'Est. Engagement', 'Clicks', 'Conversions', 'ROI', 'Date',
  ]
  const rows = predictions.map(p => [
    p.influencer_name,
    p.influencer_platform,
    p.influencer_niche,
    p.influencer_followers,
    `${p.influencer_engagement_rate}%`,
    p.campaign_title ?? '',
    p.campaign_budget ?? '',
    p.success_score,
    p.confidence_score,
    p.estimated_reach,
    p.estimated_engagement,
    p.expected_clicks,
    p.expected_conversions,
    `${p.predicted_roi}x`,
    p.created_at ? format(new Date(p.created_at), 'yyyy-MM-dd') : '',
  ])

  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `predictions-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF export ────────────────────────────────────────────────────────────────

function exportPDF(predictions: CampaignPrediction[]) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('Campaign Performance Predictions — InfluenceHub', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generated ${format(new Date(), 'PPP')}`, 14, 23)

  autoTable(doc, {
    startY: 28,
    head: [[
      'Influencer', 'Platform', 'Campaign', 'Success', 'Confidence',
      'Reach', 'Engagement', 'Clicks', 'Conv.', 'ROI', 'Date',
    ]],
    body: predictions.map(p => [
      p.influencer_name,
      p.influencer_platform,
      p.campaign_title ?? '—',
      `${p.success_score}/100`,
      `${p.confidence_score}%`,
      formatNumber(p.estimated_reach),
      formatNumber(p.estimated_engagement),
      formatNumber(p.expected_clicks),
      formatNumber(p.expected_conversions),
      `${p.predicted_roi}×`,
      p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 246, 255] },
  })

  doc.save(`predictions-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// ── Influencer search picker ──────────────────────────────────────────────────

interface InfluencerPickerProps {
  selected: Influencer | null
  onSelect: (inf: Influencer) => void
}

function InfluencerPicker({ selected, onSelect }: InfluencerPickerProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data } = useBrowseInfluencers(
    { search: search || undefined, sortBy: 'followers_count', sortOrder: 'desc' },
    0,
  )
  const influencers = data?.data ?? []

  return (
    <div className="space-y-2">
      <Label>Influencer <span className="text-destructive">*</span></Label>
      {selected ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border bg-accent">
          <Avatar className="h-9 w-9">
            <AvatarImage src={selected.profiles?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(selected.profiles?.full_name ?? 'I')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selected.profiles?.full_name ?? 'Influencer'}</p>
            <p className="text-xs text-muted-foreground">{selected.platform} · {formatNumber(selected.followers_count)} followers</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={() => { onSelect(selected); setOpen(true) }}>
            Change
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 p-3 rounded-xl border border-dashed cursor-pointer hover:bg-accent transition-colors"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search and select an influencer…</span>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border rounded-xl bg-card shadow-md p-3 space-y-2 mt-1">
              <Input
                placeholder="Search by name, niche, location…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="h-8 text-sm"
              />
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {influencers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No influencers found</p>
                ) : influencers.map(inf => (
                  <button
                    key={inf.id}
                    type="button"
                    onClick={() => { onSelect(inf); setOpen(false); setSearch('') }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={inf.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(inf.profiles?.full_name ?? 'I')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inf.profiles?.full_name ?? 'Influencer'}</p>
                      <p className="text-xs text-muted-foreground">{inf.platform} · {inf.niche} · {formatNumber(inf.followers_count)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{inf.engagement_rate}% eng</Badge>
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── History row ───────────────────────────────────────────────────────────────

interface HistoryRowProps {
  prediction: CampaignPrediction
  onDelete: (id: string) => void
  onExpand: () => void
  expanded: boolean
}

function HistoryRow({ prediction: p, onDelete, onExpand, expanded }: HistoryRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={onExpand}>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(p.influencer_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{p.influencer_name}</p>
            <Badge variant="outline" className="text-[10px] capitalize">{p.influencer_platform}</Badge>
            {p.campaign_title && (
              <Badge variant="secondary" className="text-[10px] truncate max-w-[140px]">{p.campaign_title}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy · h:mm a') : ''}
          </p>
        </div>

        {/* Inline compact score */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Success</p>
            <p className={cn('text-base font-bold',
              p.success_score >= 80 ? 'text-emerald-600'
                : p.success_score >= 60 ? 'text-blue-600'
                : p.success_score >= 40 ? 'text-amber-500'
                : 'text-rose-500'
            )}>{p.success_score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className="text-base font-bold">{p.predicted_roi}×</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Reach</p>
            <p className="text-base font-bold">{formatNumber(p.estimated_reach)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={e => { e.stopPropagation(); if (p.id) onDelete(p.id) }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Separator />
            <div className="p-4">
              <PredictionResultCard prediction={p} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CampaignPerformancePredictor() {
  const { user } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: campaigns = [] } = useBrandCampaigns(brand?.id)
  const { toast } = useToast()

  const { data: history = [], isLoading: historyLoading } = usePredictionHistory(brand?.id)
  const runPrediction = useRunPrediction()
  const deletePrediction = useDeletePrediction(brand?.id)

  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [currentPrediction, setCurrentPrediction] = useState<CampaignPrediction | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('predict')

  const handlePredict = useCallback(async () => {
    if (!selectedInfluencer || !brand) {
      toast({ title: 'Select an influencer first', variant: 'destructive' })
      return
    }

    try {
      const result = await runPrediction.mutateAsync({
        input: {
          influencer: selectedInfluencer,
          campaign: selectedCampaign ?? undefined,
          brand,
        },
        brandId:       brand.id,
        influencerId:  selectedInfluencer.id,
        campaignId:    selectedCampaign?.id ?? null,
      })
      setCurrentPrediction(result)
      toast({ title: 'Prediction complete!', description: `Success score: ${result.success_score}/100`, variant: 'success' })
    } catch {
      toast({ title: 'Prediction failed', description: 'Please try again.', variant: 'destructive' })
    }
  }, [selectedInfluencer, selectedCampaign, brand, runPrediction, toast])

  const handleDelete = async (id: string) => {
    await deletePrediction.mutateAsync(id)
    if (expandedId === id) setExpandedId(null)
    toast({ title: 'Prediction deleted', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Campaign Performance Predictor</h1>
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-[10px]">AI</Badge>
          </div>
          <p className="text-muted-foreground mt-1 ml-11">
            Predict campaign outcomes before committing your budget
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/brand/browse">
            Browse Influencers <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="predict" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Run Prediction
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-3.5 w-3.5" /> History
            {history.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{history.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Predict tab ── */}
        <TabsContent value="predict" className="mt-5 space-y-6">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Input panel */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  Prediction Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Influencer selector */}
                <InfluencerPicker
                  selected={selectedInfluencer}
                  onSelect={setSelectedInfluencer}
                />

                {/* Campaign selector */}
                <div className="space-y-2">
                  <Label>Campaign <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Select
                    value={selectedCampaign?.id ?? '__none__'}
                    onValueChange={v => {
                      if (v === '__none__') { setSelectedCampaign(null); return }
                      const c = campaigns.find(c => c.id === v)
                      setSelectedCampaign(c ?? null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No campaign selected" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No campaign (brand-level prediction)</SelectItem>
                      {campaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title} {c.budget ? `· $${formatNumber(c.budget)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {campaigns.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No campaigns yet.{' '}
                      <Link to="/brand/campaigns" className="text-violet-600 underline">Create one</Link>
                    </p>
                  )}
                </div>

                {/* Selected influencer stats */}
                {selectedInfluencer && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border bg-muted/30 p-3 space-y-2 text-sm"
                  >
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Influencer Stats</p>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs">
                      <span className="text-muted-foreground">Platform</span>
                      <span className="font-medium capitalize">{selectedInfluencer.platform}</span>
                      <span className="text-muted-foreground">Niche</span>
                      <span className="font-medium truncate">{selectedInfluencer.niche}</span>
                      <span className="text-muted-foreground">Followers</span>
                      <span className="font-medium">{formatNumber(selectedInfluencer.followers_count)}</span>
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="font-medium">{selectedInfluencer.engagement_rate}%</span>
                      {selectedInfluencer.location && <>
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium truncate">{selectedInfluencer.location}</span>
                      </>}
                    </div>
                  </motion.div>
                )}

                <Button
                  className="w-full gap-2"
                  variant="gradient"
                  onClick={handlePredict}
                  disabled={!selectedInfluencer || runPrediction.isPending}
                >
                  {runPrediction.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Predicting…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Run AI Prediction</>
                  )}
                </Button>

                {/* Brand context indicator */}
                {brand && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Scoring against <span className="font-medium">{brand.company_name}</span> ·{' '}
                    <span className="capitalize">{brand.industry}</span> industry
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Results panel */}
            <div className="lg:col-span-3">
              {currentPrediction ? (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                  <PredictionResultCard prediction={currentPrediction} />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-72 rounded-2xl border border-dashed text-center p-10 gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/20">
                    <Bot className="h-7 w-7 text-violet-500" />
                  </div>
                  <p className="font-semibold">Ready to predict</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select an influencer (and optionally a campaign) then click <strong>Run AI Prediction</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── History tab ── */}
        <TabsContent value="history" className="mt-5 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">
              {historyLoading ? 'Loading…' : `${history.length} prediction${history.length !== 1 ? 's' : ''} saved`}
            </p>
            {history.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportCSV(history)}>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportPDF(history)}>
                  <FileText className="h-3.5 w-3.5" /> Export PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => {
                    const s = expandedId ? null : (history[0]?.id ?? null)
                    setExpandedId(s)
                  }}
                >
                  {expandedId ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {expandedId ? 'Collapse all' : 'Expand first'}
                </Button>
              </div>
            )}
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <History className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold">No predictions yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Run your first prediction in the <strong>Run Prediction</strong> tab.
              </p>
              <Button size="sm" variant="gradient" onClick={() => setActiveTab('predict')} className="gap-1.5 mt-1">
                <Sparkles className="h-3.5 w-3.5" /> Start predicting
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(p => (
                <HistoryRow
                  key={p.id}
                  prediction={p}
                  onDelete={handleDelete}
                  expanded={expandedId === p.id}
                  onExpand={() => setExpandedId(prev => prev === p.id ? null : (p.id ?? null))}
                />
              ))}
            </div>
          )}

          {/* Export footer when list is long */}
          {history.length > 4 && (
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportCSV(history)}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => exportPDF(history)}>
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
