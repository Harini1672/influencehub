import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns, useSendCampaignRequest } from '@/hooks/useCampaigns'
import { useBrowseInfluencers } from '@/hooks/useInfluencer'
import { InfluencerCard } from '@/components/shared/InfluencerCard'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import type { Influencer, InfluencerFilters } from '@/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const requestSchema = z.object({
  campaign_id: z.string().min(1, 'Select a campaign'),
  message: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

const niches = ['All', 'Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel', 'Lifestyle', 'Business', 'Education', 'Entertainment', 'Sports', 'Art', 'Music', 'Health']

export function BrowseInfluencers() {
  const { user } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: campaigns = [] } = useBrandCampaigns(brand?.id)
  const sendRequest = useSendCampaignRequest()
  const { toast } = useToast()

  const [filters, setFilters] = useState<Partial<InfluencerFilters>>({
    sortBy: 'followers_count',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)

  const { data, isLoading } = useBrowseInfluencers(filters, page)
  const influencers = data?.data ?? []
  const total = data?.count ?? 0

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  })

  const handleSearch = useCallback(() => {
    setFilters(f => ({ ...f, search: searchInput }))
    setPage(0)
  }, [searchInput])

  const handleFilterChange = (key: keyof InfluencerFilters, value: string) => {
    setFilters(f => ({ ...f, [key]: value === 'all' ? undefined : value }))
    setPage(0)
  }

  const handleSendRequest = (influencer: Influencer) => {
    setSelectedInfluencer(influencer)
    setRequestDialogOpen(true)
    reset()
  }

  const onSubmitRequest = async (data: RequestFormData) => {
    if (!brand || !selectedInfluencer) return

    const campaign = campaigns.find(c => c.id === data.campaign_id)
    if (!campaign) return

    try {
      await sendRequest.mutateAsync({
        campaign_id: data.campaign_id,
        brand_id: brand.id,
        influencer_id: selectedInfluencer.id,
        message: data.message,
        influencer_user_id: selectedInfluencer.user_id,
        campaign_title: campaign.title,
        brand_name: brand.company_name,
      })

      toast({
        title: 'Request sent!',
        description: `Collaboration request sent to ${selectedInfluencer.profiles?.full_name}.`,
        variant: 'success',
      })
      setRequestDialogOpen(false)
      setSelectedInfluencer(null)
    } catch (err: unknown) {
      const message = (err as Error).message
      if (message.includes('unique') || message.includes('duplicate')) {
        toast({ title: 'Already requested', description: 'You already sent a request to this influencer for this campaign.', variant: 'destructive' })
      } else {
        toast({ title: 'Error', description: message, variant: 'destructive' })
      }
    }
  }

  const clearFilters = () => {
    setFilters({ sortBy: 'followers_count', sortOrder: 'desc' })
    setSearchInput('')
    setPage(0)
  }

  const hasFilters = !!filters.search || !!filters.platform || !!filters.niche || !!filters.location

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Browse Influencers</h1>
        <p className="text-muted-foreground mt-1">Discover and connect with the perfect creators for your campaigns</p>
      </motion.div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, niche, location..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} variant="gradient">
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl border bg-card"
        >
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select onValueChange={(v) => handleFilterChange('platform', v)}>
              <SelectTrigger><SelectValue placeholder="All platforms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Niche</Label>
            <Select onValueChange={(v) => handleFilterChange('niche', v)}>
              <SelectTrigger><SelectValue placeholder="All niches" /></SelectTrigger>
              <SelectContent>
                {niches.map(n => (
                  <SelectItem key={n} value={n.toLowerCase()}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(v) => handleFilterChange('sortBy', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="followers_count">Highest Followers</SelectItem>
                <SelectItem value="engagement_rate">Highest Engagement</SelectItem>
                <SelectItem value="created_at">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="City, Country"
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
        </motion.div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Loading...' : `${total} influencers found`}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : influencers.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No influencers found"
          description="Try adjusting your search filters or clear them to see all available influencers."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {influencers.map((influencer, i) => (
            <InfluencerCard
              key={influencer.id}
              influencer={influencer}
              onSendRequest={campaigns.length > 0 ? handleSendRequest : undefined}
              delay={i * 0.04}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {Math.ceil(total / 12)}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * 12 >= total || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Send request dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Collaboration Request</DialogTitle>
            <DialogDescription>
              Send a request to {selectedInfluencer?.profiles?.full_name} to collaborate on a campaign.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Campaign *</Label>
              <Select onValueChange={(v) => setValue('campaign_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">
                      No campaigns available. Create one first.
                    </div>
                  ) : (
                    campaigns
                      .filter(c => c.status !== 'completed' && c.status !== 'rejected')
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {errors.campaign_id && (
                <p className="text-xs text-destructive">{errors.campaign_id.message ?? ''}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Tell the influencer why they're a great fit..."
                rows={4}
                {...register('message')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={sendRequest.isPending}>
                {sendRequest.isPending ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
