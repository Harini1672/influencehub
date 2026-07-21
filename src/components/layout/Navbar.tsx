import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Bell, LogOut, User, Settings, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { NotificationPanel } from '@/components/shared/NotificationPanel'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { unreadCount } = useNotifications(user?.id)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const dashboardPath = profile?.role === 'brand' ? '/brand/dashboard' : '/influencer/dashboard'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-md">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text">InfluenceHub</span>
        </Link>

        {/* Desktop nav */}
        {!user && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
          </nav>
        )}

        {/* Auth nav */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                {notifOpen && (
                  <NotificationPanel onClose={() => setNotifOpen(false)} />
                )}
              </div>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(profile?.full_name ?? 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {profile?.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <Badge variant="secondary" className="w-fit text-xs capitalize mt-1">
                        {profile?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={dashboardPath} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={profile?.role === 'brand' ? '/brand/settings' : '/influencer/settings'}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="gradient">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && !user && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t bg-background px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimonials</a>
            <a href="#about" onClick={() => setMobileOpen(false)}>About</a>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Sign in</Link>
          </nav>
        </motion.div>
      )}
    </header>
  )
}
