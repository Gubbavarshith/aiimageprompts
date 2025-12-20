import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ArrowRight, Sparkles, Search, X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { fetchBlogPosts, getBlogCategories, formatDate, type BlogPost } from '../lib/services/blogs'
import { useToast } from '../contexts/ToastContext'
import { subscribeEmail } from '../lib/services/emailSubscriptions'

const POSTS_PER_PAGE = 6

interface BlogCardProps {
    post: BlogPost
    index: number
}

const BlogCard = ({ post, index }: BlogCardProps) => {
    const [imageError, setImageError] = useState(false)
    const navigate = useNavigate()

    const handleClick = () => {
        navigate(`/blog/${post.slug}`)
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onClick={handleClick}
            className="group flex flex-col h-full bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
            {/* Image Section */}
            <div className="relative h-56 overflow-hidden border-b-2 border-black dark:border-white">
                {!imageError ? (
                    <img
                        src={post.imageUrl}
                        alt={post.title}
                        onError={() => setImageError(true)}
                        width="400"
                        height="224"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#F8BE00] to-yellow-600 flex items-center justify-center">
                        <div className="text-center p-4">
                            <Sparkles className="w-12 h-12 text-black mx-auto mb-2" />
                            <p className="text-black font-bold text-sm">{post.title}</p>
                        </div>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {post.category}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow p-6 relative">
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                    </div>
                </div>

                <h3 className="text-2xl font-display font-black leading-tight mb-3 group-hover:text-[#F8BE00] transition-colors">
                    {post.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-6 font-medium leading-relaxed">
                    {post.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-black uppercase bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="mt-auto pt-6 border-t-2 border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs border-2 border-transparent">
                            {post.author.charAt(0)}
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide">{post.author}</span>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-[#F8BE00] border-2 border-black flex items-center justify-center transform transition-transform group-hover:rotate-45">
                        <ArrowRight className="w-5 h-5 text-black stroke-[3px]" />
                    </div>
                </div>
            </div>
        </motion.article>
    )
}

const BlogPage = () => {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const [currentPage, setCurrentPage] = useState(1)
    const [newsletterEmail, setNewsletterEmail] = useState('')
    const [isSubscribing, setIsSubscribing] = useState(false)
    const toast = useToast()

    useEffect(() => {
        document.title = 'Blog – Aiimageprompts'
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const data = await fetchBlogPosts()
                setPosts(data)
            } catch (err) {
                console.error('Failed to load blog posts:', err)
                const message = 'We couldn’t load the latest posts. Please try again in a moment.'
                setError(message)
                toast.error(message)
            } finally {
                setIsLoading(false)
            }
        }

        loadPosts()
    }, [toast])

    const categories = useMemo(() => {
        if (posts.length === 0) return []
        return ['All', ...getBlogCategories(posts)]
    }, [posts])

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = searchQuery === '' ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                post.author.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory

            return matchesSearch && matchesCategory
        })
    }, [posts, searchQuery, selectedCategory])

    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
    const paginatedPosts = useMemo(() => {
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE
        return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE)
    }, [filteredPosts, currentPage])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setCurrentPage(1) // Reset to first page on search
    }

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category)
        setCurrentPage(1) // Reset to first page on category change
    }

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!newsletterEmail.trim()) {
            toast.error('Please enter a valid email address.')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(newsletterEmail)) {
            toast.error('Please enter a valid email address.')
            return
        }

        setIsSubscribing(true)
        try {
            const result = await subscribeEmail(newsletterEmail.trim())
            if (result.success) {
                toast.success('You’re subscribed to prompt updates.')
                setNewsletterEmail('')
            } else {
                toast.error(result.error || 'Something went wrong. Please try again.')
            }
        } catch (err) {
            console.error('Newsletter subscription error:', err)
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsSubscribing(false)
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-[#F8BE00] selection:text-black">
            <FloatingNavbar />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto space-y-20">

                    {/* Header Section */}
                    <div className="relative text-center space-y-8 max-w-4xl mx-auto py-16">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-10 w-16 h-16 bg-[#F8BE00] rounded-full mix-blend-multiply filter blur-xl opacity-70" />
                        <div className="absolute -bottom-10 left-10 w-24 h-24 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70" />

                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-black dark:border-white bg-[#F8BE00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-6 transform -rotate-1"
                        >
                                <Sparkles className="w-4 h-4 text-black fill-black" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-black">
                                Curated insights for image‑driven work
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-black tracking-tighter leading-none"
                        >
                            Ideas for people who think in images <br />
                            <span className="relative inline-block px-4 mt-2">
                                <span className="absolute inset-0 bg-black dark:bg-white transform -skew-x-3 translate-y-2 opacity-100" />
                                <span className="relative z-10 text-white dark:text-black">
                                    not just prompts.
                                </span>
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-bold max-w-2xl mx-auto leading-relaxed pt-4"
                        >
                            Essays, breakdowns, and experiments on using AI image tools with taste, direction, and intent.
                        </motion.p>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="sticky top-20 z-30 -mx-4 px-4 py-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-y border-black/5 dark:border-white/5 transition-all shadow-sm">
                        <div className="max-w-6xl mx-auto space-y-4">
                            {/* Search Bar */}
                            <div className="relative max-w-2xl mx-auto">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search articles, topics, or authors"
                                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/10 dark:border-white/10 focus:border-[#F8BE00] focus:outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 font-medium"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X size={18} className="text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Category Filters */}
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              {categories.map(category => (
                                <button
                                  key={category}
                                  onClick={() => handleCategoryChange(category)}
                                  aria-label={`Filter by ${category === 'All' ? 'All topics' : category} category`}
                                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    selectedCategory === category
                                      ? 'bg-[#F8BE00] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                      : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-zinc-800 hover:border-[#F8BE00] hover:text-black dark:hover:text-white'
                                  }`}
                                >
                                  {category === 'All' ? 'All topics' : category}
                                </button>
                              ))}
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-32">
                            <Loader2 className="w-12 h-12 animate-spin text-[#F8BE00] mb-4" />
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                                Loading articles…
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-32 bg-red-50 dark:bg-red-900/10 rounded-xl border-2 border-red-200 dark:border-red-800">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">
                                Something went wrong.
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">{error}</p>
                        </div>
                    )}

                    {/* Posts Grid */}
                    {!isLoading && !error && (
                        <>
                            {paginatedPosts.length === 0 ? (
                                <div className="text-center py-32 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
                                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-black border-2 border-black dark:border-white rounded-full mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                                        <Search size={32} className="text-black dark:text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2">No posts match your filters (yet).</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto font-medium">
                                        {searchQuery || selectedCategory !== 'All'
                                            ? 'Try clearing your filters or broadening your search to see more posts.'
                                            : 'New pieces are added over time. Check back soon or explore prompts instead.'}
                                    </p>
                                    {(searchQuery || selectedCategory !== 'All') && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('')
                                                setSelectedCategory('All')
                                            }}
                                            aria-label="Clear all filters"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8BE00] text-black border-2 border-black font-bold rounded-lg hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        >
                                            <X size={18} />
                                            Clear filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12">
                                        <AnimatePresence mode="popLayout">
                                            {paginatedPosts.map((post, index) => (
                                                <BlogCard key={post.id} post={post} index={index} />
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 pt-8">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg border-2 border-black dark:border-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8BE00] hover:text-black transition-all disabled:hover:bg-transparent"
                                                aria-label="Go to previous page"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        aria-label={`Go to page ${page}`}
                                                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                                            currentPage === page
                                                                ? 'bg-[#F8BE00] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-zinc-800 hover:border-[#F8BE00]'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg border-2 border-black dark:border-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8BE00] hover:text-black transition-all disabled:hover:bg-transparent"
                                                aria-label="Go to next page"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Results Count */}
                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                        Showing{' '}
                                        {paginatedPosts.length > 0 ? (currentPage - 1) * POSTS_PER_PAGE + 1 : 0}
                                        {' – '}
                                        {Math.min(currentPage * POSTS_PER_PAGE, filteredPosts.length)} of{' '}
                                        {filteredPosts.length} posts
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Newsletter Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="rounded-3xl bg-[#F8BE00] border-4 border-black p-8 md:p-16 text-center space-y-8 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]"
                    >
                        {/* Pattern Background */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" style={{ backgroundSize: '20px 20px', backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)' }} />

                                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                                <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter">
                                Stay ahead of the prompt curve
                            </h2>
                            <p className="text-xl font-bold text-black/80">
                                Get occasional, high-signal updates on new prompts, case studies, and workflows.
                            </p>

                            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto pt-4">
                                <input
                                    type="email"
                                    value={newsletterEmail}
                                    onChange={(e) => setNewsletterEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={isSubscribing}
                                    required
                                    className="flex-1 px-6 py-4 rounded-xl bg-white border-4 border-black text-black placeholder:text-gray-400 font-bold uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubscribing}
                                    className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest border-4 border-black hover:bg-white hover:text-black transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {isSubscribing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Subscribing…
                                        </>
                                    ) : (
                                        'Get updates'
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default BlogPage
