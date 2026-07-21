import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Save, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

// ── Schemas ────────────────────────────────────────────────────────
const nameSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
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

type NameFormData = z.infer<typeof nameSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function InfluencerSettings() {
  const { profile, updateProfile, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Explicit generics → SubmitHandler is correctly typed
  const nameForm = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { full_name: profile?.full_name ?? '' },
  })
  const pwForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const onSaveName = async (data: NameFormData) => {
    const { error } = await updateProfile({ full_name: data.full_name })
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Name updated!' })
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    setDeletingAccount(true)
    await signOut()
    navigate('/')
  }

  const nameErrors = nameForm.formState.errors
  const pwErrors = pwForm.formState.errors

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </motion.div>

      {/* Display name */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display Name</CardTitle>
          <CardDescription>This name appears on your public profile</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(onSaveName)} className="space-y-3">
            <div className="flex gap-3">
              <Input {...nameForm.register('full_name')} className="flex-1" />
              <Button type="submit" variant="gradient" disabled={nameForm.formState.isSubmitting}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
            {nameErrors.full_name && (
              <p className="text-xs text-destructive">{nameErrors.full_name.message ?? ''}</p>
            )}
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
              <Label>Confirm New Password</Label>
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
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
