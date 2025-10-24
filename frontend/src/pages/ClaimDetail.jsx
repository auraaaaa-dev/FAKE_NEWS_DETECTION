import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { claimsAPI } from '@/services/api'
import { CheckCircle, XCircle, AlertCircle, Flag, ArrowLeft } from 'lucide-react'

export default function ClaimDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const res = await claimsAPI.getClaimById(id)
        setClaim(res.claim)
      } catch (error) {
        console.error('Error fetching claim:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClaim()
  }, [id])

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

  const handleFlag = async () => {
    try {
      await claimsAPI.flagClaim(id, { notes: 'Manually reviewed', flaggedBy: 'Admin' })
      const updated = await claimsAPI.getClaimById(id)
      setClaim(updated.claim)
    } catch (error) {
      console.error('Error flagging claim:', error)
    }
  }

  const handleUnflag = async () => {
    try {
      await claimsAPI.unflagClaim(id)
      const updated = await claimsAPI.getClaimById(id)
      setClaim(updated.claim)
    } catch (error) {
      console.error('Error unflagging claim:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading claim details...</div>
  }

  if (!claim) {
    return <div className="text-center py-8 text-destructive">Claim not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Claim Details</CardTitle>
          <CardDescription>View NLP analysis and manual flagging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Verdict:</span>
            {getVerdictBadge(claim.verdict)}
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Confidence:</span>
            <span>{Math.round(claim.confidence * 100)}%</span>
          </div>
          {claim.text && (
            <div>
              <span className="font-medium block mb-2">Text Content:</span>
              <p className="text-sm bg-muted p-3 rounded-md">{claim.text}</p>
            </div>
          )}
          {claim.link && (
            <div>
              <span className="font-medium block mb-2">Source Link:</span>
              <a href={claim.link} target="_blank" className="text-primary hover:underline">{claim.link}</a>
            </div>
          )}
          {claim.nlpAnalysis && (
            <div>
              <span className="font-medium block mb-2">Analysis:</span>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-2">
                <p>{claim.nlpAnalysis.reason}</p>
                {claim.nlpAnalysis.fakeIndicators?.length > 0 && (
                  <p><strong>Fake indicators:</strong> {claim.nlpAnalysis.fakeIndicators.join(', ')}</p>
                )}
                {claim.nlpAnalysis.realIndicators?.length > 0 && (
                  <p><strong>Real indicators:</strong> {claim.nlpAnalysis.realIndicators.join(', ')}</p>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Created: {new Date(claim.createdAt).toLocaleString()}
            </div>
            {claim.isFlagged ? (
              <Button variant="destructive" size="sm" onClick={handleUnflag}>
                <Flag className="h-4 w-4 mr-1" /> Unflag
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleFlag}>
                <Flag className="h-4 w-4 mr-1" /> Flag
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
