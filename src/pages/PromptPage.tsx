import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, AlertCircle, Copy, Check, Share2, Bookmark, Heart, ExternalLink, X } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { fetchPromptBySlug, generateSlug, type PromptRecord } from '../lib/services/prompts'
import { fetchRelatedPromptsWithFallback } from '../lib/services/relatedPrompts'
import { logDiscoveryEvent } from '../lib/services/discoveryEvents'
import { useToast } from '../contexts/ToastContext'
import { savePrompt, unsavePrompt, getSavedPromptIds } from '../lib/services/savedPrompts'
import { getRatingSettings, upsertPromptRating, removePromptRating } from '../lib/services/ratings'
import { updateMetaTags } from '../lib/seo'
import { getAspectRatioClass } from '../lib/utils'

// Social Media Icon Components (from ExplorePage)
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 240 240" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="120" cy="120" r="120" fill="#29B6F6" />
    <path d="M54 121l116-45c5.3-2 9.9 1.3 8.2 8.5l-19.7 92.7c-1.5 6.8-5.6 8.5-11.3 5.3l-31.3-23-15.1 14.6c-1.7 1.7-3.2 3.2-6.5 3.2l2.3-33 60.1-54c2.6-2.3-.6-3.6-4-1.3l-74.4 47.1-32-10c-7-2.2-7.2-7-1.5-9.5z" fill="#fff" />
  </svg>
)

// Related Prompt Card Component
interface RelatedPromptCardProps {
  prompt: PromptRecord
  onNavigate: (slug: string, promptId: string) => void
}

const RelatedPromptCard = ({ prompt, onNavigate }: RelatedPromptCardProps) => {
  const slug = generateSlug(prompt.title)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={() => onNavigate(slug, prompt.id)}
      className="group cursor-pointer"
    >
      <div className={`relative ${getAspectRatioClass(prompt.image_ratio)} overflow-hidden border-2 border-black dark:border-white rounded-xl bg-gray-100 dark:bg-zinc-800 mb-3`}>
        <img
          src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
          alt={prompt.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 left-2">
          <span className="bg-[#F8BE00] border-2 border-black text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {prompt.category}
          </span>
        </div>
      </div>
      <h3 className="font-display font-bold text-sm leading-tight text-black dark:text-white group-hover:text-[#F8BE00] transition-colors line-clamp-2">
        {prompt.title}
      </h3>
    </motion.div>
  )
}

