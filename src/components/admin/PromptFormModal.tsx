import { useState, useRef, FormEvent, useEffect } from 'react'
import {
    XMarkIcon,
    PhotoIcon,
    ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabaseClient'
import {
    createPrompt,
    updatePrompt,
    type PromptRecord,
    type PromptPayload,
} from '@/lib/services/prompts'
import { useToast } from '@/contexts/ToastContext'
import { sanitizeForStorage } from '@/lib/utils'
import { fetchUniqueCategories } from '@/lib/services/categories'

const STATUS_OPTIONS = ['Published', 'Draft', 'Review']

const EMPTY_FORM_STATE = {
    title: '',
    prompt: '',
    negative_prompt: '',
    category: '',
    tags: '',
    preview_image_url: '',
    status: 'Draft',
    views: '0',
}

type PromptFormState = typeof EMPTY_FORM_STATE

interface PromptFormModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: PromptRecord | null
    onSuccess?: () => void
}

export default function PromptFormModal({ isOpen, onClose, initialData, onSuccess }: PromptFormModalProps) {
    const [formValues, setFormValues] = useState<PromptFormState>(EMPTY_FORM_STATE)
    const [categories, setCategories] = useState<string[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const toast = useToast()

    const mode = initialData ? 'edit' : 'create'

    // Close modal on Escape key
    useEffect(() => {
        if (!isOpen) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    // Load categories when modal opens
    useEffect(() => {
        if (isOpen) {
            const loadCategories = async () => {
                try {
                    setIsLoadingCategories(true)
                    const fetchedCategories = await fetchUniqueCategories()
                    setCategories(fetchedCategories)
                } catch (err) {
                    console.error('Failed to load categories:', err)
                    // Fallback to default categories
                    setCategories([
                        'Portraits',
                        'Anime',
                        'Logos',
                        'UI/UX',
                        'Cinematic',
                        '3D Art',
                        'Photography',
                        'Illustrations',
                    ])
                } finally {
                    setIsLoadingCategories(false)
                }
            }

            loadCategories()
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormValues({
                    title: initialData.title ?? '',
                    prompt: initialData.prompt ?? '',
                    negative_prompt: initialData.negative_prompt ?? '',
                    category: initialData.category ?? '',
                    tags: initialData.tags?.join(', ') ?? '',
                    preview_image_url: initialData.preview_image_url ?? '',
                    status: initialData.status ?? 'Draft',
                    views: initialData.views?.toString() ?? '0',
                })
            } else {
                setFormValues(EMPTY_FORM_STATE)
            }
            setFormError(null)
        }
    }, [isOpen, initialData, categories])

    const handleFormInputChange = (field: keyof PromptFormState, value: string) => {
        setFormValues(prev => ({
            ...prev,
            [field]: value,
        }))
    }

    const processImageFile = async (file: File) => {
        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!validImageTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
            return
        }

        // Validate file size
        const MAX_SIZE_BYTES = 5 * 1024 * 1024
        if (file.size > MAX_SIZE_BYTES) {
            toast.error('Image is too large. Max supported size is 5MB.')
            return
        }

        setIsUploading(true)
        setFormError(null)

        const uploadWithRetry = async (retries = 2): Promise<void> => {
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

                handleFormInputChange('preview_image_url', urlData.publicUrl)
                toast.success('Image uploaded successfully')
            } catch (err: any) {
                const errorMessage = err?.message || err?.error || 'Unknown error'
                const isNetworkError =
                    errorMessage.includes('network') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('fetch') ||
                    errorMessage.includes('Failed to fetch') ||
                    (err?.status >= 500 && err?.status < 600)

                if (isNetworkError && retries > 0) {
                    const delay = (3 - retries) * 1000
                    await new Promise(resolve => setTimeout(resolve, delay))
                    return uploadWithRetry(retries - 1)
                }
                throw err
            }
        }

        try {
            await uploadWithRetry()
        } catch (error: any) {
            console.error('Error uploading image:', error)
            const errorMessage = error?.message || error?.error || 'Unknown error'
            
            // Provide more specific error messages
            if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
                toast.error('An image with this name already exists. Please try again.')
            } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
                toast.error('Permission denied. Please check your storage bucket permissions.')
            } else if (errorMessage.includes('size') || errorMessage.includes('too large')) {
                toast.error('Image is too large. Maximum size is 5MB.')
            } else {
                toast.error(`Failed to upload image: ${errorMessage}. Please try again or use a direct URL.`)
            }
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        await processImageFile(file)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (!file) return

        await processImageFile(file)
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setFormError(null)

        const trimmedTitle = formValues.title.trim()
        const trimmedPrompt = formValues.prompt.trim()
        const trimmedCategory = formValues.category.trim()

        if (!trimmedTitle || !trimmedPrompt || !trimmedCategory) {
            setFormError('Title, prompt, and category are required.')
            return
        }


        // Canonicalize tags: lowercase, trim, remove duplicates
        const tagsArray = formValues.tags
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(Boolean)
        const canonicalTags = Array.from(new Set(tagsArray)) // Remove duplicates

        const payload: PromptPayload = {
            title: sanitizeForStorage(trimmedTitle),
            prompt: sanitizeForStorage(trimmedPrompt),
            negative_prompt: formValues.negative_prompt.trim() ? sanitizeForStorage(formValues.negative_prompt.trim()) : null,
            category: sanitizeForStorage(trimmedCategory),
            tags: canonicalTags.length ? canonicalTags.map(tag => sanitizeForStorage(tag)) : null,
            preview_image_url: formValues.preview_image_url.trim() || null, // URL doesn't need sanitization, validation is enough
            status: formValues.status,
            views: isNaN(Number(formValues.views)) ? 0 : Number(formValues.views),
            user_id: null,
        }

        setIsSaving(true)

        try {
            if (mode === 'create') {
                await createPrompt(payload)
                toast.success('Prompt created successfully!')
            } else if (initialData) {
                await updatePrompt(initialData.id, payload)
                toast.success('Prompt updated successfully!')
            }

            if (onSuccess) onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            setFormError(err instanceof Error ? err.message : 'An unexpected error occurred.')
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0e] z-10 pb-4 border-b border-zinc-100 dark:border-white/5">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                                {mode === 'create' ? 'Create Prompt' : 'Edit Prompt'}
                            </h2>
                            <p className="text-sm text-zinc-500">
                                {mode === 'create'
                                    ? 'Add a new AI image prompt to your library.'
                                    : 'Update prompt details and save changes.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            aria-label="Close form"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {formError && (
                        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 text-sm">
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Title *</label>
                            <input
                                type="text"
                                value={formValues.title}
                                onChange={(e) => handleFormInputChange('title', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                                placeholder="Cyberpunk City Streets at Night"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category *</label>
                            <select
                                value={formValues.category}
                                onChange={(e) => handleFormInputChange('category', e.target.value)}
                                disabled={isLoadingCategories}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                required
                            >
                                <option value="">
                                    {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
                                </option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status *</label>
                            <select
                                value={formValues.status}
                                onChange={(e) => handleFormInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                            >
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formValues.tags}
                                onChange={(e) => handleFormInputChange('tags', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                                placeholder="cyberpunk, neon, night"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Preview Image</label>
                        <div className="flex items-start gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${
                                    isDragging
                                        ? 'border-[#FFDE1A] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/20 scale-105 shadow-lg'
                                        : 'border-zinc-300 dark:border-zinc-700 hover:border-[#FFDE1A] hover:bg-zinc-50 dark:hover:bg-white/5'
                                }`}
                            >
                                {formValues.preview_image_url ? (
                                    <>
                                        <img
                                            src={formValues.preview_image_url}
                                            alt="Preview"
                                            width="128"
                                            height="128"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PhotoIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center text-zinc-400">
                                        {isUploading ? (
                                            <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <ArrowUpTrayIcon className={`w-8 h-8 mb-1 transition-transform ${isDragging ? 'scale-110 text-[#FFDE1A]' : ''}`} />
                                                <span className={`text-xs font-medium transition-colors ${isDragging ? 'text-[#FFDE1A]' : ''}`}>
                                                    {isDragging ? 'Drop Image' : 'Upload'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="url"
                                    value={formValues.preview_image_url}
                                    onChange={(e) => handleFormInputChange('preview_image_url', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                                    placeholder="Or paste image URL..."
                                />
                                <p className="text-xs text-zinc-500">
                                    Upload an image or paste a direct URL. Recommended size: 1024x1024px.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Prompt *</label>
                        <textarea
                            value={formValues.prompt}
                            onChange={(e) => handleFormInputChange('prompt', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 min-h-[100px]"
                            placeholder="Describe the full prompt text..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Negative Prompt</label>
                        <textarea
                            value={formValues.negative_prompt}
                            onChange={(e) => handleFormInputChange('negative_prompt', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50 min-h-[80px]"
                            placeholder="Things to avoid..."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : mode === 'create' ? 'Create Prompt' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
