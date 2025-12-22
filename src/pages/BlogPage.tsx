import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ArrowRight, Search, Filter, Tag, Mail, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { fetchBlogPosts, getBlogCategories, formatDate, type BlogPost } from '../lib/services/blogs'
import { useToast } from '../contexts/ToastContext'
import { updateCanonical } from '../lib/seo'

// --- Components ---

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase ${className}`}>
        {children}
    </span>
)

const FeaturedCard = ({ post }: { post: BlogPost }) => {
    const navigate = useNavigate()
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-500 mb-16 cursor-pointer"
            onClick={() => navigate(`/blog/${post.slug}`)}
        >
            <div className="relative h-64 lg:h-auto overflow-hidden">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                    <Badge className="bg-[#FFDE1A] text-black shadow-sm">
                        Featured
                    </Badge>
                </div>
            </div>

            <div className="flex flex-col justify-center p-8 lg:p-12 lg:pr-16">
                <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                    <span className="text-zinc-900 dark:text-zinc-200 font-bold">{post.category}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(post.date)}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white mb-4 leading-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                    {post.title}
                </h2>

                <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8 line-clamp-3">
                    {post.excerpt}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {post.author.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{post.author}</span>
                        <span className="text-xs text-zinc-500">Author</span>
                    </div>

                    <div className="ml-auto inline-flex items-center gap-2 text-sm font-bold text-[#FFDE1A] group-hover:translate-x-1 transition-transform">
                        Read Article <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

const StandardCard = ({ post, index }: { post: BlogPost; index: number }) => {
    const navigate = useNavigate()
    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/blog/${post.slug}`)}
            className="group flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-pointer h-full"
        >
            <div className="relative aspect-[3/2] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white/90 dark:bg-black/80 backdrop-blur text-zinc-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10">
                        {post.category}
                    </span>
                </div>
            </div>

            <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-3">
                    <span>{formatDate(post.date)}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                </h3>

                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-6 flex-1">
                    {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            {post.author.charAt(0)}
                        </span>
                        {post.author}
                    </div>
                    <Tag className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                </div>
            </div>
        </motion.article>
    )
}

// --- Main Page ---

const BlogPage = () => {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('All')
    const toast = useToast()

    useEffect(() => {
        document.title = 'Blog – AI Image Prompts'
        updateCanonical('/blog')
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true)
                const data = await fetchBlogPosts()
                setPosts(data)
            } catch (err) {
                toast.error('Failed to load blog posts')
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [toast])

    const categories = useMemo(() => ['All', ...getBlogCategories(posts || [])], [posts])
    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = !searchQuery ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [posts, searchQuery, selectedCategory])

    const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'All'
    const featuredPost = !hasActiveFilters && filteredPosts.length > 0 ? filteredPosts[0] : null
    const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans">
            <FloatingNavbar />

            <main className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-[#FFDE1A]" />
                                <span className="text-sm font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                                    The Journal
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-white">
                                Insights & <br className="hidden md:block" />
                                <span className="text-zinc-400 dark:text-zinc-600">Techniques.</span>
                            </h1>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="w-full md:w-auto flex flex-col gap-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#FFDE1A] transition-colors" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search articles..."
                                    className="w-full md:w-80 pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#FFDE1A]/20 focus:border-[#FFDE1A] outline-none transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide max-w-[90vw]">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${selectedCategory === cat
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                                            : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FFDE1A]" />
                            <p className="text-sm font-medium text-zinc-400">Loading insights...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {/* Featured Post (Only on main view) */}
                            {featuredPost && (
                                <FeaturedCard post={featuredPost} />
                            )}

                            {/* Grid Layout */}
                            {gridPosts.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <AnimatePresence mode="popLayout">
                                        {gridPosts.map((post, idx) => (
                                            <StandardCard key={post.id} post={post} index={idx} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                    <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
                                        <Filter className="w-6 h-6 text-zinc-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No articles found</h3>
                                    <p className="text-zinc-500 mb-6">Try adjusting your search or filters.</p>
                                    <button
                                        onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}
                                        className="text-sm font-bold text-[#FFDE1A] hover:underline"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Newsletter */}
                    <div className="mt-24 border-t border-zinc-200 dark:border-zinc-800 pt-16">
                        <div className="bg-[#111] dark:bg-white rounded-3xl p-8 md:p-16 text-center relative overflow-hidden group">

                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFDE1A] rounded-full filter blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 rounded-full filter blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity" />

                            <div className="relative z-10 max-w-2xl mx-auto">
                                <span className="inline-block p-3 rounded-xl bg-white/10 dark:bg-black/5 backdrop-blur-md mb-6">
                                    <Mail className="w-6 h-6 text-white dark:text-black" />
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-white dark:text-black mb-4 tracking-tight">
                                    Join the inner circle.
                                </h2>
                                <p className="text-lg text-zinc-400 dark:text-zinc-600 mb-8">
                                    Get the latest prompts, tips, and experiments delivered to your inbox.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        placeholder="Enter your email"
                                        className="flex-1 px-5 py-4 rounded-xl bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/10 text-white dark:text-black placeholder:text-zinc-500 focus:bg-white/20 dark:focus:bg-black/10 outline-none transition-all"
                                    />
                                    <button className="px-8 py-4 rounded-xl bg-[#FFDE1A] text-black font-bold hover:bg-[#F8BE00] transition-colors shadow-lg hover:shadow-[#FFDE1A]/20">
                                        Subscribe
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    )
}

export default BlogPage
