import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Copy, Check, ExternalLink, Trash2, Bookmark, Sparkles } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { getSavedPrompts, unsavePrompt } from '@/lib/services/savedPrompts'
import type { SavedPromptWithDetails } from '@/lib/services/savedPrompts'
import { useToast } from '@/contexts/ToastContext'

interface SavedPromptCardProps {
    savedPrompt: SavedPromptWithDetails;
    index: number;
    onCopy: (text: string, id: string) => void;
    onRemove: (promptId: string) => void;
    copiedId: string | null;
}

const SavedPromptCard = ({ savedPrompt, index, onCopy, onRemove, copiedId }: SavedPromptCardProps) => {
    const prompt = savedPrompt.prompts
    const isCopied = copiedId === prompt.id;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1]
            }}
            className="group relative flex flex-col h-full"
        >
            {/* Visual Component - The Image */}
            <div className="relative aspect-[4/3] overflow-hidden border-2 border-black dark:border-white rounded-t-xl bg-gray-100 dark:bg-zinc-800 z-10">
                <img
                    src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
                    alt={prompt.title}
                    loading="lazy"
                    width="400"
                    height="300"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Category Tag */}
                <div className="absolute top-3 left-3">
                    <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {prompt.category}
                    </span>
                </div>

                {/* Saved Date Badge */}
                <div className="absolute top-3 right-3">
                    <span className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <Bookmark size={10} className="fill-current" />
                        Saved
                    </span>
                </div>
            </div>

            {/* Info Component */}
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
                            {prompt.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div className="grid grid-cols-[1fr_auto_auto] border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
                    <button
                        onClick={() => onCopy(prompt.prompt, prompt.id)}
                        className="py-3 px-4 bg-white dark:bg-black text-black dark:text-white hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest group/btn"
                    >
                        {isCopied ? (
                            <>
                                <Check size={16} className="stroke-[3px]" />
                                <span className="hidden sm:inline">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                                <span className="hidden sm:inline">Copy Prompt</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => prompt.preview_image_url && window.open(prompt.preview_image_url, '_blank')}
                        disabled={!prompt.preview_image_url}
                        className={`w-14 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center ${!prompt.preview_image_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={prompt.preview_image_url ? "View Full Image" : "No image available"}
                    >
                        <ExternalLink size={20} className="stroke-[2.5px]" />
                    </button>

                    <button
                        onClick={() => onRemove(prompt.id)}
                        className="w-14 bg-white dark:bg-black text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                        title="Remove from Saved"
                    >
                        <Trash2 size={20} className="stroke-[2.5px]" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default function SavedPromptsPage() {
    const [savedPrompts, setSavedPrompts] = useState<SavedPromptWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [showUnsaveConfirm, setShowUnsaveConfirm] = useState<{ promptId: string; title: string } | null>(null)
    const [isRemoving, setIsRemoving] = useState<string | null>(null)

    // Clerk auth
    const { isSignedIn, isLoaded } = useAuth()
    const { user } = useUser()
    const navigate = useNavigate()
    const toast = useToast()

    // Filter prompts based on search
    const filteredPrompts = savedPrompts.filter(savedPrompt => {
        const prompt = savedPrompt.prompts
        const query = searchQuery.toLowerCase()
        return (
            prompt.title.toLowerCase().includes(query) ||
            prompt.prompt.toLowerCase().includes(query) ||
            (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(query)))
        )
    })

    useEffect(() => {
        document.title = 'Saved Prompts | AI Image Prompts'
    }, [])

    // Redirect to auth if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/auth', { replace: true, state: { from: '/saved' } })
        }
    }, [isLoaded, isSignedIn, navigate])

    // Load saved prompts
    useEffect(() => {
        let isMounted = true

        const loadSavedPrompts = async () => {
            if (!isLoaded) {
                // Wait for auth to load
                return
            }

            if (!isSignedIn || !user?.id) {
                if (isMounted) {
                    setIsLoading(false)
                }
                return
            }

            try {
                if (isMounted) {
                    setIsLoading(true)
                }
                const data = await getSavedPrompts(user.id)
                if (isMounted) {
                    setSavedPrompts(data)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error('Failed to load saved prompts:', err)
                if (isMounted) {
                    setIsLoading(false)
                    toast.error('Failed to load saved prompts. Please try again.')
                }
            }
        }

        loadSavedPrompts()

        return () => {
            isMounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id])

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedId(id)
            toast.success('Prompt copied to clipboard!')
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
            toast.error('Failed to copy prompt. Please try again.')
        }
    }

    const handleRemove = (promptId: string) => {
        const savedPrompt = savedPrompts.find(sp => sp.prompts.id === promptId)
        if (savedPrompt) {
            setShowUnsaveConfirm({ promptId, title: savedPrompt.prompts.title })
        }
    }

    const handleUnsaveConfirm = async () => {
        if (!showUnsaveConfirm || !user?.id) return

        const { promptId } = showUnsaveConfirm
        setShowUnsaveConfirm(null)
        setIsRemoving(promptId)

        try {
            await unsavePrompt(user.id, promptId)
            setSavedPrompts(prev => prev.filter(sp => sp.prompts.id !== promptId))
            toast.success('Prompt removed from your saved collection.')
        } catch (err) {
            console.error('Failed to remove prompt:', err)
            toast.error('Failed to remove prompt from saved. Please try again.')
        } finally {
            setIsRemoving(null)
        }
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
                                Saved <span className="relative inline-block px-2">
                                    <span className="absolute inset-0 bg-[#F8BE00] transform -skew-x-6 translate-y-2 opacity-100" />
                                    <span className="relative z-10 text-black">Prompts</span>
                                </span>
                            </h1>

                            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                                Your personal collection of favorite prompts.
                                <span className="inline-flex items-center gap-1 mx-2 text-black dark:text-white font-bold"><Bookmark size={16} /> Curate</span>
                                your inspiration.
                            </p>
                        </div>
                    </div>

                    {/* Search Toolbar */}
                    <div className="sticky top-20 z-30 mb-12 -mx-4 px-4 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-md border-y border-black/5 dark:border-white/5 shadow-sm">
                        <div className="max-w-3xl mx-auto relative group">
                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#F8BE00] to-yellow-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500 ${isSearchFocused ? 'opacity-40' : ''}`} />
                            <div className="relative flex items-center">
                                <div className="absolute left-4 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                                    <Search size={24} className="stroke-[2.5px]" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search your saved prompts..."
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className="w-full h-14 pl-14 pr-12 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-800 focus:border-black dark:focus:border-white rounded-xl focus:outline-none transition-all font-bold text-lg placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="w-16 h-16 border-4 border-black dark:border-white border-t-[#F8BE00] rounded-full animate-spin mb-6" />
                            <p className="text-xl font-mono text-gray-500 animate-pulse">Loading saved prompts...</p>
                        </div>
                    ) : filteredPrompts.length === 0 ? (
                        <div className="text-center py-32 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 max-w-4xl mx-auto">
                            {searchQuery ? (
                                <>
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                                        <Search size={32} className="text-black dark:text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">No matches found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
                                        We couldn't find any saved prompts matching "{searchQuery}".
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                                        <Bookmark size={32} className="text-black dark:text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">No saved prompts yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
                                        Start exploring and save your favorite prompts to build your collection.
                                    </p>
                                    <a
                                        href="/explore"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8BE00] text-black border-2 border-black font-bold rounded-lg hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        <Sparkles size={18} className="stroke-[3px]" />
                                        Explore Prompts
                                    </a>
                                </>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20 max-w-7xl mx-auto"
                        >
                            <AnimatePresence mode='popLayout'>
                                {filteredPrompts.map((savedPrompt, index) => (
                                    <SavedPromptCard
                                        key={savedPrompt.id}
                                        savedPrompt={savedPrompt}
                                        index={index}
                                        onCopy={handleCopy}
                                        onRemove={handleRemove}
                                        copiedId={copiedId}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}

                </div>
            </main>

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
                                        disabled={isRemoving === showUnsaveConfirm.promptId}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRemoving === showUnsaveConfirm.promptId ? 'Removing...' : 'Remove'}
                                    </button>
                                    <button
                                        onClick={() => setShowUnsaveConfirm(null)}
                                        disabled={isRemoving === showUnsaveConfirm.promptId}
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
