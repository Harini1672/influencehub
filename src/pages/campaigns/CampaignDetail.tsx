import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Send, Trash2, Calendar, IndianRupee,
  Users, CheckCircle, Clock, AlertCircle, Edit,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useInfluencer } from '@/hooks/useInfluencer'
import {
  useCampaign,
  useCampaignNotes,
  useAddNote,
  useDeleteNote,
  useCampaignRequests,
  useUpdateCampaignStatus,
} from '@/hooks/useCampaigns'
import { useRealtimeCampaign } from '@/hooks/useRealtimeCampaign'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/shared/SkeletonCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatRelativeTime, getDaysUntil, getInitials } from '@/lib/utils'
import type { CampaignStatus } from '@/types'
import { cn } from '@/lib/utils'

const timelineSteps: { status: CampaignStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'requested', label: 'Requested', icon: Clock },
  { status: 'accepted', label: 'Accepted', icon: CheckCircle },
  { status: 'in_progress', label: 'In Progress', icon: AlertCircle },
  { status: 'completed', label: 'Completed', icon: CheckCircle },
]

const statusOrder: Record<CampaignStatus, number> = {
  requested: 0,
  accepted: 1,
  rejected: -1,
  in_progress: 2,
  completed: 3,
}

export function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: influencer } = useInfluencer(user?.id)
  const { data: campaign, isLoading } = useCampaign(id)
  const { data: notes = [] } = useCampaignNotes(id)
  const { data: participants = [] } = useCampaignRequests(id)
  const addNote = useAddNote()
  const deleteNote = useDeleteNote()
  const updateStatus = useUpdateCampaignStatus()
  const { toast } = useToast()
  const [noteText, setNoteText] = useState('')
  const notesEndRef = useRef<HTMLDivElement>(null)

  useRealtimeCampaign(id)

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [notes])

  const isBrandOwner = brand && campaign?.brand_id === brand.id
  const currentStatusOrder = campaign ? statusOrder[campaign.status] : -1

  const handleAddNote = async () => {
    if (!noteText.trim() || !id || !user) return
    try {
      await addNote.mutateAsync({ campaignId: id, senderId: user.id, message: noteText.trim() })
      setNoteText('')
    } catch {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return
    await deleteNote.mutateAsync({ noteId, campaignId: id })
  }

  const handleStatusUpdate = async (status: string) => {
    if (!id) return
    try {
      await updateStatus.mutateAsync({ id, status: status as CampaignStatus })
      toast({ title: 'Status updated!', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' })
    }
  }

  const daysLeft = campaign ? getDaysUntil(campaign.deadline) : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to={profile?.role === 'brand' ? '/brand/campaigns' : '/influencer/campaigns'}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to={profile?.role === 'brand' ? '/brand/campaigns' : '/influencer/campaigns'}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{campaign.title}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-muted-foreground text-sm">{campaign.brands?.company_name}</p>
          </div>
          {isBrandOwner && campaign.status !== 'completed' && campaign.status !== 'rejected' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={campaign.status}
                onValueChange={handleStatusUpdate}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Campaign info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{campaign.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <IndianRupee className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                  </div>
                </div>
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  daysLeft < 0 ? 'bg-red-50 dark:bg-red-900/20' :
                  daysLeft <= 3 ? 'bg-amber-50 dark:bg-amber-900/20' :
                  'bg-blue-50 dark:bg-blue-900/20'
                )}>
                  <Calendar className={cn(
                    'h-5 w-5',
                    daysLeft < 0 ? 'text-red-600' :
                    daysLeft <= 3 ? 'text-amber-600' : 'text-blue-600'
                  )} />
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-semibold">{formatDate(campaign.deadline)}</p>
                    <p className={cn(
                      'text-xs',
                      daysLeft < 0 ? 'text-red-600' :
                      daysLeft <= 3 ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` :
                       daysLeft === 0 ? 'Due today' :
                       `${daysLeft} days left`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
                <div className="space-y-4">
                  {timelineSteps.map((step) => {
                    const stepOrder = statusOrder[step.status]
                    const isCompleted = currentStatusOrder >= stepOrder
                    const isCurrent = campaign.status === step.status
                    const Icon = step.icon

                    return (
                      <div key={step.status} className="flex items-center gap-4 pl-0">
                        <div className={cn(
                          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          isCompleted
                            ? 'border-violet-600 bg-violet-600 text-white'
                            : 'border-border bg-background text-muted-foreground'
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm font-medium',
                            isCurrent && 'text-violet-600',
                            !isCompleted && !isCurrent && 'text-muted-foreground'
                          )}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs mt-0.5">Current</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes / Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto mb-4 pr-1">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-muted-foreground">No notes yet. Start the conversation.</p>
                  </div>
                ) : (
                  notes.map((note) => {
                    const isOwn = note.sender_id === user?.id
                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={note.profiles?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(note.profiles?.full_name ?? 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn('max-w-[70%] group', isOwn ? 'items-end' : 'items-start')}>
                          <div className={cn(
                            'rounded-2xl px-4 py-2 text-sm',
                            isOwn
                              ? 'bg-violet-600 text-white rounded-tr-sm'
                              : 'bg-muted rounded-tl-sm'
                          )}>
                            {note.message}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(note.created_at)}
                            </p>
                            {isOwn && (
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3 text-red-500 hover:text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={notesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={2}
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                />
                <Button
                  onClick={handleAddNote}
                  variant="gradient"
                  size="icon"
                  disabled={!noteText.trim() || addNote.isPending}
                  className="self-end h-10 w-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Press Enter to send, Shift+Enter for new line</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={campaign.brands?.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(campaign.brands?.company_name ?? 'B')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{campaign.brands?.company_name}</p>
                  <Badge variant="secondary" className="text-xs">Brand</Badge>
                </div>
              </div>

              {/* Influencers */}
              {participants
                .filter(p => p.status === 'accepted')
                .map(p => {
                  const inf = (p as never as { influencers?: { profiles?: { full_name?: string; avatar_url?: string } } }).influencers
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={inf?.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(inf?.profiles?.full_name ?? 'I')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inf?.profiles?.full_name}</p>
                        <Badge variant="success" className="text-xs">Influencer</Badge>
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(campaign.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span>{formatDate(campaign.deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(campaign.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={campaign.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notes</span>
                <span>{notes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
