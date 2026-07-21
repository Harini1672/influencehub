import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/shared/SkeletonCard'

export function AuthCallback() {
  const { profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'brand') navigate('/brand/dashboard', { replace: true })
      else navigate('/influencer/dashboard', { replace: true })
    }
  }, [loading, profile, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  )
}
