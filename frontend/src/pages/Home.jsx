import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { claimsAPI } from '@/services/api'
import { FileText, Link, Image, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function Home() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setResult(null)

    try {
      const formData = {
        text: data.text,
        link: data.link,
        media: selectedFile,
        mediaType: selectedFile?.type || ''
      }

      const response = await claimsAPI.createClaim(formData)
      setResult(response.claim)
      reset()
      setSelectedFile(null)
    } catch (error) {
      console.error('Error submitting claim:', error)
      setResult({ error: 'Failed to submit claim. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Fake News Detection System</h1>
          <p className="text-lg text-muted-foreground">
            Submit text, links, or media to analyze for fake news using advanced NLP techniques
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit a Claim</CardTitle>
              <CardDescription>
                Choose how you'd like to submit content for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="link" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Link
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Media
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text">Text Content</Label>
                      <Textarea
                        id="text"
                        placeholder="Enter the text content you want to analyze..."
                        className="min-h-[200px]"
                        {...register('text', { required: 'Text content is required' })}
                      />
                      {errors.text && (
                        <p className="text-sm text-destructive">{errors.text.message}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="link">URL</Label>
                      <Input
                        id="link"
                        type="url"
                        placeholder="https://example.com/article"
                        {...register('link', { 
                          required: 'URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL'
                          }
                        })}
                      />
                      {errors.link && (
                        <p className="text-sm text-destructive">{errors.link.message}</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="media">Media File</Label>
                      <Input
                        id="media"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-muted-foreground">
                        Supported formats: Images (JPG, PNG, GIF) and Videos (MP4, AVI, MOV)
                      </p>
                    </div>
                  </TabsContent>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Content'
                    )}
                  </Button>
                </form>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                View the NLP analysis results for your submitted content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                result.error ? (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive">{result.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Verdict:</span>
                      {getVerdictBadge(result.verdict)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confidence:</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>

                    {result.text && (
                      <div>
                        <span className="font-medium block mb-2">Content:</span>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {result.text.length > 200 
                            ? `${result.text.substring(0, 200)}...` 
                            : result.text
                          }
                        </p>
                      </div>
                    )}

                    {result.link && (
                      <div>
                        <span className="font-medium block mb-2">Source:</span>
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {result.link}
                        </a>
                      </div>
                    )}

                    {result.nlpAnalysis && (
                      <div>
                        <span className="font-medium block mb-2">Analysis Details:</span>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          <p>{result.nlpAnalysis.reason}</p>
                          {result.nlpAnalysis.fakeIndicators?.length > 0 && (
                            <p className="mt-2">
                              <strong>Fake indicators:</strong> {result.nlpAnalysis.fakeIndicators.join(', ')}
                            </p>
                          )}
                          {result.nlpAnalysis.realIndicators?.length > 0 && (
                            <p className="mt-2">
                              <strong>Real indicators:</strong> {result.nlpAnalysis.realIndicators.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Analysis completed at {new Date(result.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Submit content above to see analysis results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
