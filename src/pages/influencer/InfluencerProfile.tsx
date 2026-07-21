import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Save, Instagram, Youtube, Video, Eye, EyeOff,
  CheckCircle2, ExternalLink, Unlink, Loader2,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useInfluencer, useUpsertInfluencer, useDisconnectInstagram } from '@/hooks/useInfluencer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/shared/FileUpload'
import { useToast } from '@/hooks/useToast'
import { Badge } from '@/components/ui/badge'

// ── Instagram OAuth helpers ────────────────────────────────────────────────────
const IG_CLIENT_ID   = import.meta.env.VITE_INSTAGRAM_CLIENT_ID as string
const REDIRECT_URI   = `${window.location.origin}/auth/instagram/callback`
// Scopes needed for Instagram Business Login
const IG_SCOPES      = 'instagram_business_basic'

function buildInstagramAuthUrl() {
  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id',     IG_CLIENT_ID)
  url.searchParams.set('redirect_uri',  REDIRECT_URI)
  url.searchParams.set('scope',         IG_SCOPES)
  url.searchParams.set('response_type', 'code')
  return url.toString()
}

// ── Form schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  platform:        z.string().min(1),
  niche:           z.string().min(1, 'Niche is required'),
  followers_count: z.coerce.number().min(0),
  engagement_rate: z.coerce.number().min(0).max(100),
  bio:             z.string().optional(),
  location:        z.string().optional(),
  instagram_url:   z.string().url('Enter a valid URL').optional().or(z.literal('')),
  youtube_url:     z.string().url('Enter a valid URL').optional().or(z.literal('')),
  tiktok_url:      z.string().url('Enter a valid URL').optional().or(z.literal('')),
  is_public:       z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

const niches    = ['Fashion', 'Beauty', 'Tech', 'Gaming', 'Fitness', 'Food', 'Travel',
                   'Lifestyle', 'Business', 'Education', 'Entertainment', 'Sports',
                   'Art', 'Music', 'Health', 'Finance', 'Photography', 'Other']
const platforms = ['instagram', 'youtube', 'tiktok', 'twitter', 'other']

