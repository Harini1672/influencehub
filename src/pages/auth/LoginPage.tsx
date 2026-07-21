import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    setLoading(false)

    if (error) {
      // Supabase returns 400 for wrong credentials OR unconfirmed email.
      // Give the user an actionable message for the latter.
      const msg = error.message?.toLowerCase() ?? ''
      const description = msg.includes('email not confirmed')
        ? 'Please confirm your email address before signing in. Check your inbox for the confirmation link.'
        : msg.includes('invalid login') || msg.includes('invalid credentials')
        ? 'Incorrect email or password.'
        : error.message || 'Sign in failed. Please try again.'

      toast({ title: 'Login failed', description, variant: 'destructive' })
      return
    }

    // signIn() triggers onAuthStateChange which loads the profile asynchronously.
    // Query the profile directly after sign-in to get the role for navigation.
    toast({ title: 'Welcome back!' })

    const { data: { user: authedUser } } = await supabase.auth.getUser()
    if (authedUser) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileRow } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', authedUser.id)
        .single()

      const role = profileRow?.role ?? 'influencer'
      navigate(role === 'brand' ? '/brand/dashboard' : '/influencer/dashboard')
    } else {
      navigate('/influencer/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">InfluenceHub</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-violet-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-violet-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
