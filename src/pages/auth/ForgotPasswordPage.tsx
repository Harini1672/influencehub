import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await forgotPassword(data.email)
    setLoading(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">InfluenceHub</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>
              {sent
                ? 'Check your email for a reset link.'
                : "Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  If that email is registered, you'll receive a reset link shortly.
                </p>
                <Button asChild variant="gradient" className="w-full">
                  <Link to="/login">Back to login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" variant="gradient" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
