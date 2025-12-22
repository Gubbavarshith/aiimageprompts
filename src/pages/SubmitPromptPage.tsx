import { useState, useRef, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { submitPrompt } from '@/lib/services/prompts'
import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import { useToast } from '@/contexts/ToastContext'
import { sanitizeForStorage } from '@/lib/utils'
import { fetchUniqueCategories } from '@/lib/services/categories'
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
  X,
  Eye,
  Info,
  Bookmark,
  Copy,
  Share2,
  ExternalLink,
  Heart
} from 'lucide-react'

export default function SubmitPromptPage() {
  const { isSignedIn, isLoaded } = useAuth()
  // TEMP: Bypass auth visual check if needed, but keeping logic consistent
  // const isSignedInMock = true 
  const { user } = useUser()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Form State ---
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    negative_prompt: '',
    category: '',
    customCategory: '',
    tags: '',
    preview_image_url: '',
  })
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // --- Effects ---

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

  // Set page title
  useEffect(() => {
    document.title = 'Submit Prompt – AI Image Prompts'
  }, [])

  // Load dynamic categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const fetchedCategories = await fetchUniqueCategories()
        // Add "Other" as the last option
        setCategories([...fetchedCategories, 'Other'])
      } catch (err) {
        console.error('Failed to load categories:', err)
        // Fallback to default categories with "Other"
        setCategories([
          'Portraits',
          'Anime',
          'Logos',
          'UI/UX',
          'Cinematic',
          '3D Art',
          'Photography',
          'Illustrations',
          'Other',
        ])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // --- Handlers ---

  const handleGoToAuth = () => {
    navigate('/auth', { replace: true, state: { from: '/submit' } })
  }

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true
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

    // Clear custom category if user switches away from "Other"
    if (name === 'category' && value !== 'Other') {
      setFormData((prev) => ({ ...prev, [name]: value, customCategory: '' }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

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

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('This image is too large. Maximum supported size is 5 MB.')
      return
    }

    setIsUploading(true)
    setError(null)

    const uploadWithRetry = async (retries = 2): Promise<void> => {
      try {
        if (!isSupabaseReady()) {
          throw new Error('Supabase is not configured.')
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `user-submissions/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prompt-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (uploadError) throw uploadError
        if (!uploadData) throw new Error('Upload failed: No data returned')

        const { data: urlData } = supabase.storage.from('prompt-images').getPublicUrl(filePath)
        if (!urlData?.publicUrl) throw new Error('Failed to get image URL')

        setFormData((prev) => ({ ...prev, preview_image_url: urlData.publicUrl }))
        toast.success('Image uploaded successfully')
      } catch (err: any) {
        const errorMessage = err?.message || err?.error || 'Unknown error'
        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Failed to fetch') ||
          (err?.status >= 500 && err?.status < 600)

        if (isNetworkError && retries > 0) {
          const delay = (3 - retries) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          return uploadWithRetry(retries - 1)
        }
        throw err
      }
    }

    try {
      await uploadWithRetry()
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(`Upload failed. Please use a direct URL instead or try again.`)
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
    const trimmedCustomCategory = formData.customCategory.trim()

    if (!trimmedTitle || !trimmedPrompt || !trimmedCategory) {
      setError('Title, prompt, and category are required.')
      return
    }

    if (trimmedCategory === 'Other' && !trimmedCustomCategory) {
      setError('Please enter a custom category name.')
      return
    }

    if (formData.preview_image_url.trim() && !isValidUrl(formData.preview_image_url)) {
      setError('Please enter a valid image URL.')
      return
    }

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    setIsSubmitting(true)

    try {
      const finalCategory = trimmedCategory === 'Other'
        ? sanitizeForStorage(trimmedCustomCategory)
        : sanitizeForStorage(trimmedCategory)

      await submitPrompt({
        title: sanitizeForStorage(trimmedTitle),
        prompt: sanitizeForStorage(trimmedPrompt),
        negative_prompt: formData.negative_prompt.trim() ? sanitizeForStorage(formData.negative_prompt.trim()) : null,
        category: finalCategory,
        tags: tagsArray.length ? tagsArray.map(tag => sanitizeForStorage(tag)) : null,
        preview_image_url: formData.preview_image_url.trim() || null,
        user_id: user.id,
      })

      setSuccess(true)
      toast.success('Prompt submitted successfully!')

      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      timeoutRef.current = setTimeout(() => {
        setFormData({
          title: '',
          prompt: '',
          negative_prompt: '',
          category: '',
          customCategory: '',
          tags: '',
          preview_image_url: '',
        })
        setSuccess(false)
        timeoutRef.current = null
      }, 3000)
    } catch (err) {
      console.error('Error submitting prompt:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit prompt.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Tags Helper ---
  const getTagsArray = () => {
    return formData.tags.split(',').map(t => t.trim()).filter(Boolean)
  }

  // --- Rendering Helpers ---

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <FloatingNavbar />
        <main className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </main>
        <Footer />
      </div>
    )
  }

  // For visual testing we assume true if local dev, but respect actual auth in production logic above
  // The user asked to just make changes, so I will rely on real auth state rendering.
  // Unless user specifically asked to bypass auth again? They didn't. 
  // However, earlier I mocked it. Let's stick to real auth but if the user can't see it they will complain.
  // Actually, I'll keep the mock commented out as in my previous snippet but uncommented for now to ensure they see the changes if they are not logged in.
  // Wait, I should probably respect `isSignedIn`. The user is likely signed in or can sign in.
  // I will use `isSignedIn` normally.

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 selection:bg-[#FFDE1A] selection:text-black">
      <FloatingNavbar />

      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthRequiredModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowAuthRequiredModal(false)
                navigate('/')
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowAuthRequiredModal(false)
                  navigate('/')
                }}
                className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#FFDE1A] flex items-center justify-center border-2 border-black">
                  <Lock className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Access Restricted</h2>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-sm">
                  Join our community of creators to submit prompts, save favorites, and share your art.
                </p>
                <div className="grid w-full gap-3 pt-4">
                  <Button
                    onClick={handleGoToAuth}
                    className="w-full text-lg h-14 bg-[#FFDE1A] text-black border-2 border-black hover:bg-[#FFDE1A]/90 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Login / Sign Up <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 container mx-auto px-4 pt-28 pb-20">

        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold uppercase tracking-widest border border-black dark:border-white bg-transparent">
              Contribute to the Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter mb-6">
              Submit Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFDE1A] via-[#FFDE1A] to-[#d6b700]">Masterpiece</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Share your best AI prompts with thousands of creators. High-quality submissions help everyone create better art.
            </p>
          </motion.div>
        </div>

        {/* Using actual auth check here. Only show if signed in. */}
        {isSignedIn ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left Col: Form */}
            <div className="lg:col-span-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {success && (
                  <Alert className="mb-8 border-2 border-green-500 bg-green-500/10 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <AlertDescription className="ml-2 font-medium">
                      Prompt submitted successfully! Pending review.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Title & Category Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                      <Label htmlFor="title" className="uppercase text-xs font-bold tracking-wider text-zinc-500">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Cyberpunk Noir City"
                        required
                        className="bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white focus:ring-0 rounded-lg h-12 text-lg font-medium transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="uppercase text-xs font-bold tracking-wider text-zinc-500">Category</Label>
                      <div className="relative">
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          disabled={isLoadingCategories}
                          className="w-full h-12 px-3 bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-lg text-base outline-none appearance-none cursor-pointer transition-colors"
                        >
                          <option value="" disabled>Select Category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat} className="bg-white dark:bg-black">{cat}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <span className="text-xs">▼</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.category === 'Other' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <Label htmlFor="customCategory" className="uppercase text-xs font-bold tracking-wider text-zinc-500">Custom Category</Label>
                      <Input
                        id="customCategory"
                        name="customCategory"
                        value={formData.customCategory}
                        onChange={handleInputChange}
                        placeholder="New Category Name"
                        required={formData.category === 'Other'}
                        className="bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-lg h-12"
                      />
                    </motion.div>
                  )}

                  {/* Main Inputs */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="uppercase text-xs font-bold tracking-wider text-zinc-500">
                      Prompt <span className="text-[#FFDE1A]">*</span>
                    </Label>
                    <textarea
                      id="prompt"
                      name="prompt"
                      value={formData.prompt}
                      onChange={handleInputChange}
                      placeholder="Describe your image in detail..."
                      required
                      rows={6}
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-lg text-base resize-y outline-none transition-all font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-zinc-500 text-right">
                      {formData.prompt.length} chars
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="negative_prompt" className="uppercase text-xs font-bold tracking-wider text-zinc-500">Negative Prompt</Label>
                    <textarea
                      id="negative_prompt"
                      name="negative_prompt"
                      value={formData.negative_prompt}
                      onChange={handleInputChange}
                      placeholder="e.g. blurry, bad anatomy, text, watermark"
                      rows={3}
                      className="w-full p-4 bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-red-400 rounded-lg text-base resize-y outline-none transition-all font-mono text-sm leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="uppercase text-xs font-bold tracking-wider text-zinc-500">Tags</Label>
                    <Input
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="comma, separated, tags"
                      className="bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-lg h-12 font-mono text-sm"
                    />
                  </div>

                  {/* Image Upload Area */}
                  <div className="space-y-2">
                    <Label className="uppercase text-xs font-bold tracking-wider text-zinc-500">Preview Image</Label>
                    <div className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#FFDE1A] dark:hover:border-[#FFDE1A] transition-colors rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center justify-center text-center gap-4">
                        {formData.preview_image_url ? (
                          <div className="relative w-full aspect-video md:aspect-auto md:h-64 bg-black/5 overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-md">
                            <img src={formData.preview_image_url} alt="Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white font-bold flex items-center gap-2"> <Upload className="w-4 h-4" /> Change Image</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                              {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-zinc-400" /> : <ImageIcon className="w-8 h-8 text-zinc-400 group-hover:text-[#FFDE1A] transition-colors" />}
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold">Click to upload or drag and drop</p>
                              <p className="text-xs text-zinc-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
                            </div>
                          </>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                      <span className="text-xs uppercase text-zinc-400 font-bold">OR</span>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
                    </div>
                    <Input
                      placeholder="Paste direct image URL..."
                      name="preview_image_url"
                      value={formData.preview_image_url}
                      onChange={handleInputChange}
                      className="mt-2 bg-transparent border-2 border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-lg h-12"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border-2 border-red-500 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/explore')}
                      className="h-14 px-8 border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white font-bold uppercase tracking-wide rounded-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="h-14 w-auto px-8 bg-[#FFDE1A] hover:bg-[#ffe135] text-black border-2 border-black font-black uppercase tracking-wide text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none transition-all rounded-lg"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'Submit for Review'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>

            {/* Right Col: Live Preview (Sticky) */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="sticky top-32 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="max-w-[340px] ml-auto"
                >
                  <div className="flex items-center gap-2 mb-4 text-zinc-500 dark:text-zinc-400">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Live Card Preview</span>
                  </div>

                  {/* --- Preview Card (Brutalist Style) --- */}
                  <div className="group relative flex flex-col h-full bg-transparent w-full">
                    {/* Visual Component - The Image */}
                    <div className="relative aspect-[4/3] overflow-hidden border-2 border-black dark:border-white rounded-t-xl bg-gray-100 dark:bg-zinc-800 z-10 transition-transform duration-300">
                      {formData.preview_image_url ? (
                        <img
                          src={formData.preview_image_url}
                          alt="Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <img
                          src="https://placehold.co/400x300/1a1a1a/F8BE00?text=AI+Prompt"
                          alt="Placeholder"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

                      {/* Category Tag - Absolute positioned */}
                      <div className="absolute top-3 left-3 z-20 pointer-events-auto">
                        <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {formData.category || 'Category'}
                        </span>
                      </div>

                      {/* Save Button (Mock) */}
                      <div className="absolute top-3 right-3 z-50 pointer-events-auto">
                        <div
                          className="p-2.5 rounded-full border-2 transition-all duration-200 relative z-50 bg-black/80 backdrop-blur-md border-white/40 text-white"
                        >
                          <Bookmark size={18} strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Info Component - The Details */}
                    <div className="flex flex-col flex-grow bg-white dark:bg-black border-2 border-t-0 border-black dark:border-white rounded-b-xl overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 group-hover:-translate-y-1">

                      {/* Header Section */}
                      <div className="p-4 bg-white dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
                        <h3 className="font-display font-bold text-xl leading-tight text-black dark:text-white mb-1 group-hover:text-[#F8BE00] transition-colors line-clamp-1">
                          {formData.title || 'Untitled Prompt'}
                        </h3>
                      </div>

                      {/* Prompt Teaser */}
                      <div className="p-4 flex-grow bg-gray-50 dark:bg-zinc-950">
                        <div className="relative">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F8BE00] opacity-50"></div>
                          <p className="pl-3 text-sm font-mono text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed break-words">
                            {formData.prompt || 'Your prompt description will typically appear here in a truncated view...'}
                          </p>
                        </div>

                        {/* Tags */}
                        {getTagsArray().length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {getTagsArray().slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Rating Row (Mock) */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="p-0.5">
                                <Heart size={14} className={i <= 4 ? "fill-rose-500 text-rose-500" : "text-zinc-600"} />
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="font-medium">4.5 • 12 ratings</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
                        <button
                          disabled
                          className="flex-grow py-3 px-4 bg-white dark:bg-black text-black dark:text-white flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest opacity-50 cursor-not-allowed"
                        >
                          <Copy size={16} /> <span>Copy</span>
                        </button>
                        <button disabled className="w-14 flex-none bg-white dark:bg-black text-black dark:text-white flex items-center justify-center opacity-50 cursor-not-allowed">
                          <Share2 size={18} className="stroke-[2.5px]" />
                        </button>
                        <button disabled className="w-14 flex-none bg-white dark:bg-black text-black dark:text-white flex items-center justify-center opacity-50 cursor-not-allowed">
                          <ExternalLink size={20} className="stroke-[2.5px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* --- End Preview Card --- */}

                  {/* Helper Box: Submission Guidelines */}
                  <div className="mt-8 p-6 bg-zinc-50 dark:bg-zinc-900/30 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-[#F8BE00] shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm uppercase tracking-wide">Submission Guidelines</h4>
                        <p className="text-xs text-zinc-500">
                          To ensure high quality, please follow these rules:
                        </p>
                        <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
                          <li>Title should be descriptive and short.</li>
                          <li>Prompts must be original or open source.</li>
                          <li>No NSFW or offensive content.</li>
                          <li>Verify the preview image matches the prompt.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </motion.div>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500">Checking authorization...</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