// ── Component ─────────────────────────────────────────────────────────────────
export function InfluencerProfile() {
  const { user, profile, updateProfile } = useAuth()
  const { data: influencer }             = useInfluencer(user?.id)
  const upsertMutation                   = useUpsertInfluencer()
  const disconnectMutation               = useDisconnectInstagram()
  const { toast }                        = useToast()
  const [avatarFile, setAvatarFile]      = useState<File | undefined>()
  const [searchParams, setSearchParams]  = useSearchParams()
  const toastShownRef                    = useRef(false)   // prevent double-toast in StrictMode

  // ── Show toast from Instagram callback redirect ──────────────────────────
  useEffect(() => {
    const igStatus  = searchParams.get('instagram')
    const igMessage = searchParams.get('message')
    if (!igStatus || toastShownRef.current) return
    toastShownRef.current = true

    if (igStatus === 'success') {
      toast({ title: 'Instagram connected!', description: igMessage ?? '', variant: 'success' })
    } else {
      toast({ title: 'Instagram connection failed', description: igMessage ?? '', variant: 'destructive' })
    }
    // Remove the query params so a refresh doesn't re-show the toast
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, toast])

  // ── Form setup ────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { platform: 'instagram', is_public: true },
  })

  useEffect(() => {
    if (influencer) {
      reset({
        platform:        influencer.platform,
        niche:           influencer.niche,
        followers_count: influencer.followers_count,
        engagement_rate: influencer.engagement_rate,
        bio:             influencer.bio         ?? '',
        location:        influencer.location    ?? '',
        instagram_url:   influencer.instagram_url ?? '',
        youtube_url:     influencer.youtube_url ?? '',
        tiktok_url:      influencer.tiktok_url  ?? '',
        is_public:       influencer.is_public,
      })
    }
  }, [influencer, reset])

  const isPublic         = watch('is_public')
  const isConnected      = influencer?.instagram_connected === true
  const igUsername       = influencer?.instagram_username
  const igClientIdSet    = !!IG_CLIENT_ID && IG_CLIENT_ID !== 'your_instagram_app_id'

  // ── Save handler ─────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      await upsertMutation.mutateAsync({
        userId: user.id,
        updates: {
          platform:        data.platform as never,
          niche:           data.niche,
          followers_count: data.followers_count,
          engagement_rate: data.engagement_rate,
          bio:             data.bio      ?? null,
          location:        data.location ?? null,
          instagram_url:   data.instagram_url || null,
          youtube_url:     data.youtube_url   || null,
          tiktok_url:      data.tiktok_url    || null,
          is_public:       data.is_public     ?? true,
        },
        avatarFile,
      })
      if (profile?.full_name) {
        await updateProfile({ full_name: profile.full_name })
      }
      toast({ title: 'Profile updated!', description: 'Your changes have been saved.', variant: 'success' })
      setAvatarFile(undefined)
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  // ── Disconnect handler ───────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!user) return
    try {
      await disconnectMutation.mutateAsync(user.id)
      toast({ title: 'Instagram disconnected', description: 'Your account has been unlinked.', variant: 'default' })
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your influencer profile and public visibility
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Profile photo ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
            <CardDescription>This is your public-facing photo</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <FileUpload
              value={profile?.avatar_url}
              onChange={(file) => setAvatarFile(file)}
              shape="circle"
              label="Upload photo"
            />
            <div>
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setValue('is_public', !isPublic)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isPublic
                    ? <Eye className="h-3.5 w-3.5" />
                    : <EyeOff className="h-3.5 w-3.5" />}
                  {isPublic ? 'Public profile' : 'Private profile'}
                </button>
                <Badge variant={isPublic ? 'success' : 'secondary'}>
                  {isPublic ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Creator info ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Creator Info</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Platform</Label>
              <Select
                value={watch('platform')}
                onValueChange={(v) => setValue('platform', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Niche</Label>
              <Select
                value={watch('niche')}
                onValueChange={(v) => setValue('niche', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your niche" />
                </SelectTrigger>
                <SelectContent>
                  {niches.map(n => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.niche && (
                <p className="text-xs text-destructive">{errors.niche.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Followers Count</Label>
              <Input type="number" min={0} {...register('followers_count')} />
              {errors.followers_count && (
                <p className="text-xs text-destructive">{errors.followers_count.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Engagement Rate (%)</Label>
              <Input type="number" min={0} max={100} step={0.01} {...register('engagement_rate')} />
              {errors.engagement_rate && (
                <p className="text-xs text-destructive">{errors.engagement_rate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="City, Country" {...register('location')} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Tell brands about yourself..."
                rows={4}
                {...register('bio')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Social links ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social Links</CardTitle>
            <CardDescription>Connect your social accounts or enter URLs manually</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ── Instagram — OAuth block ────────────────────────────────── */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                {/* Instagram gradient icon */}
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                  <Instagram className="h-3 w-3 text-white" />
                </span>
                Instagram
              </Label>

              {isConnected && igUsername ? (
                /* ── Connected state ────────────────────────────────────── */
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        @{igUsername}
                      </p>
                      <p className="text-xs text-muted-foreground">Instagram Business connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://instagram.com/${igUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={handleDisconnect}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Unlink className="h-3.5 w-3.5 mr-1" />}
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Not connected state ────────────────────────────────── */
                <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect your Instagram Business account to verify your profile and let
                    brands see your real username.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {igClientIdSet ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-pink-300 text-pink-700 hover:bg-pink-50 hover:text-pink-800 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-900/20"
                        onClick={() => window.location.assign(buildInstagramAuthUrl())}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                          <Instagram className="h-2.5 w-2.5 text-white" />
                        </span>
                        Connect Instagram Business
                      </Button>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠ Set <code className="font-mono bg-muted px-1 rounded">VITE_INSTAGRAM_CLIENT_ID</code> in
                        your <code className="font-mono bg-muted px-1 rounded">.env</code> to enable OAuth.
                      </p>
                    )}
                  </div>
                  {/* Fallback manual URL field — hidden once OAuth is connected */}
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground mb-1.5">Or enter your URL manually:</p>
                    <Input
                      placeholder="https://instagram.com/yourusername"
                      {...register('instagram_url')}
                    />
                    {errors.instagram_url && (
                      <p className="text-xs text-destructive mt-1">{errors.instagram_url.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── YouTube ───────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-600" /> YouTube URL
              </Label>
              <Input placeholder="https://youtube.com/@yourchannel" {...register('youtube_url')} />
              {errors.youtube_url && (
                <p className="text-xs text-destructive">{errors.youtube_url.message}</p>
              )}
            </div>

            {/* ── TikTok ────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-cyan-600" /> TikTok URL
              </Label>
              <Input placeholder="https://tiktok.com/@yourusername" {...register('tiktok_url')} />
              {errors.tiktok_url && (
                <p className="text-xs text-destructive">{errors.tiktok_url.message}</p>
              )}
            </div>

          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="gradient"
          disabled={upsertMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {upsertMutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>
    </div>
  )
}
