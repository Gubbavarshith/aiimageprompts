import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ChevronLeft,
    X, Save, Eye, Loader2, AlertCircle, AlertTriangle, Upload, RefreshCw} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { supabase } from '@/lib/supabaseClient'
import {
    fetchBlogPostByIdForAdmin,
    createBlogPost,
    updateBlogPost,
    calculateReadTime,
    generateSlug,
    BLOG_CATEGORIES,
    type CreateBlogPostPayload,
    type UpdateBlogPostPayload,
    type BlogPost
} from '@/lib/services/blogs'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

// ============================================================================
// UTILITY FUNCTIONS FOR ANCHOR GENERATION AND HEADING VALIDATION
// ============================================================================

/**
 * Generate a stable anchor ID from heading text
 */
const generateAnchorId = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Unified regex for extracting headings (H2-H4)
 */
const HEADING_REGEX = /<h([2-4])(?:\s+id="([^"]*)")?[^>]*>([^<]*)<\/h\1>/gi

/**
 * Add anchor IDs to H2-H4 headings in HTML content
 */
const addAnchorIdsToContent = (html: string): string => {
    // Match H2, H3, H4 headings without existing IDs using unified regex pattern
    return html.replace(HEADING_REGEX, (match, level, existingId, text) => {
        // Check if already has an id attribute
        if (existingId) return match

        const id = generateAnchorId(text)
        if (!id) return match // Don't add empty IDs

        return `<h${level} id="${id}">${text}</h${level}>`
    })
}

/**
 * Validate heading structure and return warnings
 */
const validateHeadingStructure = (html: string): string[] => {
    const warnings: string[] = []

    // Check for H1 in content (should only be the title)
    if (/<h1[\s>]/i.test(html)) {
        warnings.push('H1 headings should not be used in content. Use H2 for main sections.')
    }

    // Extract heading levels in order using unified pattern
    const headingMatches = html.match(/<h([2-6])[\s>]/gi) || []
    const levels = headingMatches.map(h => {
        const match = h.match(/\d/)
        return match ? parseInt(match[0]) : 0
    }).filter(l => l > 0)

    // Check for heading hierarchy skips (e.g., H2 -> H4)
    for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
            warnings.push(`Heading hierarchy skip: H${levels[i - 1]} followed by H${levels[i]}. Consider using H${levels[i - 1] + 1} instead.`)
            break // Only show one warning for hierarchy issues
        }
    }

    return warnings
}

/**
 * Extract headings from content for outline panel
 */
const extractHeadings = (html: string): { level: number; text: string; id: string }[] => {
    const headings: { level: number; text: string; id: string }[] = []
    const regex = new RegExp(HEADING_REGEX.source, HEADING_REGEX.flags)

    let match
    while ((match = regex.exec(html)) !== null) {
        const level = parseInt(match[1])
        const existingId = match[2]
        const text = match[3].replace(/<[^>]*>/g, '').trim()
        const id = existingId || generateAnchorId(text)

        if (text) {
            headings.push({ level, text, id })
        }
    }

    return headings
}

