import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Users, Briefcase, User, Settings, LogOut,
  Zap, Bell, TrendingUp, FileText, Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const influencerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/influencer/dashboard' },
  { label: 'Requests', icon: Bell, to: '/influencer/requests' },
  { label: 'Campaigns', icon: Briefcase, to: '/influencer/campaigns' },
  { label: 'Profile', icon: User, to: '/influencer/profile' },
  { label: 'Settings', icon: Settings, to: '/influencer/settings' },
]

const brandNav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/brand/dashboard' },
  { label: 'Browse', icon: Search, to: '/brand/browse' },
  { label: 'Campaigns', icon: FileText, to: '/brand/campaigns' },
  { label: 'Analytics', icon: TrendingUp, to: '/brand/analytics' },
  { label: 'Settings', icon: Settings, to: '/brand/settings' },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = profile?.role === 'brand' ? brandNav : influencerNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4 border-b">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-md">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg gradient-text">InfluenceHub</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* User */}
      <div className="p-3">
        <div className={cn(
          'flex items-center gap-3 rounded-xl p-2',
          collapsed ? 'justify-center' : ''
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(profile?.full_name ?? 'U')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            'mt-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors',
            collapsed ? 'w-full justify-center px-0' : 'w-full justify-start'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-2">Sign out</span>}
        </Button>
      </div>
    </motion.aside>
  )
}
