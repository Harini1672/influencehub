import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, ArrowLeft, Building2, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['influencer', 'brand']),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'influencer' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await signUp(data.email, data.password, data.fullName, data.role as UserRole)
    setLoading(false)

    if (error) {
      toast({
        title: 'Signup failed',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <Card>
            <CardContent className="p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                <Zap className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a confirmation link to your email. Click it to activate your account and get started.
              </p>
              <Button asChild variant="gradient" className="w-full">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
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
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Join thousands of brands and influencers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Role selector */}
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'influencer')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      selectedRole === 'influencer'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-border hover:border-violet-300'
                    )}
                  >
                    <Star className={cn('h-6 w-6', selectedRole === 'influencer' ? 'text-violet-600' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">Influencer</span>
                    <span className="text-xs text-muted-foreground text-center">I create content</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('role', 'brand')}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                      selectedRole === 'brand'
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-border hover:border-violet-300'
                    )}
                  >
                    <Building2 className={cn('h-6 w-6', selectedRole === 'brand' ? 'text-violet-600' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">Brand</span>
                    <span className="text-xs text-muted-foreground text-center">I run campaigns</span>
                  </button>
                </div>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our{' '}
                <a href="#" className="underline">Terms of Service</a> and{' '}
                <a href="#" className="underline">Privacy Policy</a>.
              </p>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-violet-600 hover:underline font-medium">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
