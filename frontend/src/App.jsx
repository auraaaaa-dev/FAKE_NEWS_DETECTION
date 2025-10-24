import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import ClaimDetail from '@/pages/ClaimDetail'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { FileText, BarChart3 } from 'lucide-react'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <div className="min-h-screen bg-background">
          {/* Navigation */}
          <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                  <Link to="/" className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <span className="text-xl font-bold">Fake News Detection</span>
                  </Link>
                  <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" asChild>
                      <Link to="/">Submit Claim</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/claim/:id" element={<ClaimDetail />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  © 2025 Fake News Detection System. Built with React, Node.js, and NLP.
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Powered by Advanced NLP</span>
                  <span>•</span>
                  <span>Real-time Analysis</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
