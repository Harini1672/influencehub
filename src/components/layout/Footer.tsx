import { Link } from 'react-router-dom'
import { Zap, Twitter, Linkedin, Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="gradient-text">InfluenceHub</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              The premier platform connecting brands with the right influencers to amplify campaigns and drive real results.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-violet-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} InfluenceHub. All rights reserved.</p>
          <p>Built with ❤️ for creators and brands</p>
        </div>
      </div>
    </footer>
  )
}
