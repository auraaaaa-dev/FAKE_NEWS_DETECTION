import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { claimsAPI, statsAPI } from '@/services/api'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Flag, 
  ExternalLink,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

export default function Dashboard() {
  const [claims, setClaims] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [claimsResponse, statsResponse] = await Promise.all([
        claimsAPI.getAllClaims(),
        statsAPI.getStats()
      ])
      setClaims(claimsResponse.claims)
      setStats(statsResponse.stats)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'real':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Real</Badge>
      case 'fake':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Fake</Badge>
      default:
        return <Badge variant="secondary" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Unverified</Badge>
    }
  }

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.link?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'flagged' && claim.isFlagged) ||
                         (filter === 'fake' && claim.verdict === 'fake') ||
                         (filter === 'real' && claim.verdict === 'real') ||
                         (filter === 'unverified' && claim.verdict === 'unverified')
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'real' ? 'default' : 'outline'} onClick={() => setFilter('real')}>Real</Button>
          <Button variant={filter === 'fake' ? 'default' : 'outline'} onClick={() => setFilter('fake')}>Fake</Button>
          <Button variant={filter === 'flagged' ? 'default' : 'outline'} onClick={() => setFilter('flagged')}>Flagged</Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card><CardContent className="p-4"><p>Total</p><h3 className="text-2xl font-bold">{stats.total}</h3></CardContent></Card>
          <Card><CardContent className="p-4 text-green-600"><p>Real</p><h3 className="text-2xl font-bold">{stats.real}</h3></CardContent></Card>
          <Card><CardContent className="p-4 text-red-600"><p>Fake</p><h3 className="text-2xl font-bold">{stats.fake}</h3></CardContent></Card>
          <Card><CardContent className="p-4 text-yellow-600"><p>Unverified</p><h3 className="text-2xl font-bold">{stats.unverified}</h3></CardContent></Card>
          <Card><CardContent className="p-4 text-orange-600"><p>Flagged</p><h3 className="text-2xl font-bold">{stats.flagged}</h3></CardContent></Card>
        </div>
      )}

      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No claims found</CardContent></Card>
        ) : (
          filteredClaims.map(claim => (
            <Card key={claim.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link to={`/claim/${claim.id}`} className="font-semibold hover:underline">
                      {claim.text ? (claim.text.length > 100 ? `${claim.text.slice(0, 100)}...` : claim.text) : 'Media Claim'}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      {getVerdictBadge(claim.verdict)}
                      {claim.isFlagged && <Badge variant="warning" className="flex items-center gap-1"><Flag className="h-3 w-3" />Flagged</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(claim.createdAt).toLocaleString()}</p>
                </div>

                {claim.link && (
                  <a href={claim.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> {claim.link}
                  </a>
                )}

                {claim.nlpAnalysis?.reason && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Analysis:</strong> {claim.nlpAnalysis.reason}
                  </p>
                )}

                <Separator />
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> {new Date(claim.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
