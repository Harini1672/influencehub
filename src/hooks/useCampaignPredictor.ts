import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { campaignPredictorService } from '@/services/campaign-predictor.service'
import { predictionStorageService } from '@/services/prediction-storage.service'
import type { PredictionInput, CampaignPrediction } from '@/types'

// ── Run + save a new prediction ───────────────────────────────────────────────

interface RunPredictionArgs {
  input: PredictionInput
  brandId: string
  influencerId: string
  campaignId?: string | null
}

export function useRunPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ input, brandId, influencerId, campaignId }: RunPredictionArgs) => {
      // 1. Compute prediction client-side
      const prediction = campaignPredictorService.predict(input)

      // 2. Persist to Supabase
      const { data, error } = await predictionStorageService.save({
        brand_id:      brandId,
        campaign_id:   campaignId,
        influencer_id: influencerId,
        prediction,
      })

      if (error) throw error
      // Return the saved record (has id + created_at) merged with local score_breakdown
      return { ...(data ?? prediction), score_breakdown: prediction.score_breakdown } as CampaignPrediction
    },
    onSuccess: (_data, variables) => {
      // Invalidate history so the list refreshes immediately
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.brandId] })
    },
  })
}

// ── Fetch prediction history for a brand ─────────────────────────────────────

export function usePredictionHistory(brandId?: string) {
  return useQuery({
    queryKey: ['predictions', brandId],
    queryFn: () => predictionStorageService.getByBrand(brandId!),
    enabled: !!brandId,
    select: (result) => result.data ?? [],
    staleTime: 2 * 60 * 1000,
  })
}

// ── Delete a prediction ───────────────────────────────────────────────────────

export function useDeletePrediction(brandId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => predictionStorageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictions', brandId] })
    },
  })
}
