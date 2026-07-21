import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { brandService } from '@/services/brand.service'
import { storageService } from '@/services/storage.service'
import { supabase } from '@/lib/supabase'
import type { Brand } from '@/types'

export function useBrand(userId?: string) {
  return useQuery({
    queryKey: ['brand', userId],
    queryFn: () => brandService.getByUserId(userId!),
    enabled: !!userId,
    select: (result) => result.data,
  })
}

export function useBrandById(id?: string) {
  return useQuery({
    queryKey: ['brand-by-id', id],
    queryFn: () => brandService.getById(id!),
    enabled: !!id,
    select: (result) => result.data,
  })
}

export function useUpsertBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
      logoFile,
    }: {
      userId: string
      updates: Partial<Brand>
      logoFile?: File
    }) => {
      let logoUrl = updates.logo
      if (logoFile) {
        const { url, error } = await storageService.uploadBrandLogo(userId, logoFile)
        if (error) throw error
        logoUrl = url ?? undefined
      }
      const { data, error } = await brandService.upsert(userId, {
        ...updates,
        ...(logoUrl ? { logo: logoUrl } : {}),
      })
      if (error) throw error
      if (logoUrl) {
        await supabase.from('profiles').update({ avatar_url: logoUrl }).eq('id', userId)
      }
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brand', variables.userId] })
    },
  })
}