export default function PromptPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [prompt, setPrompt] = useState<PromptRecord | null>(null)
  const [relatedPrompts, setRelatedPrompts] = useState<PromptRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCopied, setHasCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isTogglingSave, setIsTogglingSave] = useState(false)
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [requireLoginForRatings, setRequireLoginForRatings] = useState(true)
  const [ratingSubmittingId, setRatingSubmittingId] = useState<string | null>(null)
  const anonIdRef = useRef<string | null>(null)

  // Clerk auth
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    const loadPrompt = async () => {
      if (!slug) {
        setError('Invalid prompt URL')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchPromptBySlug(slug)

        if (!data) {
          setError('Prompt not found')
          return
        }

        setPrompt(data)

        // Load related prompts
        try {
          const related = await fetchRelatedPromptsWithFallback(data, 6)
          setRelatedPrompts(related)
        } catch (err) {
          console.error('Failed to load related prompts:', err)
        }

        // Update SEO meta tags
        const promptSlug = generateSlug(data.title)
        const pageUrl = `/prompt/${promptSlug}`
        updateMetaTags({
          title: `${data.title} | AI Image Prompts`,
          description: data.prompt.substring(0, 160) + (data.prompt.length > 160 ? '...' : ''),
          canonical: pageUrl,
          og: {
            title: data.title,
            description: data.prompt.substring(0, 160) + (data.prompt.length > 160 ? '...' : ''),
            url: pageUrl,
            image: data.preview_image_url || undefined,
            type: 'article',
            siteName: 'AI Image Prompts',
          },
          twitter: {
            card: 'summary_large_image',
            title: data.title,
            description: data.prompt.substring(0, 160) + (data.prompt.length > 160 ? '...' : ''),
            image: data.preview_image_url || undefined,
          },
        })
      } catch (err) {
        console.error('Failed to load prompt:', err)
        setError('Failed to load prompt. Please try again later.')
        toast.error('Failed to load prompt')
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompt()
  }, [slug, toast])

  // Load saved prompts status
  useEffect(() => {
    const loadSavedStatus = async () => {
      if (!isLoaded || !isSignedIn || !user?.id || !prompt) return

      try {
        const savedIds = await getSavedPromptIds(user.id)
        setIsSaved(savedIds.includes(prompt.id))
      } catch (err) {
        console.error('Failed to load saved status:', err)
      }
    }

    loadSavedStatus()
  }, [isLoaded, isSignedIn, user?.id, prompt])

  // Load rating settings
  useEffect(() => {
    getRatingSettings()
      .then(settings => {
        setRequireLoginForRatings(settings.requireLoginForRatings)
      })
      .catch(err => {
        console.error('Failed to load rating settings:', err)
      })

    const existingAnonId = window.localStorage.getItem('aiimageprompts_rating_anon_id')
    if (existingAnonId) {
      anonIdRef.current = existingAnonId
    } else {
      const newId = (window.crypto?.randomUUID?.() ?? `anon-${Math.random().toString(36).slice(2)}`)
      anonIdRef.current = newId
      window.localStorage.setItem('aiimageprompts_rating_anon_id', newId)
    }
  }, [])

  const handleCopyPrompt = async () => {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setHasCopied(true)
      toast.success('Prompt copied to clipboard.')
      setTimeout(() => setHasCopied(false), 2000)
    } catch (err) {
      toast.error('Could not copy the prompt. Please try again.')
    }
  }

  const handleSaveToggle = async () => {
    if (!prompt) return

    if (!isLoaded) return

    if (!isSignedIn || !user?.id) {
      toast.info('Sign in to save prompts and access them across devices.')
      setTimeout(() => {
        navigate('/auth', { state: { from: `/prompt/${slug}` } })
      }, 2000)
      return
    }

    if (isSaved) {
      setShowUnsaveConfirm(true)
      return
    }

    if (isTogglingSave) return
    setIsTogglingSave(true)

    try {
      await savePrompt(user.id, prompt.id)
      setIsSaved(true)
      toast.success('Prompt saved.')
    } catch (err) {
      console.error('Failed to save prompt:', err)
      toast.error("We couldn't save this prompt. Please try again.")
    } finally {
      setIsTogglingSave(false)
    }
  }

  const handleUnsaveConfirm = async () => {
    if (!prompt || !user?.id) return

    setShowUnsaveConfirm(false)

    if (isTogglingSave) return
    setIsTogglingSave(true)

    try {
      await unsavePrompt(user.id, prompt.id)
      setIsSaved(false)
      toast.success('Removed from saved prompts.')
    } catch (err) {
      console.error('Failed to unsave prompt:', err)
      toast.error("We couldn't remove this prompt from your saved list.")
    } finally {
      setIsTogglingSave(false)
    }
  }

  const buildShareUrl = () => {
    if (!prompt) return ''
    const promptSlug = generateSlug(prompt.title)
    return `${window.location.origin}/prompt/${promptSlug}`
  }

  const buildShareText = (includeUrl: boolean = true) => {
    if (!prompt) return ''
    const shareUrl = buildShareUrl()
    const excitingText = `Found this AI image prompt: "${prompt.title}" 🔥`
    const callToAction = 'Try it, remix it, and tag me with what you make.'

    if (includeUrl) {
      return `${excitingText}\n\n${shareUrl}\n\n${callToAction}`
    }
    return excitingText
  }

  const handleSharePlatform = (platform: 'x' | 'facebook' | 'telegram' | 'whatsapp') => {
    if (!prompt) return
    const shareUrl = buildShareUrl()
    const url = encodeURIComponent(shareUrl)
    const fullShareText = buildShareText(true)
    let shareLink = ''

    switch (platform) {
      case 'x':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(fullShareText)}`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${url}&text=${encodeURIComponent(fullShareText)}`
        break
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`
        break
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyShareLink = async () => {
    const shareUrl = buildShareUrl()
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard.')
    } catch (err) {
      toast.error('Could not copy the link. Please try again.')
    }
  }

  const handleRatePrompt = async (rating: number) => {
    if (!prompt || ratingSubmittingId) return

    try {
      if (requireLoginForRatings) {
        if (!isLoaded) {
          toast.info('Checking your session, please try again in a moment.')
          return
        }
        if (!isSignedIn || !user?.id) {
          toast.info('Sign in to rate prompts.')
          setTimeout(() => {
            navigate('/auth', { state: { from: `/prompt/${slug}` } })
          }, 800)
          return
        }
      }

      setRatingSubmittingId(prompt.id)

      const options: { promptId: string; rating: number; userId?: string; ipHash?: string } = {
        promptId: prompt.id,
        rating,
      }

      if (requireLoginForRatings && user?.id) {
        options.userId = user.id
      } else if (!requireLoginForRatings && anonIdRef.current) {
        options.ipHash = anonIdRef.current
      }

      const updated = await upsertPromptRating(options)
      setPrompt(prev => prev ? { ...prev, rating_avg: updated.rating_avg, rating_count: updated.rating_count } : null)

      toast.success('Thanks for rating this prompt.')
    } catch (err) {
      console.error('Failed to rate prompt:', err)
      toast.error("We couldn't save your rating. Please try again.")
    } finally {
      setRatingSubmittingId(null)
    }
  }

  const handleClearRating = async () => {
    if (!prompt || ratingSubmittingId) return

    try {
      if (requireLoginForRatings) {
        if (!isLoaded) {
          toast.info('Checking your session, please try again in a moment.')
          return
        }
        if (!isSignedIn || !user?.id) {
          toast.info('Sign in to change your rating.')
          setTimeout(() => {
            navigate('/auth', { state: { from: `/prompt/${slug}` } })
          }, 800)
          return
        }
      }

      setRatingSubmittingId(prompt.id)

      const options: { promptId: string; userId?: string; ipHash?: string } = {
        promptId: prompt.id,
      }

      if (requireLoginForRatings && user?.id) {
        options.userId = user.id
      } else if (!requireLoginForRatings && anonIdRef.current) {
        options.ipHash = anonIdRef.current
      }

      const updated = await removePromptRating(options)
      setPrompt(prev => prev ? { ...prev, rating_avg: updated.rating_avg, rating_count: updated.rating_count } : null)

      toast.success('Your rating was removed.')
    } catch (err) {
      console.error('Failed to remove rating:', err)
      toast.error("We couldn't remove your rating. Please try again.")
    } finally {
      setRatingSubmittingId(null)
    }
  }

  const handleNavigateToPrompt = async (newSlug: string, relatedPromptId: string) => {
    // Log discovery event (non-blocking)
    logDiscoveryEvent({
      promptId: relatedPromptId,
      fromPromptId: prompt?.id,
      source: 'related',
      categoryAtClick: prompt?.category,
      userId: user?.id || null,
      anonId: anonIdRef.current || null,
    }).catch(err => console.error('Failed to log discovery event:', err))
    
    navigate(`/prompt/${newSlug}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
        <FloatingNavbar />
        <main className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#F8BE00]" />
            <p className="text-sm font-medium text-gray-400">Loading prompt...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
        <FloatingNavbar />
        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Prompt not found</h1>
            <p className="text-gray-500 mb-8">
              {error || 'The prompt you are looking for doesn\'t exist or has been removed.'}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#F8BE00] text-black font-bold hover:bg-black hover:text-[#F8BE00] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const avg = typeof prompt.rating_avg === 'number' ? prompt.rating_avg : null
  const count = prompt.rating_count ?? 0

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
      <FloatingNavbar />

      <main className="pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back Link */}
          <div className="mb-8">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Explore
            </Link>
          </div>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-8 lg:gap-12">
            {/* Main Content */}
            <div>
              {/* Category Badge and Ratio */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <Link
                  to={`/explore?category=${encodeURIComponent(prompt.category)}`}
                  onClick={() => {
                    logDiscoveryEvent({
                      promptId: prompt.id,
                      source: 'category-chip',
                      categoryAtClick: prompt.category,
                      userId: user?.id || null,
                      anonId: anonIdRef.current || null,
                    }).catch(err => console.error('Failed to log discovery event:', err))
                  }}
                  className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-4 py-2 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block hover:bg-black hover:text-[#F8BE00] transition-colors"
                >
                  {prompt.category}
                </Link>
                <span className="bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white text-xs font-bold px-4 py-2 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] inline-block">
                  Ratio: {prompt.image_ratio}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black dark:text-white leading-[1.1] mb-8 tracking-tight">
                {prompt.title}
              </h1>

              {/* Preview Image */}
              {prompt.preview_image_url && (
                <div className="mb-8 rounded-2xl overflow-hidden border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                  <img
                    src={prompt.preview_image_url}
                    alt={prompt.title}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Prompt Text */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">
                    Prompt
                  </h2>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black transition-colors font-bold text-sm"
                  >
                    {hasCopied ? (
                      <>
                        <Check size={16} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border-2 border-black dark:border-white rounded-xl p-6">
                  <p className="text-base font-mono text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {prompt.prompt}
                  </p>
                </div>
              </div>

              {/* Negative Prompt (if available) */}
              {prompt.negative_prompt && (
                <div className="mb-8">
                  <h2 className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-4">
                    Negative Prompt
                  </h2>
                  <div className="bg-gray-50 dark:bg-zinc-950 border-2 border-black dark:border-white rounded-xl p-6">
                    <p className="text-base font-mono text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {prompt.negative_prompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-4">
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          logDiscoveryEvent({
                            promptId: prompt.id,
                            source: 'tag-chip',
                            tagAtClick: tag.toLowerCase(),
                            userId: user?.id || null,
                            anonId: anonIdRef.current || null,
                          }).catch(err => console.error('Failed to log discovery event:', err))
                          navigate(`/explore?tag=${encodeURIComponent(tag.toLowerCase())}`)
                        }}
                        className="px-4 py-2 text-xs font-black uppercase bg-black text-white rounded-full tracking-widest border-2 border-black hover:bg-[#F8BE00] hover:text-black transition-colors cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Attribution */}
              {(prompt.attribution || prompt.attribution_link) && (
                <div className="mb-8">
                  <h2 className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-4">
                    Attribution
                  </h2>
                  <div className="bg-gray-50 dark:bg-zinc-950 border-2 border-black dark:border-white rounded-xl p-6">
                    {prompt.attribution_link ? (
                      <a
                        href={prompt.attribution_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-[#F8BE00] transition-colors"
                      >
                        {prompt.attribution || prompt.attribution_link}
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                        {prompt.attribution}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Rating Section */}
              <div className="mb-8 p-6 bg-gray-50 dark:bg-zinc-950 border-2 border-black dark:border-white rounded-xl">
                <h2 className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em] mb-4">
                  Rating
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <div className="inline-flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const value = i + 1
                      const filled = avg !== null ? avg >= value - 0.25 : false
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleRatePrompt(value)}
                          disabled={!!ratingSubmittingId}
                          className="p-1 disabled:opacity-50"
                          aria-label={`Rate ${value} heart${value > 1 ? 's' : ''}`}
                        >
                          <Heart
                            size={24}
                            className={filled ? 'fill-rose-500 text-rose-500' : 'text-zinc-400 dark:text-zinc-600'}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">
                      {avg !== null ? avg.toFixed(1) : '–'} • {count} rating{count === 1 ? '' : 's'}
                    </span>
                    {count > 0 && (!requireLoginForRatings || isSignedIn) && (
                      <button
                        type="button"
                        onClick={handleClearRating}
                        disabled={!!ratingSubmittingId}
                        className="px-2 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-xs hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                {requireLoginForRatings && !isSignedIn && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    Sign in to add your rating.
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-20 lg:h-fit">
              <div className="space-y-4">
                {/* Save Button */}
                <button
                  onClick={handleSaveToggle}
                  disabled={isTogglingSave}
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-black dark:border-white font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50 ${
                    isSaved
                      ? 'bg-[#F8BE00] text-black'
                      : 'bg-white dark:bg-black text-black dark:text-white hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black'
                  }`}
                >
                  <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
                  <span>{isSaved ? 'Saved' : 'Save Prompt'}</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-black dark:border-white font-bold bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  <Share2 size={20} />
                  <span>Share</span>
                </button>

                {/* View Full Image Link */}
                {prompt.preview_image_url && (
                  <a
                    href={prompt.preview_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-black dark:border-white font-bold bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                  >
                    <ExternalLink size={20} />
                    <span>View Full Image</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Related Prompts Section */}
          {relatedPrompts.length > 0 && (
            <div className="mt-16 pt-12 border-t-2 border-black dark:border-white">
              <h2 className="text-2xl font-black text-black dark:text-white mb-8">
                Related Prompts
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedPrompts.map(relatedPrompt => (
                  <RelatedPromptCard
                    key={relatedPrompt.id}
                    prompt={relatedPrompt}
                    onNavigate={handleNavigateToPrompt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-2xl shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] dark:shadow-[14px_14px_0px_0px_rgba(255,255,255,1)] overflow-hidden"
          >
            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-[#F8BE00] hover:text-black transition-colors border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Close share dialog"
            >
              <X size={20} className="stroke-[3px]" />
            </button>

            <div className="p-6">
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">
                  Share this prompt
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share a direct link to this prompt so others can try it, remix it, or build on top of it.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => handleSharePlatform('x')}
                  className="h-14 w-14 rounded-full bg-black border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform hover:bg-gray-800 p-3"
                  aria-label="Share on X"
                >
                  <XIcon className="w-full h-full text-white" />
                </button>
                <button
                  onClick={() => handleSharePlatform('facebook')}
                  className="h-14 w-14 rounded-full bg-[#1877F2] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform hover:bg-[#166FE5] p-3"
                  aria-label="Share on Facebook"
                >
                  <FacebookIcon className="w-full h-full text-white" />
                </button>
                <button
                  onClick={() => handleSharePlatform('telegram')}
                  className="h-14 w-14 rounded-full bg-[#29B6F6] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform hover:bg-[#21A1DB] p-3"
                  aria-label="Share on Telegram"
                >
                  <TelegramIcon className="w-full h-full text-white" />
                </button>
                <button
                  onClick={() => handleSharePlatform('whatsapp')}
                  className="h-14 w-14 rounded-full bg-[#25D366] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform hover:bg-[#20BA5A] p-3"
                  aria-label="Share on WhatsApp"
                >
                  <WhatsAppIcon className="w-full h-full text-white" />
                </button>
              </div>

              <button
                onClick={handleCopyShareLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-black text-black dark:text-white rounded-lg border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-bold uppercase text-sm"
              >
                <Copy size={16} />
                Copy link
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Unsave Confirmation Modal */}
      {showUnsaveConfirm && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setShowUnsaveConfirm(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-2xl shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] dark:shadow-[14px_14px_0px_0px_rgba(255,255,255,1)] p-6"
          >
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">Remove from Saved?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove "{prompt.title}" from your saved prompts?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleUnsaveConfirm}
                disabled={isTogglingSave}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTogglingSave ? 'Removing...' : 'Remove'}
              </button>
              <button
                onClick={() => setShowUnsaveConfirm(false)}
                disabled={isTogglingSave}
                className="px-4 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  )
}

