import { useQuery } from '@tanstack/react-query'
import { aiRecommendationService } from '@/services/ai-recommendation.service'
import type { Brand, Campaign } from '@/types'

/**
 * Fetches and returns AI-scored influencer recommendations for a brand.
 * Optionally scoped to a specific campaign for more targeted matching.
 */
export function useAIRecommendations(brand?: Brand, campaign?: Campaign, topN = 6) {
  return useQuery({
    queryKey: ['ai-recommendations', brand?.id, campaign?.id, topN],
    queryFn: () => aiRecommendationService.getRecommendations(brand!, campaign, topN),
    enabled: !!brand,
    select: (result) => result.data ?? [],
    // Recommendations don't need to refetch on every window focus — cache for 5 min
    staleTime: 5 * 60 * 1000,
  })
}
