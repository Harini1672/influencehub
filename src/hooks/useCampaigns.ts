import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignService } from '@/services/campaign.service'
import { notificationService } from '@/services/notification.service'
import type { Campaign, CampaignStatus } from '@/types'

// ── Brand campaigns ──────────────────────────────────────────────
export function useBrandCampaigns(brandId?: string) {
  return useQuery({
    queryKey: ['campaigns', 'brand', brandId],
    queryFn: () => campaignService.getByBrandId(brandId!),
    enabled: !!brandId,
    select: (result) => result.data ?? [],
  })
}

export function useCampaign(id?: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignService.getById(id!),
    enabled: !!id,
    select: (result) => result.data,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (campaign: Omit<Campaign, 'id' | 'created_at' | 'status'>) =>
      campaignService.create(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      campaignService.update(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      campaignService.updateStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => campaignService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ── Campaign Requests ─────────────────────────────────────────────
export function useInfluencerRequests(influencerId?: string) {
  return useQuery({
    queryKey: ['requests', 'influencer', influencerId],
    queryFn: () => campaignService.getRequestsForInfluencer(influencerId!),
    enabled: !!influencerId,
    select: (result) => result.data ?? [],
  })
}

export function useBrandRequests(brandId?: string) {
  return useQuery({
    queryKey: ['requests', 'brand', brandId],
    queryFn: () => campaignService.getRequestsForBrand(brandId!),
    enabled: !!brandId,
    select: (result) => result.data ?? [],
  })
}

export function useCampaignRequests(campaignId?: string) {
  return useQuery({
    queryKey: ['requests', 'campaign', campaignId],
    queryFn: () => campaignService.getRequestsByCampaign(campaignId!),
    enabled: !!campaignId,
    select: (result) => result.data ?? [],
  })
}

export function useSendCampaignRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (request: {
      campaign_id: string
      brand_id: string
      influencer_id: string
      message?: string
      influencer_user_id: string
      campaign_title: string
      brand_name: string
    }) => {
      const { data, error } = await campaignService.createRequest({
        campaign_id: request.campaign_id,
        brand_id: request.brand_id,
        influencer_id: request.influencer_id,
        message: request.message,
      })
      if (error) throw error
      // Send notification to influencer
      await notificationService.create({
        user_id: request.influencer_user_id,
        title: 'New Collaboration Request',
        message: `${request.brand_name} wants to collaborate on "${request.campaign_title}"`,
        type: 'request',
        link: `/influencer/requests`,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useRespondToRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      brandUserId,
      influencerName,
      campaignTitle,
      campaignId,
    }: {
      requestId: string
      status: 'accepted' | 'rejected'
      brandUserId: string
      influencerName: string
      campaignTitle: string
      campaignId: string
    }) => {
      const { data, error } = await campaignService.updateRequestStatus(requestId, status)
      if (error) throw error

      if (status === 'accepted') {
        // Move campaign to in_progress
        await campaignService.updateStatus(campaignId, 'in_progress')
        await notificationService.create({
          user_id: brandUserId,
          title: 'Request Accepted!',
          message: `${influencerName} accepted your collaboration request for "${campaignTitle}"`,
          type: 'accepted',
          link: `/brand/campaigns/${campaignId}`,
        })
      } else {
        await notificationService.create({
          user_id: brandUserId,
          title: 'Request Declined',
          message: `${influencerName} declined the collaboration request for "${campaignTitle}"`,
          type: 'rejected',
          link: `/brand/campaigns`,
        })
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ── Campaign Notes ─────────────────────────────────────────────────
export function useCampaignNotes(campaignId?: string) {
  return useQuery({
    queryKey: ['notes', campaignId],
    queryFn: () => campaignService.getNotes(campaignId!),
    enabled: !!campaignId,
    select: (result) => result.data ?? [],
  })
}

export function useAddNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      campaignId,
      senderId,
      message,
    }: {
      campaignId: string
      senderId: string
      message: string
    }) => campaignService.addNote(campaignId, senderId, message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.campaignId] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, campaignId }: { noteId: string; campaignId: string }) =>
      campaignService.deleteNote(noteId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes', variables.campaignId] })
    },
  })
}

// ── Dashboard Stats ────────────────────────────────────────────────
export function useBrandDashboardStats(brandId?: string) {
  return useQuery({
    queryKey: ['stats', 'brand', brandId],
    queryFn: () => campaignService.getBrandStats(brandId!),
    enabled: !!brandId,
  })
}

export function useInfluencerDashboardStats(influencerId?: string) {
  return useQuery({
    queryKey: ['stats', 'influencer', influencerId],
    queryFn: () => campaignService.getInfluencerStats(influencerId!),
    enabled: !!influencerId,
  })
}
