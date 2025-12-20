import { useState, useRef, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { submitPrompt } from '@/lib/services/prompts'
import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import { useToast } from '@/contexts/ToastContext'
import { sanitizeForStorage } from '@/lib/utils'
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
  X,
} from 'lucide-react'

const CATEGORIES = [
  'Portraits',
  'Anime',
  'Logos',
  'UI/UX',
  'Cinematic',
  '3D Art',
  'Photography',
  'Illustrations',
  'Other',
]

export default function SubmitPromptPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    negative_prompt: '',
    category: '',
    tags: '',
    preview_image_url: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Show auth required modal if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setShowAuthRequiredModal(true)
    }
  }, [isLoaded, isSignedIn])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleGoToAuth = () => {
    navigate('/auth', { replace: true, state: { from: '/submit' } })
  }

  // URL validation function
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true // Empty URL is valid (optional field)
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate URL if it's the preview_image_url field
    if (name === 'preview_image_url' && value.trim() && !isValidUrl(value)) {
      setError('Please enter a valid URL (must start with http:// or https://)')
    } else {
      setError(null)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    // Retry function for network errors
    const uploadWithRetry = async (retries = 2): Promise<void> => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseReady()) {
          throw new Error('Supabase is not configured. Please check your environment variables.')
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `user-submissions/${fileName}`

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (uploadError) {
          console.error('Upload error details:', uploadError)
          throw uploadError
        }

        if (!uploadData) {
          throw new Error('Upload failed: No data returned')
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from('prompt-images').getPublicUrl(filePath)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get image URL')
        }

        setFormData((prev) => ({ ...prev, preview_image_url: urlData.publicUrl }))
        toast.success('Image uploaded successfully')
      } catch (err: any) {
        const errorMessage = err?.message || err?.error || 'Unknown error'

        // Check if it's a network error that can be retried
        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Failed to fetch') ||
          (err?.status >= 500 && err?.status < 600)

        if (isNetworkError && retries > 0) {
          // Wait before retrying (exponential backoff)
          const delay = (3 - retries) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return uploadWithRetry(retries - 1)
        }

        // If not retryable or out of retries, throw the error
        throw err
      }
    }

    try {
      await uploadWithRetry()
    } catch (err: any) {
      console.error('Error uploading image:', err)

      // Provide more specific error messages
      const errorMessage = err?.message || err?.error || 'Unknown error'

      if (errorMessage.includes('Invalid Compact JWS') || errorMessage.includes('JWT')) {
        setError('Configuration error: Invalid Supabase API key. Please check your VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY in the .env file.')
      } else if (errorMessage.includes('new row violates row-level security') || errorMessage.includes('RLS')) {
        setError('Upload permission denied. Please try again or use a URL instead.')
      } else if (errorMessage.includes('The resource already exists') || errorMessage.includes('duplicate')) {
        setError('An image with this name already exists. Please try again.')
      } else if (errorMessage.includes('Supabase is not configured')) {
        setError(errorMessage)
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        setError('Network error: Unable to upload image. Please check your connection and try again, or use a URL instead.')
      } else {
        setError(`Upload failed: ${errorMessage}. Please try again or use a URL instead.`)
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!isSignedIn || !user) {
      setError('You must be signed in to submit a prompt')
      return
    }

    const trimmedTitle = formData.title.trim()
    const trimmedPrompt = formData.prompt.trim()
    const trimmedCategory = formData.category.trim()

    if (!trimmedTitle || !trimmedPrompt || !trimmedCategory) {
      setError('Title, prompt, and category are required.')
      return
    }

    // Validate URL if provided
    if (formData.preview_image_url.trim() && !isValidUrl(formData.preview_image_url)) {
      setError('Please enter a valid image URL (must start with http:// or https://)')
      return
    }

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setIsSubmitting(true)

    try {
      await submitPrompt({
        title: sanitizeForStorage(trimmedTitle),
        prompt: sanitizeForStorage(trimmedPrompt),
        negative_prompt: formData.negative_prompt.trim() ? sanitizeForStorage(formData.negative_prompt.trim()) : null,
        category: sanitizeForStorage(trimmedCategory),
        tags: tagsArray.length ? tagsArray.map(tag => sanitizeForStorage(tag)) : null,
        preview_image_url: formData.preview_image_url.trim() || null, // URL doesn't need sanitization, validation is enough
        user_id: user.id,
      })

      setSuccess(true)
      toast.success('Prompt submitted successfully! It will be reviewed by our team before publishing.')

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Reset form after a delay
      timeoutRef.current = setTimeout(() => {
        setFormData({
          title: '',
          prompt: '',
          negative_prompt: '',
          category: '',
          tags: '',
          preview_image_url: '',
        })
        setSuccess(false)
        timeoutRef.current = null
      }, 3000)
    } catch (err) {
      console.error('Error submitting prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit prompt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingNavbar />
        <main className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <FloatingNavbar />

      {/* Auth Required Modal */}
      <AnimatePresence>
        {showAuthRequiredModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAuthRequiredModal(false)
                navigate('/')
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border-2 border-black/10 dark:border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-[#F8BE00]/10 via-[#F8BE00]/5 to-transparent border-b border-black/10 dark:border-white/10">
                  <button
                    onClick={() => {
                      setShowAuthRequiredModal(false)
                      navigate('/')
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#F8BE00]/20 mb-4 mx-auto">
                    <Lock className="w-8 h-8 text-[#F8BE00]" />
                  </div>
                  <h2 className="text-2xl font-black text-center text-black dark:text-white mb-2">
                    Sign In Required
                  </h2>
                  <p className="text-center text-muted-foreground text-sm">
                    To submit prompts, you need to create an account
                  </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#F8BE00]/10 rounded-lg shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#F8BE00]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black dark:text-white mb-1">
                          Join Our Community
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Sign up to submit your creative AI image prompts and share them with the community.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#F8BE00]/10 rounded-lg shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#F8BE00]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black dark:text-white mb-1">
                          Get Your Prompts Reviewed
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Our team will review your submissions and publish the best ones for everyone to use.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                    <Button
                      onClick={handleGoToAuth}
                      className="w-full bg-[#F8BE00] hover:bg-[#FFD700] text-black font-bold shadow-lg py-6 text-lg"
                    >
                      Sign Up / Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAuthRequiredModal(false)
                        navigate('/')
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Go Back Home
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Only show form if signed in */}
      {isSignedIn ? (
        <main className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F8BE00]/10 mb-4">
                <Sparkles className="w-8 h-8 text-[#F8BE00]" />
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-3">
                Submit Your Prompt
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Share your creative AI image prompts with the community. Your submission will be
                reviewed before being published.
              </p>
            </motion.div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    <strong>Prompt submitted successfully!</strong> Our team will review it and notify
                    you once it's approved.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Form Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-2 border-black/5 dark:border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-black">Prompt Details</CardTitle>
                  <CardDescription>
                    Fill in all the details about your AI image generation prompt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Cyberpunk City Streets at Night"
                          required
                          className="bg-transparent border-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 rounded-md border-2 border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">Select a category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prompt">
                        Prompt Text <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="prompt"
                        name="prompt"
                        value={formData.prompt}
                        onChange={handleInputChange}
                        placeholder="Describe your prompt in detail..."
                        required
                        rows={6}
                        className="w-full px-3 py-2 rounded-md border-2 border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific and detailed. Include style, composition, lighting, and other
                        important details.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="negative_prompt">Negative Prompt (Optional)</Label>
                      <textarea
                        id="negative_prompt"
                        name="negative_prompt"
                        value={formData.negative_prompt}
                        onChange={handleInputChange}
                        placeholder="Things to avoid (e.g., blurry, low quality, distorted)"
                        rows={3}
                        className="w-full px-3 py-2 rounded-md border-2 border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (Optional)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="cyberpunk, neon, night, futuristic (comma separated)"
                        className="bg-transparent border-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preview_image_url">Preview Image (Optional)</Label>
                      <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              fileInputRef.current?.click()
                            }
                          }}
                          aria-label="Upload preview image"
                          className="w-32 h-32 rounded-lg border-2 border-dashed border-input flex items-center justify-center cursor-pointer hover:border-[#F8BE00] transition-colors overflow-hidden relative group shrink-0"
                        >
                          {formData.preview_image_url ? (
                            <>
                              <img
                                src={formData.preview_image_url}
                                alt="Preview"
                                width="128"
                                height="128"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon className="w-6 h-6 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                              {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 mb-1" />
                                  <span className="text-xs">Upload</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            id="preview_image_url"
                            name="preview_image_url"
                            type="url"
                            value={formData.preview_image_url}
                            onChange={handleInputChange}
                            placeholder="Or paste image URL..."
                            className="bg-transparent border-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Upload an image or paste a direct URL. Max size: 5MB
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            aria-label="Select image file to upload"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/explore')}
                        disabled={isSubmitting}
                        aria-label="Cancel and go back to explore page"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="bg-[#F8BE00] hover:bg-[#FFD700] text-black font-bold shadow-lg"
                        aria-label={isSubmitting ? "Submitting prompt" : "Submit prompt for review"}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit for Review
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 p-6 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10"
            >
              <h3 className="font-bold text-lg mb-3">Review Process</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F8BE00] mt-0.5 shrink-0" />
                  <span>Your prompt will be reviewed within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F8BE00] mt-0.5 shrink-0" />
                  <span>You'll be notified via email when your prompt is approved or rejected</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F8BE00] mt-0.5 shrink-0" />
                  <span>Only high-quality, original prompts will be published</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </main>
      ) : (
        <main className="flex items-center justify-center min-h-screen pt-20 pb-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Please sign in to continue...</p>
          </div>
        </main>
      )}
      <Footer />
    </div>
  )
}

