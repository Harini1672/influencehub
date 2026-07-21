import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, IndianRupee, ArrowRight } from 'lucide-react'
import type { Campaign } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CampaignCardProps {
  campaign: Campaign
  linkBase?: string
  delay?: number
}

export function CampaignCard({ campaign, linkBase = '', delay = 0 }: CampaignCardProps) {
  const daysLeft = getDaysUntil(campaign.deadline)
  const isOverdue = daysLeft < 0
  const isUrgent = daysLeft >= 0 && daysLeft <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="card-hover h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{campaign.title}</h3>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.brands?.company_name && (
            <p className="text-sm text-muted-foreground">{campaign.brands.company_name}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="font-semibold text-sm">{formatCurrency(campaign.budget)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                isOverdue ? 'bg-red-50 dark:bg-red-900/20' :
                isUrgent ? 'bg-amber-50 dark:bg-amber-900/20' :
                'bg-blue-50 dark:bg-blue-900/20'
              )}>
                <Calendar className={cn(
                  'h-4 w-4',
                  isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-blue-600'
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className={cn(
                  'font-semibold text-sm',
                  isOverdue && 'text-red-600',
                  isUrgent && !isOverdue && 'text-amber-600'
                )}>
                  {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{formatDate(campaign.deadline)}</p>

          <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
            <Link to={`${linkBase}/campaigns/${campaign.id}`}>
              View Details <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
