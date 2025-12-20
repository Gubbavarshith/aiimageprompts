import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ChevronLeft,
    X, Globe, Save, Eye, Loader2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RichTextEditor from '@/components/admin/RichTextEditor'
import {
    fetchBlogPostByIdForAdmin,
    createBlogPost,
    updateBlogPost,
    calculateReadTime,
    generateSlug,
    BLOG_CATEGORIES,
    type CreateBlogPostPayload,
    type UpdateBlogPostPayload
} from '@/lib/services/blogs'
import { useToast } from '@/contexts/ToastContext'

export default function AdminBlogEditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const lastSaveRef = useRef<Date | null>(null)
    const [wordCount, setWordCount] = useState(0)

    // Form state
    const [title, setTitle] = useState('')
    const [excerpt, setExcerpt] = useState('')
    const [content, setContent] = useState('')
    const [author, setAuthor] = useState('')
    const [category, setCategory] = useState<string>('Technology')
    const [tags, setTags] = useState<string[]>([])
    const [newTag, setNewTag] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [status, setStatus] = useState<'Draft' | 'Published' | 'Scheduled'>('Draft')
    const [metaTitle, setMetaTitle] = useState('')
    const [metaDescription, setMetaDescription] = useState('')
    const [slug, setSlug] = useState('')

    // UI state
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Load post if editing
    useEffect(() => {
        const loadPost = async () => {
            if (!id || id === 'new') {
                setIsLoading(false)
                setIsEditing(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)
                const post = await fetchBlogPostByIdForAdmin(id)
                
                if (!post) {
                    toast.error('Blog post not found')
                    navigate('/admin/blogs', { replace: true })
                    return
                }

                setIsEditing(true)
                setTitle(post.title)
                setExcerpt(post.excerpt)
                setContent(post.content)
                setAuthor(post.author)
                setCategory(post.category)
                setTags(post.tags || [])
                setImageUrl(post.imageUrl)
                setStatus(post.status)
                setMetaTitle(post.metaTitle || '')
                setMetaDescription(post.metaDescription || '')
                setSlug(post.slug)
            } catch (err) {
                console.error('Error loading post:', err)
                setError('Failed to load blog post')
                toast.error('Failed to load blog post')
            } finally {
                setIsLoading(false)
            }
        }

        loadPost()
    }, [id, navigate, toast])

    // Auto-generate slug from title
    useEffect(() => {
        if (title && !isEditing) {
            const generatedSlug = generateSlug(title)
            setSlug(generatedSlug)
        }
    }, [title, isEditing])

    // Auto-generate meta title from title
    useEffect(() => {
        if (title && !metaTitle) {
            setMetaTitle(`${title} | AI Image Prompts`)
        }
    }, [title, metaTitle])

    // Auto-generate excerpt from content if empty (strip HTML tags for excerpt)
    useEffect(() => {
        if (content && !excerpt) {
            // Strip HTML tags to get plain text
            const textContent = content.replace(/<[^>]*>/g, '').trim()
            if (textContent.length > 150) {
                const autoExcerpt = textContent.substring(0, 150).trim() + '...'
                setExcerpt(autoExcerpt)
            }
        }
    }, [content, excerpt])

    // Add tag
    const handleAddTag = () => {
        const trimmedTag = newTag.trim()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag])
            setNewTag('')
        }
    }

    // Remove tag
    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    // Handle tag input Enter key
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    // Validate form
    const validateForm = (): string | null => {
        if (!title.trim()) return 'Title is required'
        if (!excerpt.trim()) return 'Excerpt is required'
        // Strip HTML tags to check if content has actual text
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        if (!textContent) return 'Content is required'
        if (!author.trim()) return 'Author is required'
        if (!category) return 'Category is required'
        if (!slug.trim()) return 'Slug is required'
        if (imageUrl && !isValidUrl(imageUrl)) return 'Invalid image URL'
        return null
    }

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url)
            return true
        } catch {
            return false
        }
    }

    // Save draft
    const handleSaveDraft = async () => {
        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const payload: CreateBlogPostPayload | UpdateBlogPostPayload = {
                title: title.trim(),
                excerpt: excerpt.trim(),
                content: content.trim(),
                author: author.trim(),
                category,
                tags,
                imageUrl: imageUrl.trim() || '',
                status: 'Draft',
                slug: slug.trim() || generateSlug(title),
                metaTitle: metaTitle.trim() || undefined,
                metaDescription: metaDescription.trim() || undefined,
            }

            if (isEditing && id) {
                await updateBlogPost({ ...payload, id })
                toast.success('Draft saved successfully!')
            } else {
                await createBlogPost(payload)
                toast.success('Draft created successfully!')
            }

            lastSaveRef.current = new Date()
            setLastSaved(new Date())
        } catch (err) {
            console.error('Error saving draft:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to save draft'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }

    // Publish
    const handlePublish = async () => {
        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsPublishing(true)
        setError(null)

        try {
            const payload: CreateBlogPostPayload | UpdateBlogPostPayload = {
                title: title.trim(),
                excerpt: excerpt.trim(),
                content: content.trim(),
                author: author.trim(),
                category,
                tags,
                imageUrl: imageUrl.trim() || '',
                status: 'Published',
                slug: slug.trim() || generateSlug(title),
                metaTitle: metaTitle.trim() || undefined,
                metaDescription: metaDescription.trim() || undefined,
            }

            if (isEditing && id) {
                await updateBlogPost({ ...payload, id })
                toast.success('Post published successfully!')
            } else {
                await createBlogPost(payload)
                toast.success('Post published successfully!')
            }

            // Navigate back to blog list
            setTimeout(() => {
                navigate('/admin/blogs')
            }, 1000)
        } catch (err) {
            console.error('Error publishing post:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to publish post'
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsPublishing(false)
        }
    }

    // Preview (opens in new tab)
    const handlePreview = () => {
        if (!slug) {
            toast.error('Please save the post first to generate a preview link')
            return
        }
        window.open(`/blog/${slug}`, '_blank')
    }

    // Format last saved time
    const formatLastSaved = (date: Date | null): string => {
        if (!date) return 'Never'
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins === 1) return '1 min ago'
        if (diffMins < 60) return `${diffMins} mins ago`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours === 1) return '1 hour ago'
        if (diffHours < 24) return `${diffHours} hours ago`
        return date.toLocaleDateString()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FFDE1A]" />
                    <p className="text-sm text-zinc-500">Loading blog post...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="flex items-center justify-between sticky top-[64px] lg:top-0 z-20 py-4 bg-zinc-50/90 dark:bg-[#09090b]/90 backdrop-blur-md -mx-4 px-4 lg:-mx-8 lg:px-8 border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <Link to="/admin/blogs">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
                            {isEditing ? 'Edit Blog Post' : 'New Blog Post'}
                        </h1>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className={`w-2 h-2 rounded-full block ${
                                status === 'Published' ? 'bg-green-500' :
                                status === 'Scheduled' ? 'bg-blue-500' :
                                'bg-yellow-500'
                            }`} />
                            {status} - Last saved {formatLastSaved(lastSaved)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="hidden sm:flex"
                        onClick={handlePreview}
                        disabled={!slug}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    <Button
                        className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold min-w-[100px]"
                        onClick={handlePublish}
                        disabled={isPublishing || isSaving}
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            'Publish'
                        )}
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 pb-20">
                {/* LEFT COLUMN - MAIN EDITOR */}
                <div className="space-y-6">
                    {/* Title Input */}
                    <div className="group">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter post title..."
                            className="text-4xl font-extrabold border-none shadow-none px-0 bg-transparent placeholder:text-zinc-300 dark:placeholder:text-zinc-700 h-auto focus-visible:ring-0"
                        />
                    </div>

                    {/* Excerpt Input */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Excerpt</Label>
                        <Textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Brief summary of the post (will be auto-generated from content if left empty)..."
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-zinc-500">
                            {excerpt.length} characters (recommended: 150-200)
                        </p>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="min-h-[500px]">
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Start writing your story... Use the toolbar above for rich text formatting."
                            onWordCountChange={setWordCount}
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                            <span>{wordCount} words</span>
                            <span>{calculateReadTime(content.replace(/<[^>]*>/g, ' '))}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - SIDEBAR SETTINGS */}
                <div className="space-y-6">
                    {/* Publish Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Publish</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as 'Draft' | 'Published' | 'Scheduled')}
                                    className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 focus:ring-[#FFDE1A] focus:outline-none"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                    <option value="Scheduled">Scheduled</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <Label className="text-zinc-500">Read Time</Label>
                                <span className="text-zinc-900 dark:text-white font-medium">
                                    {calculateReadTime(content)}
                                </span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleSaveDraft}
                                disabled={isSaving || isPublishing}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Draft
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* Author Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Author</h3>
                        <div className="space-y-2">
                            <Input
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Author name"
                                className="w-full"
                            />
                        </div>
                    </Card>

                    {/* Taxonomy Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Organization</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 focus:ring-[#FFDE1A] focus:outline-none"
                                >
                                    {BLOG_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex items-center gap-2 flex-wrap p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[40px]">
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="bg-zinc-100 dark:bg-zinc-800 text-xs px-2 py-1 rounded-md flex items-center gap-1"
                                        >
                                            {tag}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-red-500"
                                                onClick={() => handleRemoveTag(tag)}
                                            />
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Add tag..."
                                        className="bg-transparent text-sm focus:outline-none min-w-[60px] flex-1"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddTag}
                                    className="w-full"
                                >
                                    Add Tag
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Slug Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">URL Slug</h3>
                        <div className="space-y-2">
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="url-slug"
                                className="w-full font-mono text-sm"
                            />
                            <p className="text-xs text-zinc-500">
                                Used in the URL: /blog/{slug || 'url-slug'}
                            </p>
                        </div>
                    </Card>

                    {/* Media Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Featured Image</h3>
                        <div className="space-y-3">
                            <Input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full"
                            />
                            {imageUrl && (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        width="800"
                                        height="450"
                                        decoding="async"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                </div>
                            )}
                            <p className="text-xs text-zinc-500">
                                Enter a direct image URL
                            </p>
                        </div>
                    </Card>

                    {/* SEO Card */}
                    <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">SEO</h3>
                            <Globe className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Meta Title</Label>
                                <Input
                                    value={metaTitle}
                                    onChange={(e) => setMetaTitle(e.target.value)}
                                    placeholder="Title used for search engines"
                                />
                                <p className="text-xs text-zinc-500">
                                    {metaTitle.length} characters (recommended: 50-60)
                                </p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Meta Description</Label>
                                <Textarea
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                    placeholder="Brief description for search results"
                                    className="h-20 resize-none"
                                />
                                <p className="text-xs text-zinc-500">
                                    {metaDescription.length} characters (recommended: 150-160)
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
