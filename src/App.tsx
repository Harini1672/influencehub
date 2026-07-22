import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AuthCallback } from '@/components/auth/AuthCallback'
import { InstagramCallback } from '@/components/auth/InstagramCallback'
import { Skeleton } from '@/components/shared/SkeletonCard'
import { useSeedDemoData } from '@/hooks/useSeedDemoData'

// Pages — lazy loaded
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

// Influencer
const InfluencerDashboard = lazy(() => import('@/pages/influencer/InfluencerDashboard').then(m => ({ default: m.InfluencerDashboard })))
const InfluencerRequests = lazy(() => import('@/pages/influencer/InfluencerRequests').then(m => ({ default: m.InfluencerRequests })))
const InfluencerCampaigns = lazy(() => import('@/pages/influencer/InfluencerCampaigns').then(m => ({ default: m.InfluencerCampaigns })))
const InfluencerProfile = lazy(() => import('@/pages/influencer/InfluencerProfile').then(m => ({ default: m.InfluencerProfile })))
const InfluencerSettings = lazy(() => import('@/pages/influencer/InfluencerSettings').then(m => ({ default: m.InfluencerSettings })))
const PublicInfluencerProfile = lazy(() => import('@/pages/influencer/PublicInfluencerProfile').then(m => ({ default: m.PublicInfluencerProfile })))

// Brand
const BrandDashboard = lazy(() => import('@/pages/brand/BrandDashboard').then(m => ({ default: m.BrandDashboard })))
const BrowseInfluencers = lazy(() => import('@/pages/brand/BrowseInfluencers').then(m => ({ default: m.BrowseInfluencers })))
const BrandCampaigns = lazy(() => import('@/pages/brand/BrandCampaigns').then(m => ({ default: m.BrandCampaigns })))
const BrandAnalytics = lazy(() => import('@/pages/brand/BrandAnalytics').then(m => ({ default: m.BrandAnalytics })))
const BrandSettings = lazy(() => import('@/pages/brand/BrandSettings').then(m => ({ default: m.BrandSettings })))
const CampaignPerformancePredictor = lazy(() => import('@/pages/brand/CampaignPerformancePredictor').then(m => ({ default: m.CampaignPerformancePredictor })))

// Shared
const CampaignDetail = lazy(() => import('@/pages/campaigns/CampaignDetail').then(m => ({ default: m.CampaignDetail })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-3 w-48">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

/**
 * AppBootstrap — mounts inside QueryClientProvider + AuthProvider so it has
 * access to both React Query and the Supabase client. Fires the demo seed
 * once on first launch (idempotent — localStorage + DB guard prevent re-runs).
 * Renders children immediately; seeding is fully background / non-blocking.
 */
function AppBootstrap({ children }: { children: React.ReactNode }) {
  useSeedDemoData()
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppBootstrap>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <LandingPage />
                  </PublicLayout>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/instagram/callback" element={<InstagramCallback />} />
              <Route
                path="/influencer/:id"
                element={
                  <PublicLayout>
                    <PublicInfluencerProfile />
                  </PublicLayout>
                }
              />

              {/* Influencer routes */}
              <Route
                path="/influencer"
                element={
                  <ProtectedRoute requiredRole="influencer">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/influencer/dashboard" replace />} />
                <Route path="dashboard" element={<InfluencerDashboard />} />
                <Route path="requests" element={<InfluencerRequests />} />
                <Route path="campaigns" element={<InfluencerCampaigns />} />
                <Route path="campaigns/:id" element={<CampaignDetail />} />
                <Route path="profile" element={<InfluencerProfile />} />
                <Route path="settings" element={<InfluencerSettings />} />
              </Route>

              {/* Brand routes */}
              <Route
                path="/brand"
                element={
                  <ProtectedRoute requiredRole="brand">
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/brand/dashboard" replace />} />
                <Route path="dashboard" element={<BrandDashboard />} />
                <Route path="browse" element={<BrowseInfluencers />} />
                <Route path="campaigns" element={<BrandCampaigns />} />
                <Route path="campaigns/:id" element={<CampaignDetail />} />
                <Route path="analytics" element={<BrandAnalytics />} />
                <Route path="settings" element={<BrandSettings />} />
                <Route path="predictor" element={<CampaignPerformancePredictor />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
            <Toaster />
          </AppBootstrap>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
