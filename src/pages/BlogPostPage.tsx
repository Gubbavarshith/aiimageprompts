import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Clock, ArrowLeft, Share2, Loader2, AlertCircle } from 'lucide-react'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { Button } from '../components/ui/button'
import { fetchBlogPostBySlug, formatDate, type BlogPost } from '../lib/services/blogs'
import { useToast } from '../contexts/ToastContext'

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>()
    const toast = useToast()

    const [post, setPost] = useState<BlogPost | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        const loadPost = async () => {
            if (!slug) {
                setError('Invalid blog post URL')
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)
                const data = await fetchBlogPostBySlug(slug)
                
                if (!data) {
                    setError('Blog post not found')
                    return
                }

                setPost(data)
                document.title = `${data.title} | AI Image Prompts`
            } catch (err) {
                console.error('Failed to load blog post:', err)
                setError('Failed to load blog post. Please try again later.')
                toast.error('Failed to load blog post')
            } finally {
                setIsLoading(false)
            }
        }

        loadPost()
    }, [slug, toast])

    const handleShare = async () => {
        if (!post) return

        const shareUrl = window.location.href
        const shareText = `Check out this article: ${post.title}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: shareText,
                    url: shareUrl,
                })
            } catch (err) {
                // User cancelled or error occurred
                console.log('Share cancelled or failed')
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(shareUrl)
                toast.success('Link copied to clipboard!')
            } catch (err) {
                toast.error('Failed to copy link')
            }
        }
    }

    // Check if content is HTML or markdown and format accordingly
    const formatContent = (content: string): string => {
        // Check if content contains HTML tags
        const hasHtmlTags = /<[^>]+>/.test(content)
        
        if (hasHtmlTags) {
            // Content is already HTML, just return it with styling classes
            return content
        } else {
            // Content is markdown, convert to HTML (for backward compatibility)
            let html = content
                // Headers
                .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>')
                .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-10 mb-6">$1</h2>')
                // Bold
                .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
                // Italic
                .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
                // Code
                .replace(/`(.*?)`/gim, '<code class="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-mono text-sm">$1</code>')
                // Quotes
                .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-[#F8BE00] pl-4 italic my-4">$1</blockquote>')
                // Lists
                .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
                // Paragraphs
                .split('\n\n')
                .map(para => para.trim() ? `<p class="mb-4 leading-relaxed">${para}</p>` : '')
                .join('')

            // Wrap list items in ul tags
            html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul class="list-disc ml-6 mb-4 space-y-2">$&</ul>')

            return html
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
                <FloatingNavbar />
                <main className="flex items-center justify-center min-h-[60vh] pt-32">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-[#F8BE00]" />
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Loading blog post...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans">
                <FloatingNavbar />
                <main className="flex items-center justify-center min-h-[60vh] pt-32 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {error || 'The blog post you\'re looking for doesn\'t exist or has been removed.'}
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link to="/blog">
                                <Button className="bg-[#F8BE00] text-black hover:bg-[#FFD700] font-bold">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Blog
                                </Button>
                            </Link>
                            <Link to="/">
                                <Button variant="outline">
                                    Go Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-[#F8BE00] selection:text-black">
            <FloatingNavbar />

            <main className="pt-32 pb-20">
                <article className="max-w-4xl mx-auto px-4">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Blog
                        </Link>
                    </motion.div>

                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-12"
                    >
                        {/* Category Badge */}
                        <div className="mb-6">
                            <span className="inline-block bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-4 py-2 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {post.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-tight mb-6">
                            {post.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs">
                                    {post.author.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold">{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(post.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime}</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {post.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-xs font-black uppercase bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 px-3 py-1 rounded"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            aria-label={`Share article: ${post.title}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] transition-colors font-bold text-sm"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </motion.header>

                    {/* Featured Image */}
                    {post.imageUrl && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mb-12 rounded-xl overflow-hidden border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
                        >
                            {!imageError ? (
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    onError={() => setImageError(true)}
                                    width="1200"
                                    height="675"
                                    decoding="async"
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-[#F8BE00] to-yellow-600 flex items-center justify-center">
                                    <p className="text-black font-bold text-lg">Image not available</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-lg dark:prose-invert max-w-none"
                    >
                        {/* Excerpt */}
                        {post.excerpt && (
                            <div className="mb-8 p-6 bg-gray-50 dark:bg-zinc-900 border-l-4 border-[#F8BE00] rounded-r-lg">
                                <p className="text-xl font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                    {post.excerpt}
                                </p>
                            </div>
                        )}

                        {/* Main Content */}
                        <div
                            className="blog-content text-lg leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />
                    </motion.div>

                    {/* Footer Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 pt-8 border-t-2 border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F8BE00] text-black border-2 border-black font-bold rounded-lg hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Blog
                        </Link>
                        <button
                            onClick={handleShare}
                            aria-label={`Share article: ${post.title}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white font-bold rounded-lg hover:bg-[#F8BE00] hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            <Share2 className="w-4 h-4" />
                            Share Article
                        </button>
                    </motion.div>
                </article>
            </main>

            <Footer />
        </div>
    )
}

