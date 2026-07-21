import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, ArrowRight, Star, Users, TrendingUp, BarChart3,
  Shield, Bell, Search, CheckCircle, Globe, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const features = [
  {
    icon: Search,
    title: 'Smart Discovery',
    description: 'Filter influencers by platform, niche, followers, engagement rate, and location to find the perfect match.',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description: 'Track your campaign performance in real-time with detailed analytics and progress timelines.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Bell,
    title: 'Real-time Updates',
    description: 'Get instant notifications when requests are accepted, campaigns progress, or new messages arrive.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: Shield,
    title: 'Secure Collaboration',
    description: 'Row-level security ensures your data is always private and only accessible to authorized parties.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Globe,
    title: 'Multi-Platform',
    description: 'Manage influencers across Instagram, YouTube, TikTok, and more from one unified dashboard.',
    color: 'text-pink-600 bg-pink-50',
  },
  {
    icon: Sparkles,
    title: 'Campaign Lifecycle',
    description: 'From request to completion — manage the full campaign lifecycle with built-in status tracking.',
    color: 'text-indigo-600 bg-indigo-50',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Marketing Director at TechCorp',
    avatar: 'SC',
    rating: 5,
    text: 'InfluenceHub completely transformed how we run influencer campaigns. We found 3x better-matched creators in half the time.',
  },
  {
    name: 'Marcus Rivera',
    role: 'Lifestyle Influencer, 2.1M followers',
    avatar: 'MR',
    rating: 5,
    text: 'Finally a platform that treats influencers as partners. The collaboration tools and real-time communication are exceptional.',
  },
  {
    name: 'Emily Zhang',
    role: 'Brand Manager at FashionCo',
    avatar: 'EZ',
    rating: 5,
    text: 'The campaign management dashboard is a game-changer. We can see exactly where every campaign stands at any moment.',
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'Perfect for small brands just starting with influencer marketing.',
    features: ['Up to 5 active campaigns', '50 influencer searches/month', 'Basic analytics', 'Email support'],
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/month',
    description: 'For growing brands serious about influencer marketing.',
    features: ['Unlimited campaigns', 'Unlimited searches', 'Advanced analytics', 'Priority support', 'Real-time notifications', 'Campaign notes'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$499',
    period: '/month',
    description: 'For large brands with complex influencer marketing needs.',
    features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'White-label options', 'API access'],
    popular: false,
  },
]

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_70%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Badge className="mb-6 py-1.5 px-4 text-sm" variant="secondary">
              <Zap className="h-3.5 w-3.5 mr-1.5 text-violet-600" />
              The #1 Influencer Marketing Platform
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Connect Brands with{' '}
              <span className="gradient-text">Authentic Influencers</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              InfluenceHub brings brands and creators together on one powerful platform. Discover, collaborate, and track campaigns — all in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" variant="gradient" className="group">
                <Link to="/signup">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Free to join as influencer
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Setup in minutes
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {[
              { label: 'Active Influencers', value: '50K+', icon: Users },
              { label: 'Brands Joined', value: '5K+', icon: Globe },
              { label: 'Campaigns Launched', value: '200K+', icon: BarChart3 },
              { label: 'Success Rate', value: '94%', icon: TrendingUp },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-2xl bg-background/80 border shadow-sm">
                <stat.icon className="h-5 w-5 text-violet-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{' '}
              <span className="gradient-text">scale your campaigns</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete toolkit for brands and influencers to collaborate efficiently and track results in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.color} mb-4`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="about" className="py-24 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/10 dark:to-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Launch in 3 simple steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up as a brand or influencer. Set up your profile with all relevant details in minutes.' },
              { step: '02', title: 'Connect & collaborate', desc: 'Brands discover and send collaboration requests. Influencers review and accept campaigns that fit their niche.' },
              { step: '03', title: 'Track & complete', desc: 'Manage campaigns with real-time status updates, internal notes, and completion tracking.' },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white font-bold text-xl mb-4 shadow-lg shadow-violet-500/25">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by brands &{' '}
              <span className="gradient-text">influencers</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/10 dark:to-purple-950/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground">Influencers always join for free. Brands choose a plan.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="px-3 py-1">Most Popular</Badge>
                  </div>
                )}
                <Card className={`h-full ${plan.popular ? 'border-violet-500 shadow-lg shadow-violet-500/10' : ''}`}>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 my-3">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={plan.popular ? 'gradient' : 'outline'}
                      className="w-full"
                    >
                      <Link to="/signup">Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-violet-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to grow your reach?
            </h2>
            <p className="text-violet-100 mb-8 text-lg max-w-xl mx-auto">
              Join thousands of brands and influencers already using InfluenceHub to run successful campaigns.
            </p>
            <Button asChild size="xl" className="bg-white text-violet-700 hover:bg-violet-50">
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