export default function AdminBlogEditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const toast = useToast()
    const lastSaveRef = useRef<Date | null>(null)
    const editorContentRef = useRef<HTMLDivElement>(null)
    const [wordCount, setWordCount] = useState(0)
    
    // Track user edits to prevent auto-overwrites
    const [hasUserEditedMetaTitle, setHasUserEditedMetaTitle] = useState(false)
    const [hasUserEditedExcerpt, setHasUserEditedExcerpt] = useState(false)
    const [hasUserEditedSlug, setHasUserEditedSlug] = useState(false)
    
    // Track unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const initialFormDataRef = useRef<string>('')

    // Collapsible states
    const [isMetadataOpen, setIsMetadataOpen] = useState(true)
    const [isSeoOpen, setIsSeoOpen] = useState(false)
    const [isOutlineOpen, setIsOutlineOpen] = useState(true)

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
    const [scheduledAt, setScheduledAt] = useState<string>('')
    const [metaTitle, setMetaTitle] = useState('')
    const [metaDescription, setMetaDescription] = useState('')
    const [slug, setSlug] = useState('')
    const [showToc, setShowToc] = useState(false)

    // UI state
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Image Upload Logic - Prevent concurrent uploads
    const processImageFile = async (file: File) => {
        // Prevent concurrent uploads
        if (isUploading) {
            toast.error('Please wait for the current upload to finish')
            return
        }

        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
        if (!validImageTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, WebP, GIF, or SVG)')
            return
        }

        // Validate file size (10MB)
        const MAX_SIZE_BYTES = 10 * 1024 * 1024
        if (file.size > MAX_SIZE_BYTES) {
            toast.error('Image is too large. Max supported size is 10MB.')
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `admin-uploads/${fileName}`

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

            setImageUrl(urlData.publicUrl)
            toast.success('Image uploaded successfully')
        } catch (err: any) {
            console.error('Error uploading image:', err)
            const errorMessage = err?.message || 'Failed to upload image'
            
            // Provide helpful error messages for common issues
            if (errorMessage.includes('maximum allowed size') || errorMessage.includes('exceeded')) {
                toast.error('File size exceeds bucket limit. Please update your Supabase storage bucket settings to allow files up to 10MB, or compress the image.')
            } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
                toast.error('Permission denied. Please check your storage bucket policies in Supabase dashboard.')
            } else {
                toast.error(`Upload failed: ${errorMessage}`)
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && !isUploading) processImageFile(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!isUploading) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (!isUploading) {
            const file = e.dataTransfer.files?.[0]
            if (file) processImageFile(file)
        }
    }

    // Computed values
    const headingWarnings = useMemo(() => validateHeadingStructure(content), [content])
    const contentHeadings = useMemo(() => extractHeadings(content), [content])

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

                if (post.scheduledAt) {
                    const scheduledDate = new Date(post.scheduledAt)
                    const year = scheduledDate.getFullYear()
                    const month = String(scheduledDate.getMonth() + 1).padStart(2, '0')
                    const day = String(scheduledDate.getDate()).padStart(2, '0')
                    const hours = String(scheduledDate.getHours()).padStart(2, '0')
                    const minutes = String(scheduledDate.getMinutes()).padStart(2, '0')
                    setScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`)
                } else {
                    setScheduledAt('')
                }
                setMetaTitle(post.metaTitle || '')
                setMetaDescription(post.metaDescription || '')
                setSlug(post.slug)
                setShowToc(post.showToc || false)
                
                // Reset user edit flags when loading existing post
                setHasUserEditedMetaTitle(!!post.metaTitle)
                setHasUserEditedExcerpt(!!post.excerpt)
                setHasUserEditedSlug(true) // Slug is always user-edited when loading existing post
                
                // Store initial form data for unsaved changes detection
                initialFormDataRef.current = JSON.stringify({
                    title: post.title,
                    excerpt: post.excerpt,
                    content: post.content,
                    author: post.author,
                    category: post.category,
                    tags: post.tags || [],
                    imageUrl: post.imageUrl,
                    status: post.status,
                    slug: post.slug,
                    metaTitle: post.metaTitle || '',
                    metaDescription: post.metaDescription || '',
                    scheduledAt: post.scheduledAt || '',
                    showToc: post.showToc || false
                })
                setHasUnsavedChanges(false)
            } catch (err) {
                console.error('Error loading post:', err)
                setError('Failed to load blog post')
                toast.error('Failed to load blog post')
            } finally {
                setIsLoading(false)
            }
        }

        loadPost()
    }, [id, navigate])

    // Auto-generate slug (only if user hasn't manually edited it)
    useEffect(() => {
        if (title && !isEditing && !hasUserEditedSlug) {
            const generatedSlug = generateSlug(title)
            setSlug(generatedSlug)
        }
    }, [title, isEditing, hasUserEditedSlug])

    // Auto-generate meta title (only if user hasn't manually edited it)
    useEffect(() => {
        if (title && !hasUserEditedMetaTitle) {
            setMetaTitle(`${title} | AI Image Prompts`)
        }
    }, [title, hasUserEditedMetaTitle])

    // Auto-generate excerpt (only if user hasn't manually edited it)
    useEffect(() => {
        if (content && !hasUserEditedExcerpt) {
            const textContent = content.replace(/<[^>]*>/g, '').trim()
            if (textContent.length > 150) {
                const autoExcerpt = textContent.substring(0, 150).trim() + '...'
                setExcerpt(autoExcerpt)
            }
        }
    }, [content, hasUserEditedExcerpt])

    // Track form changes for unsaved changes detection
    useEffect(() => {
        if (isLoading) return
        
        const currentFormData = JSON.stringify({
            title,
            excerpt,
            content,
            author,
            category,
            tags,
            imageUrl,
            status,
            slug,
            metaTitle,
            metaDescription,
            scheduledAt,
            showToc
        })
        
        setHasUnsavedChanges(currentFormData !== initialFormDataRef.current)
    }, [title, excerpt, content, author, category, tags, imageUrl, status, slug, metaTitle, metaDescription, scheduledAt, showToc, isLoading])

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasUnsavedChanges])

    // Handle in-app navigation with unsaved changes warning
    const handleNavigation = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
            if (!confirmed) return false
        }
        return true
    }, [hasUnsavedChanges])

    // Regenerate slug from current title
    const handleRegenerateSlug = () => {
        if (title) {
            const generatedSlug = generateSlug(title)
            setSlug(generatedSlug)
            setHasUserEditedSlug(false) // Allow auto-updates after regeneration
        }
    }

    const handleAddTag = () => {
        const trimmedTag = newTag.trim()
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag])
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    const validateForm = (): string | null => {
        if (!title.trim()) return 'Title is required'
        if (!excerpt.trim()) return 'Excerpt is required'
        const textContent = content.replace(/<[^>]*>/g, '').trim()
        if (!textContent) return 'Content is required'
        if (!author.trim()) return 'Author is required'
        if (!category) return 'Category is required'
        if (!slug.trim()) return 'Slug is required'
        if (imageUrl && !isValidUrl(imageUrl)) return 'Invalid image URL'
        if (status === 'Scheduled' && !scheduledAt) return 'Scheduled date and time is required'
        if (status === 'Scheduled' && scheduledAt) {
            const scheduledDate = new Date(scheduledAt)
            const now = new Date()
            if (scheduledDate <= now) return 'Scheduled date must be in the future'
        }
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

    const formatScheduledDate = (dateTimeLocal: string): string => {
        if (!dateTimeLocal) return ''
        return new Date(dateTimeLocal).toISOString()
    }

    const handleSaveDraft = async () => {
        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const contentWithAnchors = addAnchorIdsToContent(content.trim())
            const payload: CreateBlogPostPayload | UpdateBlogPostPayload = {
                title: title.trim(),
                excerpt: excerpt.trim(),
                content: contentWithAnchors,
                author: author.trim(),
                category,
                tags,
                imageUrl: imageUrl.trim() || '',
                status: status === 'Scheduled' ? 'Scheduled' : 'Draft',
                slug: slug.trim() || generateSlug(title),
                metaTitle: metaTitle.trim() || undefined,
                metaDescription: metaDescription.trim() || undefined,
                scheduledAt: status === 'Scheduled' && scheduledAt ? formatScheduledDate(scheduledAt) : undefined,
                showToc,
            }

            let savedPost: BlogPost
            if (isEditing && id) {
                savedPost = await updateBlogPost({ ...payload, id })
                toast.success('Draft saved successfully!')
            } else {
                savedPost = await createBlogPost(payload)
                toast.success('Draft created successfully!')
                
                // After creating, switch to edit mode and update URL
                setIsEditing(true)
                navigate(`/admin/blogs/${savedPost.id}`, { replace: true })
            }

            // Update initial form data ref after save
            initialFormDataRef.current = JSON.stringify({
                title: savedPost.title,
                excerpt: savedPost.excerpt,
                content: savedPost.content,
                author: savedPost.author,
                category: savedPost.category,
                tags: savedPost.tags || [],
                imageUrl: savedPost.imageUrl,
                status: savedPost.status,
                slug: savedPost.slug,
                metaTitle: savedPost.metaTitle || '',
                metaDescription: savedPost.metaDescription || '',
                scheduledAt: savedPost.scheduledAt || '',
                showToc: savedPost.showToc || false
            })
            setHasUnsavedChanges(false)

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

    const handlePublish = async () => {
        const validationError = validateForm()
        if (validationError) {
            toast.error(validationError)
            return
        }

        setIsPublishing(true)
        setError(null)

        try {
            const finalStatus = status === 'Scheduled' ? 'Scheduled' : 'Published'
            const contentWithAnchors = addAnchorIdsToContent(content.trim())
            const payload: CreateBlogPostPayload | UpdateBlogPostPayload = {
                title: title.trim(),
                excerpt: excerpt.trim(),
                content: contentWithAnchors,
                author: author.trim(),
                category,
                tags,
                imageUrl: imageUrl.trim() || '',
                status: finalStatus,
                slug: slug.trim() || generateSlug(title),
                metaTitle: metaTitle.trim() || undefined,
                metaDescription: metaDescription.trim() || undefined,
                scheduledAt: status === 'Scheduled' && scheduledAt ? formatScheduledDate(scheduledAt) : undefined,
                showToc,
            }

            let savedPost: BlogPost
            if (isEditing && id) {
                savedPost = await updateBlogPost({ ...payload, id })
                toast.success(finalStatus === 'Scheduled' ? 'Post scheduled successfully!' : 'Post published successfully!')
            } else {
                savedPost = await createBlogPost(payload)
                toast.success(finalStatus === 'Scheduled' ? 'Post scheduled successfully!' : 'Post published successfully!')
            }

            // Update initial form data ref after publish
            initialFormDataRef.current = JSON.stringify({
                title: savedPost.title,
                excerpt: savedPost.excerpt,
                content: savedPost.content,
                author: savedPost.author,
                category: savedPost.category,
                tags: savedPost.tags || [],
                imageUrl: savedPost.imageUrl,
                status: savedPost.status,
                slug: savedPost.slug,
                metaTitle: savedPost.metaTitle || '',
                metaDescription: savedPost.metaDescription || '',
                scheduledAt: savedPost.scheduledAt || '',
                showToc: savedPost.showToc || false
            })
            setHasUnsavedChanges(false)

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

    const handlePreview = () => {
        if (!slug || !isEditing || !id) {
            toast.error('Please save the post first to generate a preview link')
            return
        }
        window.open(`/blog/${slug}`, '_blank')
    }

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 bg-[#fbfbfb] dark:bg-[#0c0c0e] py-4 border-b border-zinc-200 dark:border-white/5 -mx-6 px-6 sm:-mx-8 sm:px-8">
                        <div className="flex items-center gap-4">
                    <Link 
                        to="/admin/blogs"
                        onClick={(e) => {
                            if (!handleNavigation()) {
                                e.preventDefault()
                            }
                        }}
                    >
                        <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0 h-9 w-9 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white truncate">
                                    {isEditing ? 'Edit Blog Post' : 'New Blog Post'}
                                </h1>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full block flex-shrink-0",
                                status === 'Published' ? 'bg-green-500' :
                                    status === 'Scheduled' ? 'bg-blue-500' : 'bg-yellow-500'
                            )} />
                            <span className="truncate">{status} • Saved {formatLastSaved(lastSaved)}</span>
                                </div>
                            </div>
                        </div>
                <div className="flex items-center gap-2">
                            <Button
                        variant="ghost"
                        size="sm"
                                className="hidden sm:flex"
                                onClick={handlePreview}
                        disabled={!slug || !isEditing || !id}
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                            </Button>
                            <Button
                                variant="outline"
                        size="sm"
                        onClick={handleSaveDraft}
                        disabled={isSaving || isPublishing}
                            >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Draft
                            </Button>
                            <Button
                        className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold"
                        size="sm"
                                onClick={handlePublish}
                                disabled={isPublishing || isSaving}
                            >
                                {isPublishing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {status === 'Scheduled' ? 'Scheduling...' : 'Publishing...'}
                                    </>
                                ) : (
                            status === 'Scheduled' ? 'Schedule Post' : 'Publish Post'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Error Alert */}
                    {error && (
                <Alert variant="destructive" className="border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Main Content (Left Column) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title & Excerpt */}
                    <Card className="p-6 border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
                        <div className="space-y-4">
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter post title..."
                                className="text-3xl font-extrabold border-none shadow-none px-0 bg-transparent placeholder:text-zinc-200 dark:placeholder:text-zinc-800 h-auto focus-visible:ring-0 transition-all p-0"
                                />

                            <div className="space-y-2">
                                <Label className="sr-only">Excerpt</Label>
                                <Textarea
                                    value={excerpt}
                                    onChange={(e) => {
                                        setExcerpt(e.target.value)
                                        setHasUserEditedExcerpt(true)
                                    }}
                                    placeholder="Write a brief excerpt or summary..."
                                    rows={3}
                                    maxLength={200}
                                    className="resize-none border-t border-b-0 border-x-0 border-zinc-100 dark:border-white/5 rounded-none shadow-none px-0 bg-transparent placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus-visible:ring-0 italic text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg"
                                />
                                <div className="flex justify-end">
                                    <span className={cn(
                                        "text-[10px] font-mono",
                                        excerpt.length >= 150 && excerpt.length <= 200
                                            ? "text-green-500"
                                            : "text-zinc-400"
                                    )}>
                                        {excerpt.length} / 200 characters
                                    </span>
                            </div>
                                </div>
                            </div>
                    </Card>

                    {/* Rich Text Editor */}
                    <Card className="border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                        {/* Warnings */}
                            {headingWarnings.length > 0 && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50">
                                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 text-sm">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold mb-1">Structure Suggestions:</p>
                                        <ul className="list-disc pl-4 space-y-0.5 opacity-90 text-xs">
                                            {headingWarnings.map((warning, i) => (
                                                <li key={i}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            )}
                        <div className="flex-1" ref={editorContentRef}>
                            <RichTextEditor
                                content={content}
                                onChange={setContent}
                                placeholder="Start writing your story..."
                                onWordCountChange={setWordCount}
                            />
                        </div>
                        <div className="px-6 py-3 bg-zinc-50 dark:bg-white/5 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500">
                            <div className="flex items-center gap-4">
                                <span>{wordCount} Words</span>
                                <span>{calculateReadTime(content.replace(/<[^>]*>/g, ' '))} Read</span>
                    </div>
                            <span className="italic">Supports Markdown shortcuts</span>
                </div>
                    </Card>
            </div>

                {/* Sidebar (Right Column) */}
                <div className="space-y-6">

                    {/* Publishing Status */}
                    <Card className="p-5 border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-4 bg-[#FFDE1A] rounded-full" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Publishing</h3>
                </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-500">Status</Label>
                                <select
                                    value={status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value as 'Draft' | 'Published' | 'Scheduled'
                                        setStatus(newStatus)
                                    }}
                                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FFDE1A]/20 focus:border-[#FFDE1A] focus:outline-none transition-all"
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Published">Published</option>
                                    <option value="Scheduled">Scheduled</option>
                                </select>
                            </div>

                            {status === 'Scheduled' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                    <Label className="text-xs text-zinc-500">Schedule Time</Label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FFDE1A]/20 focus:border-[#FFDE1A] focus:outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <Label className="text-xs text-zinc-500">Table of Contents</Label>
                                <button
                                    type="button"
                                    onClick={() => setShowToc(!showToc)}
                                    className={cn(
                                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                        showToc ? "bg-[#FFDE1A]" : "bg-zinc-200 dark:bg-zinc-800"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm",
                                        showToc ? "translate-x-5" : "translate-x-1"
                                    )} />
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Metadata */}
                    <Card className="border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setIsMetadataOpen(!isMetadataOpen)}
                            className="w-full px-5 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Metadata</h3>
                        </div>
                            <ChevronLeft className={cn("w-4 h-4 text-zinc-400 transition-transform", isMetadataOpen ? "-rotate-90" : "rotate-180")} />
                        </button>

                        {isMetadataOpen && (
                            <div className="p-5 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-500">Author</Label>
                            <Input
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                        placeholder="Post author"
                                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10"
                            />
                        </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-zinc-500">Category</Label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                        className="w-full text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FFDE1A]/20 focus:border-[#FFDE1A] focus:outline-none"
                                >
                                    {BLOG_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                    <Label className="text-xs text-zinc-500">Tags</Label>
                                    <div className="flex flex-wrap gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg min-h-[42px]">
                                    {tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 shadow-sm">
                                            {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-zinc-400 hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder="Add tag..."
                                            className="bg-transparent text-sm focus:outline-none min-w-[60px] flex-1 py-0.5"
                                    />
                                </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-zinc-500">URL Slug</Label>
                                <Button
                                    type="button"
                                            variant="ghost"
                                    size="sm"
                                            onClick={handleRegenerateSlug}
                                            className="h-6 px-2 text-[10px]"
                                            title="Regenerate slug from title"
                                >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Regenerate
                                </Button>
                            </div>
                            <Input
                                value={slug}
                                        onChange={(e) => {
                                            setSlug(e.target.value)
                                            setHasUserEditedSlug(true)
                                        }}
                                        className="font-mono text-xs bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10"
                            />
                                    <p className="text-[10px] text-zinc-400 truncate">/blog/{slug}</p>
                        </div>
                            </div>
                        )}
                    </Card>

                    {/* SEO & Media */}
                    <Card className="border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setIsSeoOpen(!isSeoOpen)}
                            className="w-full px-5 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">SEO & Media</h3>
                            </div>
                            <ChevronLeft className={cn("w-4 h-4 text-zinc-400 transition-transform", isSeoOpen ? "-rotate-90" : "rotate-180")} />
                        </button>

                         {isSeoOpen && (
                             <div className="p-5 space-y-4">
                        <div className="space-y-3">
                                     <Label className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Featured Image</Label>
                                     
                                     {/* Drag & Drop Area */}
                                     <div
                                         onDragOver={handleDragOver}
                                         onDragLeave={handleDragLeave}
                                         onDrop={handleDrop}
                                         onClick={() => fileInputRef.current?.click()}
                                         className={cn(
                                             "relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden group",
                                             isDragging 
                                                 ? "border-[#FFDE1A] bg-[#FFDE1A]/5" 
                                                 : "border-zinc-200 dark:border-white/10 hover:border-[#FFDE1A]/50 hover:bg-zinc-50 dark:hover:bg-white/5",
                                             imageUrl ? "border-solid" : "p-8"
                                         )}
                                     >
                                         <input
                                             type="file"
                                             ref={fileInputRef}
                                             onChange={handleFileChange}
                                             className="hidden"
                                             accept="image/*"
                                         />
                                         
                                         {imageUrl ? (
                                             <>
                                    <img
                                        src={imageUrl}
                                                     alt="Featured" 
                                                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                 />
                                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                     <div className="flex flex-col items-center gap-2 text-white">
                                                         <Upload className="w-6 h-6" />
                                                         <span className="text-xs font-bold uppercase tracking-widest">Replace Image</span>
                                </div>
                                                 </div>
                                             </>
                                         ) : (
                                             <>
                                                 <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                     {isUploading ? (
                                                         <Loader2 className="w-6 h-6 animate-spin text-[#FFDE1A]" />
                                                     ) : (
                                                         <Upload className="w-6 h-6 text-zinc-400" />
                                                     )}
                                                 </div>
                                                 <div className="text-center">
                                                     <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                                         {isUploading ? 'Uploading...' : 'Drop image here'}
                                                     </p>
                                                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                                                         or click to browse local files
                            </p>
                        </div>
                                             </>
                                         )}
                                     </div>

                                     <div className="space-y-1.5">
                                         <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Image URL (Optional)</Label>
                                         <Input
                                             value={imageUrl}
                                             onChange={(e) => setImageUrl(e.target.value)}
                                             placeholder="https://..."
                                             className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 text-xs"
                                         />
                        </div>
                                 </div>

                                <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-3">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <Label className="text-xs text-zinc-500">Meta Title</Label>
                                            <span className={cn("text-[10px] font-mono", metaTitle.length >= 50 && metaTitle.length <= 60 ? "text-green-500" : "text-zinc-400")}>
                                                {metaTitle.length}/60
                                            </span>
                                        </div>
                                <Input
                                    value={metaTitle}
                                            onChange={(e) => {
                                                setMetaTitle(e.target.value)
                                                setHasUserEditedMetaTitle(true)
                                            }}
                                            className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10"
                                        />
                            </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between">
                                            <Label className="text-xs text-zinc-500">Meta Description</Label>
                                            <span className={cn("text-[10px] font-mono", metaDescription.length >= 150 && metaDescription.length <= 160 ? "text-green-500" : "text-zinc-400")}>
                                                {metaDescription.length}/160
                                            </span>
                                        </div>
                                <Textarea
                                    value={metaDescription}
                                    onChange={(e) => setMetaDescription(e.target.value)}
                                            rows={3}
                                            className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-white/10 resize-none"
                                />
                            </div>
                        </div>
                            </div>
                        )}
                    </Card>

                    {/* Content Outline */}
                    <Card className="border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
                            className="w-full px-5 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Outline</h3>
                            </div>
                            <ChevronLeft className={cn("w-4 h-4 text-zinc-400 transition-transform", isOutlineOpen ? "-rotate-90" : "rotate-180")} />
                        </button>

                        {isOutlineOpen && (
                            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                                {contentHeadings.length > 0 ? (
                                    <nav className="space-y-0.5">
                                {contentHeadings.map((heading, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                                    // Try to find heading in editor content by searching for the text
                                                    // Since TipTap doesn't expose heading IDs in editor DOM, we'll scroll to content
                                                    if (editorContentRef.current) {
                                                        const editorElement = editorContentRef.current.querySelector('.ProseMirror')
                                                        if (editorElement) {
                                                            // Find heading nodes by text content
                                                            const headings = editorElement.querySelectorAll('h2, h3, h4')
                                                            for (const headingEl of Array.from(headings)) {
                                                                const text = headingEl.textContent?.trim()
                                                                if (text === heading.text) {
                                                                    headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                                    // Highlight briefly
                                                                    headingEl.classList.add('highlight-heading')
                                                                    setTimeout(() => headingEl.classList.remove('highlight-heading'), 2000)
                                                                    return
                                                                }
                                                            }
                                                        }
                                                    }
                                                    // Fallback: scroll to top of editor
                                                    if (editorContentRef.current) {
                                                        editorContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                            }
                                        }}
                                        className={cn(
                                                    "block w-full text-left text-xs transition-all truncate py-1.5 px-3 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5",
                                                    heading.level === 2 && "font-semibold text-zinc-800 dark:text-zinc-200",
                                                    heading.level === 3 && "pl-6 text-zinc-600 dark:text-zinc-400",
                                                    heading.level === 4 && "pl-9 text-zinc-500 dark:text-zinc-500"
                                                )}
                                                style={{ '--hover-color': '#FFDE1A' } as React.CSSProperties & { '--hover-color': string }}
                                                onMouseEnter={(e) => e.currentTarget.style.color = '#FFDE1A'}
                                                onMouseLeave={(e) => {
                                                    const level = heading.level
                                                    if (level === 2) e.currentTarget.style.color = ''
                                                    else if (level === 3) e.currentTarget.style.color = ''
                                                    else e.currentTarget.style.color = ''
                                                }}
                                        title={heading.text}
                                    >
                                        {heading.text}
                                    </button>
                                ))}
                            </nav>
                                ) : (
                                    <p className="p-4 text-xs text-zinc-400 text-center italic">
                                        Add headings (H2-H4) to see outline
                            </p>
                    )}
                </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}
