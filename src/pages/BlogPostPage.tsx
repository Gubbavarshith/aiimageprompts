import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, AlertCircle, Copy, Check, Twitter } from 'lucide-react'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { fetchBlogPostBySlug, formatDate, type BlogPost } from '../lib/services/blogs'
import { useToast } from '../contexts/ToastContext'

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>()
    const toast = useToast()

    const [post, setPost] = useState<BlogPost | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [imageError, setImageError] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

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

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            setHasCopied(true)
            toast.success('Link copied to clipboard')
            setTimeout(() => setHasCopied(false), 2000)
        } catch (err) {
            toast.error('Failed to copy link')
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
            // Simplified for now - in a real app better to use a library like marked or remark
            let html = content
                .replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mt-8 mb-4 tracking-tight">$1</h3>')
                .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mt-12 mb-6 tracking-tight border-l-4 border-[#FFDE1A] pl-4">$1</h2>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-zinc-900 dark:text-white">$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
                .replace(/`(.*?)`/gim, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-sm text-red-500 font-medium">$1</code>')
                .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-zinc-300 dark:border-zinc-700 pl-6 italic my-8 text-xl text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 py-4 pr-4 rounded-r-lg">$1</blockquote>')
                .replace(/^- (.*$)/gim, '<li class="ml-4 pl-2 border-l-2 border-zinc-200 dark:border-zinc-800 mb-2">$1</li>')
                .split('\n\n')
                .map(para => para.trim() ? `<p class="mb-6 leading-8 text-lg text-zinc-700 dark:text-zinc-300">${para}</p>` : '')
                .join('')

            html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul class="list-none ml-0 mb-8 space-y-2">$&</ul>')

            return html
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#09090b]">
                <FloatingNavbar />
                <main className="flex items-center justify-center min-h-[80vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#FFDE1A]" />
                        <p className="text-sm font-medium text-zinc-400">Loading article...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#09090b]">
                <FloatingNavbar />
                <main className="flex items-center justify-center min-h-[80vh] px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Article not found</h1>
                        <p className="text-zinc-500 mb-8">
                            {error || 'The article you looking for doesn\'t exist or has been removed.'}
                        </p>
                        <Link to="/blog" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold hover:opacity-90 transition-opacity">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Journal
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans">
            <FloatingNavbar />

            {/* Scroll Progress Bar could go here */}

            <main className="pt-32 pb-24">
                <article className="max-w-3xl mx-auto px-6 lg:px-8">

                    {/* Back Link */}
                    <div className="mb-12">
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Journal
                        </Link>
                    </div>

                    {/* Article Header */}
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFDE1A] text-black">
                                {post.category}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                {formatDate(post.date)}
                            </span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center justify-between border-y border-zinc-100 dark:border-zinc-800 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300">
                                    {post.author.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-none mb-1">{post.author}</p>
                                    <p className="text-xs font-medium text-zinc-500">
                                        {post.readTime} read
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={handleCopyLink} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    {hasCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <Twitter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.imageUrl && (
                        <div className="mb-16 -mx-6 md:-mx-12 lg:-mx-20 rounded-2xl overflow-hidden shadow-sm bg-zinc-100 dark:bg-zinc-800">
                            {!imageError ? (
                                <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    onError={() => setImageError(true)}
                                    className="w-full h-auto object-cover max-h-[600px]"
                                />
                            ) : (
                                <div className="w-full aspect-[21/9] flex items-center justify-center text-zinc-400 text-sm font-medium">
                                    Image not available
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Body */}
                    <div className="article-content max-w-none">
                        {post.excerpt && (
                            <p className="text-xl md:text-2xl leading-relaxed font-medium text-zinc-900 dark:text-white mb-12 border-l-4 border-[#FFDE1A] pl-6 py-1">
                                {post.excerpt}
                            </p>
                        )}

                        <div
                            className="text-lg text-zinc-700 dark:text-zinc-300 leading-8 space-y-8"
                            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Related Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                </article>
            </main>

            {/* Read Next Section could go here */}

            <Footer />
        </div>
    )
}
