import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: { value: number; label: string }
  color?: 'violet' | 'blue' | 'emerald' | 'amber' | 'red'
  delay?: number
}

const colorMap = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'bg-violet-600 text-white',
    text: 'text-violet-600',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-600 text-white',
    text: 'text-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-600 text-white',
    text: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-500 text-white',
    text: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-500 text-white',
    text: 'text-red-600',
  },
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'violet',
  delay = 0,
}: StatCardProps) {
  const colors = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm', colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  )
}
