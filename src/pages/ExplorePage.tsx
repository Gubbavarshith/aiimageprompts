import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Check, ExternalLink, X, SlidersHorizontal, Sparkles, Bookmark, Share2, Share, Link as LinkIcon } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { fetchPromptsByStatus, type PromptRecord } from '@/lib/services/prompts'
import { savePrompt, unsavePrompt, getSavedPromptIds } from '@/lib/services/savedPrompts'
import { useToast } from '@/contexts/ToastContext'

const CATEGORIES = ['All', 'Portraits', 'Anime', 'Logos', 'UI/UX', 'Cinematic', '3D Art', 'Photography', 'Illustrations']

interface PromptCardProps {
  prompt: PromptRecord;
  index: number;
  onCopy: (prompt: PromptRecord) => void;
  copiedId: string | null;
  isSaved: boolean;
  onSaveToggle: (promptId: string) => void;
  onShare: (prompt: PromptRecord) => void;
  onView: (prompt: PromptRecord) => void;
}

const PromptCard = ({ prompt, index, onCopy, copiedId, isSaved, onSaveToggle, onShare, onView }: PromptCardProps) => {
  const isCopied = copiedId === prompt.id;

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
                <span key={tag} className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
          <button
            onClick={() => onCopy(prompt)}
            aria-label={`Copy prompt: ${prompt.title}`}
            className="flex-grow py-3 px-4 bg-white dark:bg-black text-black dark:text-white hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest group/btn"
          >
            {isCopied ? (
              <>
                <Check size={16} className="stroke-[3px]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                <span>Copy Prompt</span>
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRecord | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [sharePrompt, setSharePrompt] = useState<PromptRecord | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    document.title = 'Explore Prompts | AI Image Prompts'

    const loadPrompts = async () => {
      try {
        // Fetch only published prompts
        const data = await fetchPromptsByStatus('Published')
        setPrompts(data)
      } catch (err) {
        console.error('Failed to load prompts:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadPrompts()
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

  // Initialize localSearchQuery from URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    if (urlQuery !== localSearchQuery) {
      setLocalSearchQuery(urlQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const matchesSearch = localSearchQuery === '' ||
        prompt.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        prompt.prompt.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(localSearchQuery.toLowerCase()))

      const matchesCategory = categoryFilter === 'All' ||
        prompt.category.toLowerCase() === categoryFilter.toLowerCase()

      return matchesSearch && matchesCategory
    })
  }, [prompts, localSearchQuery, categoryFilter])

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

  // If a deep link is present, open the modal when data is ready
  const handleCloseModal = useCallback(() => {
    setIsImageModalOpen(false)
    setSelectedPrompt(null)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('promptId')
      return newParams
    }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    const targetId = searchParams.get('promptId')
    if (!targetId || !prompts.length) return
    const match = prompts.find(p => p.id === targetId)
    if (match) {
      setSelectedPrompt(match)
      setIsImageModalOpen(true)
    }
  }, [searchParams, prompts])

  // Close modal on Escape
  useEffect(() => {
    if (!isImageModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isImageModalOpen, handleCloseModal])

  const handleCategoryChange = (category: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (category === 'All') {
        newParams.delete('category')
      } else {
        newParams.set('category', category)
      }
      return newParams
    })
  }

  const handleCopy = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setCopiedId(prompt.id)
      toast.success('Prompt copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy prompt. Please try again.')
    }
  }

  const handleSaveToggle = async (promptId: string) => {
    // Check if user is signed in
    if (!isLoaded) return // Wait for auth to load

    if (!isSignedIn || !user?.id) {
      // Show toast and redirect to auth page
      toast.info('Please sign in to save prompts to your collection.')
      // Redirect after a short delay to allow toast to be seen
      setTimeout(() => {
        navigate('/auth', { state: { from: '/explore' } })
      }, 2000) // 2 second delay to see the toast
      return
    }

    if (isTogglingSave === promptId) return // Prevent double clicks

    setIsTogglingSave(promptId)
    const isCurrentlySaved = savedPromptIds.has(promptId)

    try {
      if (isCurrentlySaved) {
        await unsavePrompt(user.id, promptId)
        setSavedPromptIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(promptId)
          return newSet
        })
        toast.success('Prompt removed from your saved collection.')
      } else {
        await savePrompt(user.id, promptId)
        setSavedPromptIds(prev => new Set(prev).add(promptId))
        toast.success('Prompt added to your saved collection.')
      }
    } catch (err) {
      console.error('Failed to toggle save:', err)
      toast.error(isCurrentlySaved
        ? 'Failed to remove prompt from saved.'
        : 'Failed to save prompt.')
    } finally {
      setIsTogglingSave(null)
    }
  }

  const buildShareUrl = (prompt: PromptRecord) => {
    const url = new URL(window.location.href)
    url.pathname = '/explore'
    url.searchParams.set('promptId', prompt.id)
    return url.toString()
  }

  const handleSharePrompt = (prompt: PromptRecord) => {
    setSharePrompt(prompt)
    setIsShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false)
    setSharePrompt(null)
  }

  const handleDirectShare = async () => {
    if (!sharePrompt) return
    const shareUrl = buildShareUrl(sharePrompt)
    const shareData = {
      title: sharePrompt.title,
      text: `Check this prompt: ${sharePrompt.title}`,
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
    toast.info('Choose a platform below or copy the link.')
  }

  const handleSharePlatform = (platform: 'x' | 'facebook' | 'instagram' | 'whatsapp') => {
    if (!sharePrompt) return
    const url = encodeURIComponent(buildShareUrl(sharePrompt))
    const text = encodeURIComponent(`Check this prompt: ${sharePrompt.title}`)
    let shareLink = ''

    switch (platform) {
      case 'x':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'instagram':
        // Instagram has no web share endpoint; guide user
        handleCopyShareLink()
        toast.info('Link copied. Open Instagram and paste into your story or DM.')
        break
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${sharePrompt.title}\n${decodeURIComponent(url)}`)}`
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
      toast.success('Link copied.')
    } catch (err) {
      console.error('Failed to copy link:', err)
      toast.error('Unable to copy link.')
    }
  }

  const handleOpenImage = (prompt: PromptRecord) => {
    if (!prompt.preview_image_url) return
    setSelectedPrompt(prompt)
    setIsImageModalOpen(true)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('promptId', prompt.id)
      return newParams
    }, { replace: true })
  }



  const clearFilters = () => {
    setLocalSearchQuery('')
    setSearchParams({})
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]">
      <FloatingNavbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">

          {/* Header Section */}
          <div className="relative mb-12">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-6">
                Explore <span className="relative inline-block px-2">
                  <span className="absolute inset-0 bg-[#F8BE00] transform -skew-x-6 translate-y-2 opacity-100" />
                  <span className="relative z-10 text-black">Prompts</span>
                </span>
              </h1>

              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                Discover a curated collection of high-fidelity AI image generation prompts.
                <span className="inline-flex items-center gap-1 mx-2 text-black dark:text-white font-bold"><Sparkles size={16} /> Create Art</span>
                faster.
              </p>
            </div>
          </div>

          {/* Search & Filters Toolbar - Sticky */}
          <div className="sticky top-20 z-30 mb-12 -mx-4 px-4 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-md border-y border-black/5 dark:border-white/5 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col gap-4">

              {/* Row 1: Search Bar - Centered & Large */}
              <div className="w-full max-w-3xl mx-auto relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#F8BE00] to-yellow-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500 ${isSearchFocused ? 'opacity-40' : ''}`} />
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                    <Search size={24} className="stroke-[2.5px]" />
                  </div>
                  <input
                    type="text"
                    value={localSearchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search styles, objects, themes..."
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    aria-label="Search prompts by title, content, or tags"
                    className="w-full h-14 pl-14 pr-12 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-xl focus:outline-none transition-all font-bold text-lg placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-sm"
                  />
                  {localSearchQuery && (
                    <button
                      onClick={() => {
                        setLocalSearchQuery('')
                        setSearchParams(prev => {
                          const newParams = new URLSearchParams(prev)
                          newParams.delete('q')
                          return newParams
                        }, { replace: true })
                      }}
                      aria-label="Clear search query"
                      className="absolute right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
                    >
                      <X size={20} className="stroke-[2.5px]" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Filters - Centered Row */}
              <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2 items-center justify-start md:justify-center min-w-max mx-auto px-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mr-2">
                    <SlidersHorizontal size={14} />
                    <span>Filters</span>
                  </div>
                  {CATEGORIES.map((cat) => {
                    const isActive = (cat === 'All' && !categoryFilter) || categoryFilter === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        aria-label={`Filter by ${cat} category`}
                        aria-pressed={isActive}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border-2 ${isActive
                          ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black shadow-md transform scale-105'
                          : 'bg-white dark:bg-black border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white hover:shadow-sm'
                          }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Results Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 border-4 border-black dark:border-white border-t-[#F8BE00] rounded-full animate-spin mb-6" />
              <p className="text-xl font-mono text-gray-500 animate-pulse">Loading library...</p>
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="text-center py-32 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Search size={32} className="text-black dark:text-white" />
              </div>
              <h3 className="text-2xl font-black mb-2">No prompts found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
                We couldn't find any prompts matching "{localSearchQuery}". Try adjusting your search or filters.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8BE00] text-black border-2 border-black font-bold rounded-lg hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <X size={18} className="stroke-[3px]" />
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 px-2 max-w-7xl mx-auto">
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm uppercase tracking-widest">
                  Showing <span className="font-black text-black dark:text-white">{filteredPrompts.length}</span> results
                </p>
              </div>

              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 max-w-7xl mx-auto"
              >
                <AnimatePresence mode='popLayout'>
                  {filteredPrompts.map((prompt, index) => (
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
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </main>

      <AnimatePresence>
        {isImageModalOpen && selectedPrompt && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              layout
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-2xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] overflow-hidden"
            >
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-[#F8BE00] hover:text-black transition-colors border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Close image viewer"
              >
                <X size={20} className="stroke-[3px]" />
              </button>

              <div className="grid md:grid-cols-[3fr_2fr] gap-0 md:gap-6">
                <div className="relative bg-gradient-to-b from-zinc-900 to-black">
                  <img
                    src={selectedPrompt.preview_image_url || ''}
                    alt={selectedPrompt.title}
                    className="w-full h-full object-contain max-h-[70vh] mx-auto bg-black"
                    loading="lazy"
                  />
                </div>

                <div className="p-6 flex flex-col gap-4 bg-white dark:bg-zinc-950">
                  <div>
                    <p className="text-sm uppercase font-black text-gray-500 dark:text-gray-400 tracking-[0.2em]">Prompt</p>
                    <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">{selectedPrompt.title}</h3>
                    <p className="mt-3 text-sm font-mono text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-lg p-3 leading-relaxed">
                      {selectedPrompt.prompt}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPrompt.tags?.map(tag => (
                      <span key={tag} className="px-3 py-1 text-xs font-black uppercase bg-black text-white rounded-full tracking-widest">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => handleSharePrompt(selectedPrompt)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg border-2 border-black hover:bg-[#F8BE00] hover:text-black transition-colors font-bold uppercase text-sm"
                    >
                      <Share2 size={18} className="stroke-[3px]" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                aria-label="Close share modal"
              >
                <X size={20} className="stroke-[3px]" />
              </button>

              <div className="p-6">
                <div className="text-center space-y-2 mb-6">
                  <p className="text-sm uppercase font-black text-gray-500 tracking-[0.2em]">Share Prompt</p>
                  <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">{sharePrompt.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Share the art link only—no extra text.</p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-b from-[#f6f0ff] via-white to-[#f6f0ff] dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 shadow-inner mb-6">
                  <div className="aspect-[16/9] bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                    <img
                      src={sharePrompt.preview_image_url || 'https://placehold.co/800x450/4b3df6/ffffff?text=Share+this+prompt'}
                      alt={sharePrompt.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-2xl font-display font-extrabold text-black dark:text-white leading-tight">This prompt rocks!</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Tell your friends, family, and the whole world.</p>
                </div>

                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => handleSharePlatform('x')}
                    className="h-14 w-14 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
                    aria-label="Share on X"
                  >
                    <span className="text-lg font-black text-black">X</span>
                  </button>
                  <button
                    onClick={() => handleSharePlatform('facebook')}
                    className="h-14 w-14 rounded-full bg-[#1877F2] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
                    aria-label="Share on Facebook"
                  >
                    <span className="text-lg font-black text-white">f</span>
                  </button>
                  <button
                    onClick={() => handleSharePlatform('instagram')}
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-[#FF0069] via-[#FF8A00] to-[#FFD600] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
                    aria-label="Share on Instagram"
                  >
                    <span className="text-lg font-black text-white">IG</span>
                  </button>
                  <button
                    onClick={() => handleSharePlatform('whatsapp')}
                    className="h-14 w-14 rounded-full bg-[#25D366] border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform"
                    aria-label="Share on WhatsApp"
                  >
                    <span className="text-lg font-black text-white">WA</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleDirectShare}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg border-2 border-black hover:bg-[#F8BE00] hover:text-black transition-colors font-bold uppercase text-sm"
                  >
                    <Share size={18} className="stroke-[3px]" />
                    Share from device
                  </button>
                  <button
                    onClick={handleCopyShareLink}
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

      <Footer />
    </div>
  )
}
