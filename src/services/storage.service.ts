import { supabase } from '@/lib/supabase'

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) return { url: null, error: uploadError }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // bust cache with timestamp
    return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
  },

  async uploadBrandLogo(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
    const ext = file.name.split('.').pop()
    const path = `${userId}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) return { url: null, error: uploadError }

    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path)
    return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
  },

  async deleteAvatar(userId: string) {
    const extensions = ['jpg', 'jpeg', 'png', 'webp']
    for (const ext of extensions) {
      await supabase.storage.from('avatars').remove([`${userId}/avatar.${ext}`])
    }
  },
}
