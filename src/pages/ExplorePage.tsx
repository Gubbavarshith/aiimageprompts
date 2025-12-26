import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Check, ExternalLink, X, SlidersHorizontal, Bookmark, Share2, Share, Link as LinkIcon, Heart } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { AnimatedAIToolsHero } from '@/components/explore/AnimatedAIToolsHero'
import { fetchPromptsByStatus, generateSlug, type PromptRecord } from '@/lib/services/prompts'
import { savePrompt, unsavePrompt, getSavedPromptIds } from '@/lib/services/savedPrompts'
import { logDiscoveryEvent } from '@/lib/services/discoveryEvents'
import { useToast } from '@/contexts/ToastContext'
import { getRatingSettings, upsertPromptRating, removePromptRating } from '@/lib/services/ratings'
import { updateCanonical } from '@/lib/seo'
import { fetchUniqueCategories, fetchPopularTags } from '@/lib/services/categories'

// Social Media Icon Components
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

interface PromptCardProps {
  prompt: PromptRecord;
  index: number;
  onCopy: (prompt: PromptRecord) => void;
  copiedId: string | null;
  isSaved: boolean;
  onSaveToggle: (promptId: string) => void;
  onShare: (prompt: PromptRecord) => void;
  onView: (prompt: PromptRecord) => void;
  onRate: (prompt: PromptRecord, rating: number) => void;
  requireLoginForRatings: boolean;
  isSignedIn: boolean;
  onClearRating: (prompt: PromptRecord) => void;
}

