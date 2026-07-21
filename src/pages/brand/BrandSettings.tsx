import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Save, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBrand, useUpsertBrand } from '@/hooks/useBrand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/shared/FileUpload'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

// ── Schemas ────────────────────────────────────────────────────────
const brandSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Industry is required'),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type BrandFormData = z.infer<typeof brandSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function BrandSettings() {
  const { user, profile, signOut } = useAuth()
  const { data: brand } = useBrand(user?.id)
  const upsertBrand = useUpsertBrand()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [logoFile, setLogoFile] = useState<File | undefined>()

  // Explicit generic so SubmitHandler is correctly typed
  const brandForm = useForm<BrandFormData>({ resolver: zodResolver(brandSchema) })
  const pwForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    if (brand) {
      brandForm.reset({
        company_name: brand.company_name,
        industry: brand.industry,
        website: brand.website ?? '',
        description: brand.description ?? '',
      })
    }
  }, [brand, brandForm])

  const onSaveBrand = async (data: BrandFormData) => {
    if (!user) return
    try {
      await upsertBrand.mutateAsync({ userId: user.id, updates: data, logoFile })
      toast({ title: 'Settings saved!' })
      setLogoFile(undefined)
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  const onUpdatePassword = async (data: PasswordFormData) => {
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Password updated!' })
      pwForm.reset()
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete your brand account? This cannot be undone.')) return
    await signOut()
    navigate('/')
  }

  const brandErrors = brandForm.formState.errors
  const pwErrors = pwForm.formState.errors

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Brand Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your brand profile and account settings</p>
      </motion.div>

      {/* Brand profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={brandForm.handleSubmit(onSaveBrand)} className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <FileUpload
                value={brand?.logo ?? profile?.avatar_url}
                onChange={setLogoFile}
                shape="square"
                label="Upload logo"
                className="w-24"
              />
              <div>
                <p className="text-sm font-medium">{brand?.company_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input {...brandForm.register('company_name')} />
                {brandErrors.company_name && (
                  <p className="text-xs text-destructive">{brandErrors.company_name.message ?? ''}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Industry *</Label>
                <Input placeholder="e.g., Fashion" {...brandForm.register('industry')} />
                {brandErrors.industry && (
                  <p className="text-xs text-destructive">{brandErrors.industry.message ?? ''}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Website</Label>
              <Input placeholder="https://yourcompany.com" {...brandForm.register('website')} />
              {brandErrors.website && (
                <p className="text-xs text-destructive">{brandErrors.website.message ?? ''}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Tell influencers about your brand..."
                rows={4}
                {...brandForm.register('description')}
              />
            </div>

            <Button type="submit" variant="gradient" disabled={upsertBrand.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {upsertBrand.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(onUpdatePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...pwForm.register('password')} />
              {pwErrors.password && (
                <p className="text-xs text-destructive">{pwErrors.password.message ?? ''}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" {...pwForm.register('confirmPassword')} />
              {pwErrors.confirmPassword && (
                <p className="text-xs text-destructive">{pwErrors.confirmPassword.message ?? ''}</p>
              )}
            </div>
            <Button type="submit" variant="gradient" disabled={pwForm.formState.isSubmitting}>
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-base text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
