import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Briefcase, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand } from '@/hooks/useBrand'
import { useBrandCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/shared/CampaignCard'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/useToast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Campaign } from '@/types'
import { formatDate } from '@/lib/utils'

const campaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  budget: z.coerce.number().min(1, 'Budget must be greater than 0'),
  deadline: z.string().min(1, 'Deadline is required'),
})

type CampaignFormData = z.infer<typeof campaignSchema>

export function BrandCampaigns() {
  const { user } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const { data: campaigns = [], isLoading } = useBrandCampaigns(brand?.id)
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
  })

  const openCreate = () => {
    setEditingCampaign(null)
    reset({ title: '', description: '', budget: undefined, deadline: '' })
    setDialogOpen(true)
  }

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    reset({
      title: campaign.title,
      description: campaign.description,
      budget: campaign.budget,
      deadline: campaign.deadline.split('T')[0],
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: CampaignFormData) => {
    if (!brand) return

    try {
      if (editingCampaign) {
        await updateCampaign.mutateAsync({ id: editingCampaign.id, updates: data })
        toast({ title: 'Campaign updated!', variant: 'success' })
      } else {
        await createCampaign.mutateAsync({
          brand_id: brand.id,
          ...data,
          budget: data.budget,
        })
        toast({ title: 'Campaign created!', variant: 'success' })
      }
      setDialogOpen(false)
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return
    try {
      await deleteCampaign.mutateAsync(id)
      toast({ title: 'Campaign deleted' })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete campaign', variant: 'destructive' })
    }
  }

  const active = campaigns.filter(c => c.status === 'in_progress')
  const requested = campaigns.filter(c => c.status === 'requested')
  const completed = campaigns.filter(c => c.status === 'completed')

  const renderGrid = (items: Campaign[]) => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((campaign, i) => (
        <div key={campaign.id} className="relative group">
          <CampaignCard campaign={campaign} linkBase="/brand" delay={i * 0.05} />
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={(e) => { e.preventDefault(); openEdit(campaign) }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-7 w-7"
              onClick={(e) => { e.preventDefault(); handleDelete(campaign.id) }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage all your influencer campaigns</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No campaigns yet"
          description="Create your first campaign and start connecting with influencers."
          action={{ label: 'Create Campaign', onClick: openCreate }}
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({requested.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderGrid(campaigns)}
          </TabsContent>
          <TabsContent value="active" className="mt-4">
            {active.length === 0 ? (
              <EmptyState icon={Briefcase} title="No active campaigns" description="Campaigns in progress appear here." />
            ) : renderGrid(active)}
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            {requested.length === 0 ? (
              <EmptyState icon={Briefcase} title="No pending campaigns" description="Campaigns awaiting responses appear here." />
            ) : renderGrid(requested)}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              <EmptyState icon={Briefcase} title="No completed campaigns" description="Finished campaigns appear here." />
            ) : renderGrid(completed)}
          </TabsContent>
        </Tabs>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
            <DialogDescription>
              {editingCampaign ? 'Update campaign details.' : 'Create a new campaign to collaborate with influencers.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Title *</Label>
              <Input placeholder="e.g., Summer Collection Launch" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe your campaign goals, requirements, and expectations..."
                rows={4}
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (INR) *</Label>
                <Input type="number" min={1} placeholder="43250" {...register('budget')} />
                {errors.budget && <p className="text-xs text-destructive">{errors.budget.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Deadline *</Label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('deadline')}
                />
                {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={createCampaign.isPending || updateCampaign.isPending}
              >
                {createCampaign.isPending || updateCampaign.isPending
                  ? 'Saving...'
                  : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