const PromptCard = ({
  prompt,
  index,
  onCopy,
  copiedId,
  isSaved,
  onSaveToggle,
  onShare,
  onView,
  onRate,
  requireLoginForRatings,
  isSignedIn,
  onClearRating,
}: PromptCardProps) => {
  const isCopied = copiedId === prompt.id;
  const avg = typeof prompt.rating_avg === 'number' ? prompt.rating_avg : null;
  const count = prompt.rating_count ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="group relative flex flex-col h-full"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Visual Component - The Image */}
      <div
        className="relative aspect-[4/3] overflow-hidden border-2 border-black dark:border-white rounded-t-xl bg-gray-100 dark:bg-zinc-800 z-10 cursor-pointer"
        onClick={() => prompt.preview_image_url && onView(prompt)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            prompt.preview_image_url && onView(prompt)
          }
        }}
        aria-label={prompt.preview_image_url ? `View full image for ${prompt.title}` : 'No image available'}
      >
        <img
          src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
          alt={prompt.title}
          loading="lazy"
          width="400"
          height="300"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

        {/* Category Tag - Absolute positioned */}
        <div className="absolute top-3 left-3 z-20 pointer-events-auto">
          <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {prompt.category}
          </span>
        </div>

        {/* Save Button - Show for all users */}
        <div className="absolute top-3 right-3 z-50 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onSaveToggle(prompt.id)
            }}
            className={`p-2.5 rounded-full border-2 transition-all duration-200 relative z-50 cursor-pointer hover:scale-110 active:scale-95 ${isSaved
              ? 'bg-[#F8BE00] border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-black/80 backdrop-blur-md border-white/40 text-white hover:bg-black'
              }`}
            style={{ pointerEvents: 'auto', zIndex: 9999 }}
            aria-label={isSaved ? 'Remove from saved' : 'Save prompt'}
            title={isSaved ? 'Remove from saved' : 'Save prompt'}
          >
            <Bookmark size={18} className={isSaved ? 'fill-current' : ''} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Info Component - The Details */}
      <div className="flex flex-col flex-grow bg-white dark:bg-black border-2 border-t-0 border-black dark:border-white rounded-b-xl overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 group-hover:-translate-y-1">

        {/* Header Section */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
          <h3 className="font-display font-bold text-xl leading-tight text-black dark:text-white mb-1 group-hover:text-[#F8BE00] transition-colors line-clamp-1">
            {prompt.title}
          </h3>
        </div>

        {/* Prompt Teaser */}
        <div className="p-4 flex-grow bg-gray-50 dark:bg-zinc-950">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F8BE00] opacity-50"></div>
            <p className="pl-3 text-sm font-mono text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {prompt.prompt}
            </p>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {prompt.tags.slice(0, 2).map(tag => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTagClick(tag.toLowerCase())
                  }}
                  className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 hover:text-[#F8BE00] transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Rating Row */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const filled = avg !== null ? avg >= value - 0.25 : false;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRate(prompt, value);
                    }}
                    className="p-0.5"
                    aria-label={`Rate ${value} heart${value > 1 ? 's' : ''}`}
                  >
                    <Heart
                      size={14}
                      className={filled ? 'fill-rose-500 text-rose-500' : 'text-zinc-400 dark:text-zinc-600'}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium">
                {avg !== null ? avg.toFixed(1) : '–'} • {count} rating{count === 1 ? '' : 's'}
              </span>
              {count > 0 && (!requireLoginForRatings || isSignedIn) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearRating(prompt);
                  }}
                  className="px-1.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-[10px] hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {requireLoginForRatings && !isSignedIn && (
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
              Sign in to add your rating.
            </p>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
          <button
            onClick={() => onCopy(prompt)}
            aria-label={isCopied ? 'Prompt copied to clipboard' : `Copy prompt: ${prompt.title}`}
            className="flex-grow py-3 px-4 bg-white dark:bg-black text-black dark:text-white hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest group/btn"
          >
            {isCopied ? (
              <>
                <Check size={16} className="stroke-[3px]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                <span>Copy prompt</span>
              </>
            )}
          </button>
          <button
            onClick={() => onShare(prompt)}
            aria-label={`Share prompt ${prompt.title}`}
            className="w-14 flex-none bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center"
          >
            <Share2 size={18} className="stroke-[2.5px]" />
          </button>
          <button
            onClick={() => onView(prompt)}
            disabled={!prompt.preview_image_url}
            aria-label={prompt.preview_image_url ? `View full image for ${prompt.title}` : 'No image available'}
            className={`w-14 flex-none bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center ${!prompt.preview_image_url ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={prompt.preview_image_url ? 'View Full Image' : 'No image available'}
          >
            <ExternalLink size={20} className="stroke-[2.5px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [popularTags, setPopularTags] = useState<Array<{ tag: string; count: number }>>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [savedPromptIds, setSavedPromptIds] = useState<Set<string>>(new Set())
  const [isTogglingSave, setIsTogglingSave] = useState<string | null>(null)

  // Clerk auth
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const toast = useToast()

  // Local state for immediate UI feedback
  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get('q') || '')
  const categoryFilter = searchParams.get('category') || 'All'
  const tagFilter = searchParams.get('tag') || null
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [sharePrompt, setSharePrompt] = useState<PromptRecord | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [requireLoginForRatings, setRequireLoginForRatings] = useState(true)
  const [ratingSubmittingId, setRatingSubmittingId] = useState<string | null>(null)
  const anonIdRef = useRef<string | null>(null)
  const [showUnsaveConfirm, setShowUnsaveConfirm] = useState<{ promptId: string; title: string } | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [displayedCount, setDisplayedCount] = useState(20) // Number of prompts to display initially
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    document.title = 'Explore AI Image Prompts – Browse Free Prompt Library'
    updateCanonical('/explore')

    const loadPrompts = async () => {
      try {
        // Fetch only published prompts
        const data = await fetchPromptsByStatus('Published')
        setPrompts(data)
      } catch (err) {
        console.error('Failed to load prompts:', err)
        toast.error('Failed to load prompts. Please refresh the page and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const fetchedCategories = await fetchUniqueCategories()
        setCategories(fetchedCategories)
      } catch (err) {
        console.error('Failed to load categories:', err)
        // Fallback to empty array, will show "All" only
        setCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    const loadTags = async () => {
      try {
        setIsLoadingTags(true)
        const tags = await fetchPopularTags(20) // Get top 20 tags
        setPopularTags(tags)
      } catch (err) {
        console.error('Failed to load tags:', err)
        setPopularTags([])
      } finally {
        setIsLoadingTags(false)
      }
    }

    loadPrompts()
    loadCategories()
    loadTags()
  }, [toast])

  // Sync selectedTag with URL params
  useEffect(() => {
    if (tagFilter) {
      setSelectedTag(tagFilter)
    } else {
      setSelectedTag(null)
    }
  }, [tagFilter])

  // Load rating settings & anonymous rating id
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

  // Load saved prompts for signed-in users
  useEffect(() => {
    const loadSavedPrompts = async () => {
      if (!isLoaded || !isSignedIn || !user?.id) return

      try {
        const savedIds = await getSavedPromptIds(user.id)
        setSavedPromptIds(new Set(savedIds))
      } catch (err) {
        console.error('Failed to load saved prompts:', err)
      }
    }

    loadSavedPrompts()
  }, [isLoaded, isSignedIn, user?.id])

  // Sync localSearchQuery with URL params (for URL sharing support)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (urlQuery !== localSearchQuery) {
      setLocalSearchQuery(urlQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // Sync when URL params change (e.g., from shared link)

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = localSearchQuery === '' ||
        prompt.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        prompt.prompt.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(localSearchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === 'All' ||
        prompt.category.toLowerCase() === categoryFilter.toLowerCase()

      const matchesTag = !selectedTag || !tagFilter ||
        prompt.tags?.some(tag => tag.trim().toLowerCase() === selectedTag.toLowerCase())

      return matchesSearch && matchesCategory && matchesTag
    })
  }, [prompts, localSearchQuery, categoryFilter, selectedTag, tagFilter])

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE)
  }, [localSearchQuery, categoryFilter])

  // Displayed prompts (for infinite scroll)
  const displayedPrompts = useMemo(() => {
    return filteredPrompts.slice(0, displayedCount)
  }, [filteredPrompts, displayedCount])

  const hasMore = displayedCount < filteredPrompts.length

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true)
          // Simulate slight delay for smooth UX
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPrompts.length))
            setIsLoadingMore(false)
          }, 300)
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading 200px before reaching the bottom
        threshold: 0.1,
      }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoadingMore, filteredPrompts.length])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setLocalSearchQuery(query)

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce URL update (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        if (query) {
          newParams.set('q', query)
        } else {
          newParams.delete('q')
        }
        return newParams
      }, { replace: true })
    }, 300)
  }, [setSearchParams])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])


  // Close modal on Escape
  useEffect(() => {
    if (!isShareModalOpen && !showUnsaveConfirm) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isShareModalOpen) {
          handleCloseShareModal()
        } else if (showUnsaveConfirm) {
          setShowUnsaveConfirm(null)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isShareModalOpen, showUnsaveConfirm])

  // Keyboard shortcut: Ctrl/Cmd+K to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Ctrl/Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !isInputFocused) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (category === 'All') {
        newParams.delete('category')
      } else {
        newParams.set('category', category)
      }
      // Clear tag filter when changing category
      newParams.delete('tag')
      setSelectedTag(null)
      return newParams
    }, { replace: true })
  }

  const handleTagClick = async (tag: string) => {
    // Log discovery event (non-blocking)
    logDiscoveryEvent({
      promptId: '', // Not applicable for tag filter
      source: 'tag-chip',
      tagAtClick: tag.toLowerCase(),
      userId: user?.id || null,
      anonId: anonIdRef.current || null,
    }).catch(err => console.error('Failed to log discovery event:', err))
    
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (selectedTag === tag) {
        // Deselect if clicking the same tag
        newParams.delete('tag')
        setSelectedTag(null)
      } else {
        newParams.set('tag', tag)
        setSelectedTag(tag)
      }
      return newParams
    }, { replace: true })
  }

  const handleCopy = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setCopiedId(prompt.id)
      toast.success('Prompt copied to clipboard.')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Could not copy the prompt. Please try again.')
    }
  }

  const handleSaveToggle = async (promptId: string) => {
    // Check if user is signed in
    if (!isLoaded) return // Wait for auth to load

    if (!isSignedIn || !user?.id) {
      // Show toast and redirect to auth page
      toast.info('Sign in to save prompts and access them across devices.')
      // Redirect after a short delay to allow toast to be seen
      setTimeout(() => {
        navigate('/auth', { state: { from: '/explore' } })
      }, 2000) // 2 second delay to see the toast
      return
    }

    const isCurrentlySaved = savedPromptIds.has(promptId)

    // Show confirmation dialog if unsaving
    if (isCurrentlySaved) {
      const prompt = prompts.find(p => p.id === promptId)
      if (prompt) {
        setShowUnsaveConfirm({ promptId, title: prompt.title })
      }
      return
    }

    // Save immediately without confirmation
    if (isTogglingSave === promptId) return // Prevent double clicks
    setIsTogglingSave(promptId)

    try {
      await savePrompt(user.id, promptId)
      setSavedPromptIds(prev => new Set(prev).add(promptId))
      toast.success('Prompt saved.')
    } catch (err) {
      console.error('Failed to save prompt:', err)
      toast.error("We couldn't save this prompt. Please try again.")
    } finally {
      setIsTogglingSave(null)
    }
  }

  const handleUnsaveConfirm = async () => {
    if (!showUnsaveConfirm || !user?.id) return

    const { promptId } = showUnsaveConfirm
    setShowUnsaveConfirm(null)

    if (isTogglingSave === promptId) return // Prevent double clicks
    setIsTogglingSave(promptId)

    try {
      await unsavePrompt(user.id, promptId)
      setSavedPromptIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(promptId)
        return newSet
      })
      toast.success('Removed from saved prompts.')
    } catch (err) {
      console.error('Failed to unsave prompt:', err)
      toast.error("We couldn't remove this prompt from your saved list.")
    } finally {
      setIsTogglingSave(null)
    }
  }

  const buildShareUrl = (prompt: PromptRecord) => {
    const slug = generateSlug(prompt.title)
    return `${window.location.origin}/prompt/${slug}`
  }

  const handleSharePrompt = (prompt: PromptRecord) => {
    setSharePrompt(prompt)
    setIsShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false)
    setSharePrompt(null)
  }

  const buildShareText = (prompt: PromptRecord, includeUrl: boolean = true) => {
    const shareUrl = buildShareUrl(prompt)
    const excitingText = `Found this AI image prompt: "${prompt.title}" 🔥`
    const callToAction = 'Try it, remix it, and tag me with what you make.'

    if (includeUrl) {
      return `${excitingText}\n\n${shareUrl}\n\n${callToAction}`
    }
    return excitingText
  }

  const handleDirectShare = async () => {
    if (!sharePrompt) return
    const shareUrl = buildShareUrl(sharePrompt)
    const shareText = buildShareText(sharePrompt, true)
    const shareData = {
      title: sharePrompt.title,
      text: shareText,
      url: shareUrl,
    }

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        toast.success('Shared from your device.')
        return
      }
    } catch (err) {
      console.error('Web Share failed, falling back to manual options.', err)
    }

    // If Web Share is unavailable, nudge users to copy or use icons
    toast.info('Use the buttons below to share or copy the link.')
  }

  const handleSharePlatform = (platform: 'x' | 'facebook' | 'telegram' | 'whatsapp') => {
    if (!sharePrompt) return
    const shareUrl = buildShareUrl(sharePrompt)
    const url = encodeURIComponent(shareUrl)
    const fullShareText = buildShareText(sharePrompt, true)
    let shareLink = ''

    switch (platform) {
      case 'x':
        // X/Twitter: Use full text with URL included in text (better formatting)
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`
        break
      case 'facebook':
        // Facebook: Use quote parameter for better text display
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(fullShareText)}`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${url}&text=${encodeURIComponent(fullShareText)}`
        break
      case 'whatsapp':
        // WhatsApp: Full formatted text with line breaks
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`
        break
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyShareLink = async () => {
    if (!sharePrompt) return
    const shareUrl = buildShareUrl(sharePrompt)
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard.')
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast.error('Could not copy the link. Please try again.')
    }
  }

  const handleOpenImage = (prompt: PromptRecord) => {
    if (!prompt.preview_image_url) return
    const slug = generateSlug(prompt.title)
    navigate(`/prompt/${slug}`)
  }


  const handleRatePrompt = async (prompt: PromptRecord, rating: number) => {
    if (ratingSubmittingId) return

    try {
      if (requireLoginForRatings) {
        if (!isLoaded) {
          toast.info('Checking your session, please try again in a moment.')
          return
        }
        if (!isSignedIn || !user?.id) {
          toast.info('Sign in to rate prompts.')
          setTimeout(() => {
            navigate('/auth', { state: { from: '/explore' } })
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

      setPrompts(prev =>
        prev.map(p =>
          p.id === prompt.id
            ? { ...p, rating_avg: updated.rating_avg, rating_count: updated.rating_count }
            : p,
        ),
      )

      toast.success('Thanks for rating this prompt.')
    } catch (err) {
      console.error('Failed to rate prompt:', err)
      toast.error('We couldn’t save your rating. Please try again.')
    } finally {
      setRatingSubmittingId(null)
    }
  }

  const handleClearRating = async (prompt: PromptRecord) => {
    if (ratingSubmittingId) return

    try {
      if (requireLoginForRatings) {
        if (!isLoaded) {
          toast.info('Checking your session, please try again in a moment.')
          return
        }
        if (!isSignedIn || !user?.id) {
          toast.info('Sign in to change your rating.')
          setTimeout(() => {
            navigate('/auth', { state: { from: '/explore' } })
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

      setPrompts(prev =>
        prev.map(p =>
          p.id === prompt.id
            ? { ...p, rating_avg: updated.rating_avg, rating_count: updated.rating_count }
            : p,
        ),
      )

      toast.success('Your rating was removed.')
    } catch (err) {
      console.error('Failed to remove rating:', err)
      toast.error('We couldn’t remove your rating. Please try again.')
    } finally {
      setRatingSubmittingId(null)
    }
  }


  const clearFilters = () => {
    setLocalSearchQuery('')
    setSelectedTag(null)
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
      <FloatingNavbar />

      <main className="pb-20">
        {/* Animated AI Tools Hero Section */}
        <AnimatedAIToolsHero />

        <div className="container mx-auto px-4">

          {/* Search & Filters Toolbar - Sticky */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-20 mb-8 mx-auto px-4 py-6"
          >
            <div className="max-w-6xl mx-auto flex flex-col gap-6">

              {/* Row 1: Search Bar - Premium & Centered */}
              <div className="w-full max-w-2xl mx-auto relative z-20 group">
                <motion.div
                  className={`absolute -inset-1 bg-gradient-to-r from-[#F8BE00] via-orange-400 to-[#F8BE00] rounded-2xl blur-md opacity-0 transition-opacity duration-500 ${isSearchFocused ? 'opacity-50' : 'group-hover:opacity-25'}`}
                />
                <div className={`relative flex items-center bg-white dark:bg-zinc-900 rounded-2xl transition-all duration-300 border-2 ${isSearchFocused ? 'border-black dark:border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-[1.01]' : 'border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'}`}>
                  <div className={`pl-5 text-gray-400 transition-colors duration-300 ${isSearchFocused ? 'text-black dark:text-white' : ''}`}>
                    <Search size={22} strokeWidth={2.5} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={localSearchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search prompts, styles, or keywords"
                    aria-label="Search prompts"
                    className="w-full h-14 pl-4 pr-12 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-lg font-bold placeholder:text-gray-400 dark:placeholder:text-zinc-600 text-black dark:text-white"
                  />
                  <AnimatePresence>
                    {localSearchQuery && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => {
                          setLocalSearchQuery('')
                          setSearchParams(prev => {
                            const newParams = new URLSearchParams(prev)
                            newParams.delete('q')
                            return newParams
                          }, { replace: true })
                        }}
                        className="absolute right-4 p-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        <X size={16} strokeWidth={3} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Row 2: Filters - Animated Chips */}
              <div className="w-full pb-2 px-4 sm:px-0">
                <div className="flex flex-wrap gap-3 items-center justify-center mx-auto px-2 py-2">
                  <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mr-2 bg-gray-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg select-none">
                    <SlidersHorizontal size={14} />
                    <span>Filter by category</span>
                  </div>
                  {/* Always show "All" first */}
                  <motion.button
                    key="All"
                    onClick={() => handleCategoryChange('All')}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 isolate ${(categoryFilter === 'All' || !categoryFilter)
                      ? 'text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                      }`}
                  >
                    {(categoryFilter === 'All' || !categoryFilter) && (
                      <motion.div
                        layoutId="activeFilter"
                        className="absolute inset-0 bg-[#F8BE00] rounded-xl -z-10 border-2 border-black"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">All</span>
                  </motion.button>
                  {/* Dynamic categories */}
                  {isLoadingCategories ? (
                    <div className="px-5 py-2.5 text-sm text-gray-400">Loading categories...</div>
                  ) : (
                    categories.map((cat) => {
                      const isActive = categoryFilter === cat
                      return (
                        <motion.button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 isolate ${isActive
                            ? 'text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                            : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                            }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeFilter"
                              className="absolute inset-0 bg-[#F8BE00] rounded-xl -z-10 border-2 border-black"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className="relative z-10">{cat}</span>
                        </motion.button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Row 3: Popular Tags */}
              {popularTags.length > 0 && (
                <div className="w-full pb-2 px-4 sm:px-0 mt-4">
                  <div className="flex flex-wrap gap-2 items-center justify-center mx-auto px-2 py-2">
                    <div className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mr-2 bg-gray-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg select-none">
                      <span>Popular tags</span>
                    </div>
                    {isLoadingTags ? (
                      <div className="px-3 py-1 text-xs text-gray-400">Loading tags...</div>
                    ) : (
                      popularTags.slice(0, 15).map((tagItem) => {
                        const isActive = selectedTag === tagItem.tag
                        return (
                          <motion.button
                            key={tagItem.tag}
                            onClick={() => handleTagClick(tagItem.tag)}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${isActive
                                ? 'bg-[#F8BE00] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-zinc-800 hover:border-[#F8BE00] hover:text-black dark:hover:text-white'
                              }`}
                          >
                            <span className="relative z-10">
                              {tagItem.tag}
                              {tagItem.count > 1 && (
                                <span className="ml-1.5 text-[10px] opacity-70">({tagItem.count})</span>
                              )}
                            </span>
                          </motion.button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* Results Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 border-4 border-black dark:border-white border-t-[#F8BE00] rounded-full animate-spin mb-6" />
              <p className="text-xl font-mono text-gray-500 animate-pulse">Loading prompts…</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-32 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Search size={32} className="text-black dark:text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">No prompts found for your search.</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
                We couldn’t find anything matching "{localSearchQuery}". Try changing your keywords or clearing filters.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8BE00] text-black border-2 border-black font-bold rounded-lg hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <X size={18} className="stroke-[3px]" />
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 px-2 max-w-7xl mx-auto">
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm uppercase tracking-widest">
                  Showing{' '}
                  <span className="font-black text-black dark:text-white">{displayedPrompts.length}</span>
                  {hasMore && ` of ${filteredPrompts.length}`}{' '}
                  curated prompt{displayedPrompts.length === 1 ? '' : 's'}
                </p>
              </div>

              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 max-w-7xl mx-auto"
              >
                <AnimatePresence mode='popLayout'>
                  {displayedPrompts.map((prompt, index) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      index={index}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                      isSaved={savedPromptIds.has(prompt.id)}
                      onSaveToggle={handleSaveToggle}
                      onShare={handleSharePrompt}
                      onView={handleOpenImage}
                      onRate={handleRatePrompt}
                      requireLoginForRatings={requireLoginForRatings}
                      isSignedIn={!!user?.id}
                      onClearRating={handleClearRating}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Infinite scroll trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center items-center py-8">
                  {isLoadingMore && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-black dark:border-white border-t-[#F8BE00] rounded-full animate-spin" />
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400">Loading more prompts...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isShareModalOpen && sharePrompt && (
          <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseShareModal}
          >
            <motion.div
              layout
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-2xl shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] dark:shadow-[14px_14px_0px_0px_rgba(255,255,255,1)] overflow-hidden"
            >
              <button
                onClick={handleCloseShareModal}
                className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-[#F8BE00] hover:text-black transition-colors border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Close share dialog"
              >
                <X size={20} className="stroke-[3px]" />
              </button>

              <div className="p-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-sm uppercase font-black text-gray-500 tracking-[0.2em]">
                    Share this prompt
                  </p>
                  <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">{sharePrompt.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Share a direct link to this prompt so others can try it, remix it, or build on top of it.
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-b from-[#f6f0ff] via-white to-[#f6f0ff] dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 shadow-inner mb-6">
                  <div className="aspect-[16/9] bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                    <img
                      src={sharePrompt.preview_image_url || 'https://placehold.co/800x450/4b3df6/ffffff?text=Share+this+prompt'}
                      alt={sharePrompt.title}
                      width="800"
                      height="450"
                      decoding="async"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">
                    Share with your favorite tools & timelines
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Post the link directly, or copy it and drop it into a chat, doc, or project brief.
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

                <div className="space-y-3">
                  <button
                    onClick={handleDirectShare}
                    aria-label="Share using your device"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg border-2 border-black hover:bg-[#F8BE00] hover:text-black transition-colors font-bold uppercase text-sm"
                  >
                    <Share size={18} className="stroke-[3px]" />
                    Share from your device
                  </button>
                  <button
                    onClick={handleCopyShareLink}
                    aria-label="Copy share link"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-black text-black dark:text-white rounded-lg border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-bold uppercase text-sm"
                  >
                    <LinkIcon size={16} className="stroke-[3px]" />
                    Copy link
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsave Confirmation Modal */}
      <AnimatePresence>
        {showUnsaveConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUnsaveConfirm(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[140]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-[140] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-2xl shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] dark:shadow-[14px_14px_0px_0px_rgba(255,255,255,1)] p-6">
                <h2 className="text-xl font-bold text-black dark:text-white mb-2">Remove from Saved?</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to remove "{showUnsaveConfirm.title}" from your saved prompts?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUnsaveConfirm}
                    disabled={isTogglingSave === showUnsaveConfirm.promptId}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTogglingSave === showUnsaveConfirm.promptId ? 'Removing...' : 'Remove'}
                  </button>
                  <button
                    onClick={() => setShowUnsaveConfirm(null)}
                    disabled={isTogglingSave === showUnsaveConfirm.promptId}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
