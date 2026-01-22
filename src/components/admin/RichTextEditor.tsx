import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, Heading4,
    List, ListOrdered, Quote, Code, Link as LinkIcon, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Undo, Redo, Minus, Type, Palette, Highlighter,
    Maximize2, Minimize2, Trash2, X, Link2, Blocks, Plus, Save, Upload, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'
import { 
    fetchReusableBlocks, 
    createReusableBlock, 
    type ReusableBlock 
} from '@/lib/services/reusableBlocks'
import { useToast } from '@/contexts/ToastContext'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    onWordCountChange?: (count: number) => void
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = 'Start writing your story...',
    onWordCountChange
}: RichTextEditorProps) {
    const toast = useToast()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showLinkDialog, setShowLinkDialog] = useState(false)
    const [showImageDialog, setShowImageDialog] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [linkUrl, setLinkUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [imageAlt, setImageAlt] = useState('')
    const [imageAlignment, setImageAlignment] = useState<'left' | 'center' | 'right' | 'full'>('center')
    const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium')
    const [imageCaption, setImageCaption] = useState('')
    const [imageStyle, setImageStyle] = useState<'normal' | 'rounded' | 'shadow' | 'bordered'>('normal')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showHighlightPicker, setShowHighlightPicker] = useState(false)
    const colorPickerRef = useRef<HTMLDivElement>(null)
    const highlightPickerRef = useRef<HTMLDivElement>(null)
    
    // Internal linking state
    const [showInternalLinkDialog, setShowInternalLinkDialog] = useState(false)
    const [internalLinkSearch, setInternalLinkSearch] = useState('')
    const [availablePosts, setAvailablePosts] = useState<{ id: string; title: string; slug: string }[]>([])
    const [isLoadingPosts, setIsLoadingPosts] = useState(false)
    
    // Reusable blocks state
    const [showReusableBlocksDialog, setShowReusableBlocksDialog] = useState(false)
    const [reusableBlocks, setReusableBlocks] = useState<ReusableBlock[]>([])
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(false)
    const [newBlockName, setNewBlockName] = useState('')
    const [isSavingBlock, setIsSavingBlock] = useState(false)
    const [blockError, setBlockError] = useState<string | null>(null)

    const processImageFile = async (file: File) => {
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
            const errorMessage = err?.message || 'Unknown error'
            
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
        if (file) processImageFile(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processImageFile(file)
    }

    // Close color/highlight pickers when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false)
            }
            if (highlightPickerRef.current && !highlightPickerRef.current.contains(event.target as Node)) {
                setShowHighlightPicker(false)
            }
        }

        if (showColorPicker || showHighlightPicker) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showColorPicker, showHighlightPicker])

    // Fetch posts for internal linking when dialog opens
    useEffect(() => {
        const fetchPosts = async () => {
            if (!showInternalLinkDialog) return
            
            setIsLoadingPosts(true)
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('id, title, slug')
                    .eq('status', 'Published')
                    .order('title', { ascending: true })
                
                if (!error && data) {
                    setAvailablePosts(data)
                }
            } catch (err) {
                console.error('Failed to fetch posts for internal linking', err)
            } finally {
                setIsLoadingPosts(false)
            }
        }
        
        fetchPosts()
    }, [showInternalLinkDialog])

    // Filter posts based on search query
    const filteredPosts = useMemo(() => {
        if (!internalLinkSearch.trim()) return availablePosts
        const query = internalLinkSearch.toLowerCase()
        return availablePosts.filter(p => p.title.toLowerCase().includes(query))
    }, [availablePosts, internalLinkSearch])

    // Fetch reusable blocks when dialog opens
    useEffect(() => {
        const loadBlocks = async () => {
            if (!showReusableBlocksDialog) return
            
            setIsLoadingBlocks(true)
            setBlockError(null)
            try {
                const blocks = await fetchReusableBlocks()
                setReusableBlocks(blocks)
            } catch (err) {
                console.error('Failed to fetch reusable blocks', err)
                setBlockError('Failed to load blocks')
            } finally {
                setIsLoadingBlocks(false)
            }
        }
        
        loadBlocks()
    }, [showReusableBlocksDialog])


    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Strike,
            Color,
            TextStyle,
            Highlight.configure({
                multicolor: true,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML()
            onChange(html)
            
            // Calculate word count
            const text = editor.getText()
            const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length
            onWordCountChange?.(wordCount)
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px]',
            },
        },
    })

    // Update editor content when prop changes (only if different and editor is ready)
    useEffect(() => {
        if (!editor) return
        
        const currentContent = editor.getHTML()
        // Only update if the content is actually different (avoid infinite loops)
        if (content !== currentContent) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
    }, [content, editor])

    // Toolbar button handlers
    const toggleBold = () => editor?.chain().focus().toggleBold().run()
    const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
    const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
    const toggleStrike = () => editor?.chain().focus().toggleStrike().run()

    const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
        editor?.chain().focus().toggleHeading({ level }).run()
    }

    const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run()
    const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run()
    const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run()
    const toggleCode = () => editor?.chain().focus().toggleCode().run()
    const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run()

    const setTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
        editor?.chain().focus().setTextAlign(align).run()
    }

    const setColor = (color: string) => {
        editor?.chain().focus().setColor(color).run()
        setShowColorPicker(false)
    }

    const setHighlight = (color: string) => {
        editor?.chain().focus().toggleHighlight({ color }).run()
        setShowHighlightPicker(false)
    }

    const insertLink = () => {
        if (!linkUrl.trim()) return
        
        if (editor?.isActive('link')) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
        } else {
            editor?.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run()
        }
        
        setLinkUrl('')
        setShowLinkDialog(false)
    }

    const removeLink = () => {
        editor?.chain().focus().unsetLink().run()
    }

    // Insert internal link to another blog post
    const insertInternalLink = (post: { title: string; slug: string }) => {
        const url = `/blog/${post.slug}`
        const selectedText = editor?.state.selection.content().content.textBetween(0, editor?.state.selection.content().size || 0, ' ')
        
        if (selectedText && selectedText.trim().length > 0) {
            // If text is selected, turn it into a link
            editor?.chain().focus().setLink({ href: url }).run()
        } else {
            // If no text selected, insert the post title as a link
            editor?.chain().focus().insertContent(`<a href="${url}">${post.title}</a>`).run()
        }
        
        setShowInternalLinkDialog(false)
        setInternalLinkSearch('')
    }

    // Save selected content as reusable block
    const handleSaveAsBlock = async () => {
        if (!newBlockName.trim()) {
            setBlockError('Please enter a name for the block')
            return
        }
        
        // Get selected content
        const { from, to } = editor?.state.selection || { from: 0, to: 0 }
        if (from === to) {
            setBlockError('Please select some content to save')
            return
        }
        
        setIsSavingBlock(true)
        setBlockError(null)
        
        try {
            // Get the selected HTML - using a workaround since Tiptap doesn't have a direct method
            const selectedContent = editor?.state.doc.textBetween(from, to, '\n')
            
            if (!selectedContent?.trim()) {
                setBlockError('Please select some content to save')
                return
            }
            
            // For now, save the text content (HTML selection is more complex)
            // A more robust solution would need custom Tiptap extension
            await createReusableBlock({
                name: newBlockName.trim(),
                content: selectedContent,
                blockType: 'text'
            })
            
            // Refresh blocks list
            const blocks = await fetchReusableBlocks()
            setReusableBlocks(blocks)
            setNewBlockName('')
            setBlockError(null)
        } catch (err) {
            console.error('Failed to save block', err)
            setBlockError(err instanceof Error ? err.message : 'Failed to save block')
        } finally {
            setIsSavingBlock(false)
        }
    }

    // Insert reusable block content
    const handleInsertBlock = (block: ReusableBlock) => {
        if (!editor) return
        
        editor.chain().focus().insertContent(block.content).run()
        setShowReusableBlocksDialog(false)
    }

    const insertImage = () => {
        if (!imageUrl.trim()) return
        
        // Build CSS classes based on alignment and size
        const alignmentClasses = {
            left: 'float-left mr-4 mb-4',
            center: 'mx-auto block my-4',
            right: 'float-right ml-4 mb-4',
            full: 'w-full block my-6'
        }
        
        const sizeClasses = {
            small: 'max-w-xs',
            medium: 'max-w-2xl',
            large: 'max-w-4xl',
            full: 'w-full'
        }
        
        // NEW: Style classes for showcase images
        const styleClasses = {
            normal: '',
            rounded: 'rounded-xl',
            shadow: 'shadow-lg',
            bordered: 'border-2 border-zinc-200 dark:border-zinc-700'
        }
        
        // Escape HTML in alt text and caption
        const escapedAlt = (imageAlt || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
        const escapedCaption = imageCaption.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')
        
        // Build image classes including style
        const baseClass = imageStyle === 'rounded' ? 'rounded-xl' : 'rounded-lg'
        const imageClasses = `${baseClass} h-auto ${alignmentClasses[imageAlignment]} ${imageSize === 'full' ? sizeClasses.full : sizeClasses[imageSize]} ${styleClasses[imageStyle]}`.trim().replace(/\s+/g, ' ')
        
        // Create image HTML with wrapper for caption if provided
        let imageHTML = `<img src="${imageUrl}" alt="${escapedAlt}" class="${imageClasses}" />`
        
        // Add caption if provided - wrap in semantic figure element
        if (imageCaption.trim()) {
            const figureClasses = [
                imageAlignment === 'full' ? 'w-full' : '',
                imageAlignment === 'center' ? 'mx-auto' : '',
                'my-6'
            ].filter(Boolean).join(' ')
            
            imageHTML = `<figure class="${figureClasses}">
                ${imageHTML}
                <figcaption class="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-2 italic">${escapedCaption}</figcaption>
            </figure>`
        }
        
        // Insert the image HTML
        editor?.chain().focus().insertContent(imageHTML).run()
        
        // Reset form
        setImageUrl('')
        setImageAlt('')
        setImageAlignment('center')
        setImageSize('medium')
        setImageCaption('')
        setImageStyle('normal')
        setShowImageDialog(false)
    }


    const insertHorizontalRule = () => editor?.chain().focus().setHorizontalRule().run()

    const undo = () => editor?.chain().focus().undo().run()
    const redo = () => editor?.chain().focus().redo().run()

    const clearFormatting = () => editor?.chain().focus().clearNodes().unsetAllMarks().run()

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Color presets
    const colorPresets = [
        '#000000', '#374151', '#6B7280', '#9CA3AF',
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
        '#8B5CF6', '#EC4899', '#F8BE00', '#FFFFFF'
    ]

    const highlightPresets = [
        '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
        '#FED7AA', '#FDBA74', '#FB923C', '#F97316',
        '#FECACA', '#FCA5A5', '#F87171', '#EF4444',
        '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA'
    ]

    if (!editor) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-sm text-zinc-500">Loading editor...</div>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex flex-col bg-white dark:bg-[#09090b] h-full min-h-0 transition-all duration-300 relative",
            isFullscreen ? "fixed inset-0 z-[100] rounded-none" : "rounded-none border-0"
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 bg-white dark:bg-[#09090b] border-b border-zinc-100 dark:border-white/5 sticky top-0 z-20 flex-shrink-0 backdrop-blur-sm bg-white/90 dark:bg-[#09090b]/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                {/* Text Formatting */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleBold}
                        className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleItalic}
                        className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleUnderline}
                        className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleStrike}
                        className={`h-8 w-8 ${editor.isActive('strike') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Strikethrough"
                    >
                        <Strikethrough className="w-4 h-4" />
                    </Button>
                </div>

                {/* Headings */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(1)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Heading 1"
                    >
                        <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(2)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Heading 2"
                    >
                        <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(3)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Heading 3"
                    >
                        <Heading3 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(4)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 4 }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Heading 4"
                    >
                        <Heading4 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Lists */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleBulletList}
                        className={`h-8 w-8 ${editor.isActive('bulletList') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleOrderedList}
                        className={`h-8 w-8 ${editor.isActive('orderedList') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </Button>
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('left')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Align Left"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('center')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Align Center"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('right')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Align Right"
                    >
                        <AlignRight className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('justify')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Justify"
                    >
                        <AlignJustify className="w-4 h-4" />
                    </Button>
                </div>

                {/* Text Style */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleBlockquote}
                        className={`h-8 w-8 ${editor.isActive('blockquote') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleCode}
                        className={`h-8 w-8 ${editor.isActive('code') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Inline Code"
                    >
                        <Code className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleCodeBlock}
                        className={`h-8 w-8 ${editor.isActive('codeBlock') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Code Block"
                    >
                        <Type className="w-4 h-4" />
                    </Button>
                </div>

                {/* Color & Highlight */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2 relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setShowColorPicker(!showColorPicker)
                            setShowHighlightPicker(false)
                        }}
                        className="h-8 w-8"
                        title="Text Color"
                    >
                        <Palette className="w-4 h-4" />
                    </Button>
                    {showColorPicker && (
                        <div 
                            ref={colorPickerRef}
                            className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-50"
                        >
                            <div className="grid grid-cols-4 gap-2">
                                {colorPresets.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setColor(color)}
                                        className="w-8 h-8 rounded border-2 border-black dark:border-white"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setShowHighlightPicker(!showHighlightPicker)
                            setShowColorPicker(false)
                        }}
                        className="h-8 w-8"
                        title="Highlight"
                    >
                        <Highlighter className="w-4 h-4" />
                    </Button>
                    {showHighlightPicker && (
                        <div 
                            ref={highlightPickerRef}
                            className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] z-50"
                        >
                            <div className="grid grid-cols-4 gap-2">
                                {highlightPresets.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setHighlight(color)}
                                        className="w-8 h-8 rounded border-2 border-black dark:border-white"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Media */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setShowLinkDialog(true)
                            setLinkUrl(editor.getAttributes('link').href || '')
                        }}
                        className={`h-8 w-8 ${editor.isActive('link') ? 'bg-[#FFDE1A] text-black' : ''}`}
                        title="Insert Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </Button>
                    {editor.isActive('link') && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeLink}
                            className="h-8 w-8"
                            title="Remove Link"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowImageDialog(true)}
                        className="h-8 w-8"
                        title="Insert Image"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowInternalLinkDialog(true)}
                        className="h-8 w-8"
                        title="Insert Internal Link (Blog Post)"
                    >
                        <Link2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Special */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={insertHorizontalRule}
                        className="h-8 w-8"
                        title="Horizontal Rule"
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowReusableBlocksDialog(true)}
                        className="h-8 w-8"
                        title="Reusable Blocks"
                    >
                        <Blocks className="w-4 h-4" />
                    </Button>
                </div>

                {/* History */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={undo}
                        disabled={!editor.can().undo()}
                        className="h-8 w-8"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={redo}
                        disabled={!editor.can().redo()}
                        className="h-8 w-8"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4" />
                    </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-auto">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={clearFormatting}
                        className="h-8 w-8"
                        title="Clear Formatting"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="h-8 w-8"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#09090b] min-h-0" onClick={() => editor?.chain().focus().run()}>
                <div className="max-w-[900px] mx-auto w-full py-12 px-6 lg:px-10">
                <EditorContent editor={editor} />
                </div>
            </div>

            {/* Link Dialog */}
            {showLinkDialog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowLinkDialog(false)
                            setLinkUrl('')
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Insert Link</h3>
                        <div className="space-y-4">
                            <Input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        insertLink()
                                    } else if (e.key === 'Escape') {
                                        setShowLinkDialog(false)
                                        setLinkUrl('')
                                    }
                                }}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={insertLink}
                                    className="flex-1 bg-[#FFDE1A] text-black hover:bg-[#F8BE00]"
                                >
                                    Insert
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowLinkDialog(false)
                                        setLinkUrl('')
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Internal Link Dialog */}
            {showInternalLinkDialog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowInternalLinkDialog(false)
                            setInternalLinkSearch('')
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Insert Internal Link</h3>
                        <p className="text-xs text-zinc-500 mb-4">Link to another blog post on your site</p>
                        <div className="space-y-4">
                            <Input
                                type="text"
                                value={internalLinkSearch}
                                onChange={(e) => setInternalLinkSearch(e.target.value)}
                                placeholder="Search posts..."
                                className="w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setShowInternalLinkDialog(false)
                                        setInternalLinkSearch('')
                                    }
                                }}
                            />
                            <div className="max-h-64 overflow-y-auto space-y-1 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                {isLoadingPosts ? (
                                    <div className="p-4 text-center text-sm text-zinc-500">
                                        Loading posts...
                                    </div>
                                ) : filteredPosts.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-zinc-500">
                                        No posts found
                                    </div>
                                ) : (
                                    filteredPosts.map(post => (
                                        <button
                                            key={post.id}
                                            type="button"
                                            onClick={() => insertInternalLink(post)}
                                            className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                                        >
                                            <div className="font-medium text-sm">{post.title}</div>
                                            <div className="text-xs text-zinc-500 mt-0.5">/blog/{post.slug}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInternalLinkDialog(false)
                                    setInternalLinkSearch('')
                                }}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reusable Blocks Dialog */}
            {showReusableBlocksDialog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowReusableBlocksDialog(false)
                            setNewBlockName('')
                            setBlockError(null)
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Blocks className="w-5 h-5 text-[#FFDE1A]" />
                            <h3 className="text-lg font-bold">Reusable Blocks</h3>
                        </div>
                        <p className="text-xs text-zinc-500 mb-4">Save content as reusable blocks or insert existing blocks</p>
                        
                        {blockError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                                {blockError}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {/* Save Selection as Block */}
                            <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Save className="w-4 h-4 text-zinc-500" />
                                    <label className="text-sm font-medium">Save Selection as Block</label>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={newBlockName}
                                        onChange={(e) => setNewBlockName(e.target.value)}
                                        placeholder="Block name..."
                                        className="flex-1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveAsBlock()
                                            }
                                        }}
                                    />
                                    <Button 
                                        onClick={handleSaveAsBlock}
                                        disabled={isSavingBlock || !newBlockName.trim()}
                                        className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00]"
                                    >
                                        {isSavingBlock ? 'Saving...' : 'Save'}
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">Select text in the editor, then save it as a reusable block</p>
                            </div>

                            {/* Insert Existing Block */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Plus className="w-4 h-4 text-zinc-500" />
                                    <label className="text-sm font-medium">Insert Existing Block</label>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                                    {isLoadingBlocks ? (
                                        <div className="p-4 text-center text-sm text-zinc-500">
                                            Loading blocks...
                                        </div>
                                    ) : reusableBlocks.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-zinc-500">
                                            No saved blocks yet
                                        </div>
                                    ) : (
                                        reusableBlocks.map(block => (
                                            <button
                                                key={block.id}
                                                type="button"
                                                onClick={() => handleInsertBlock(block)}
                                                className="w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                                            >
                                                <div className="font-medium text-sm">{block.name}</div>
                                                <div className="text-xs text-zinc-500 mt-0.5 truncate">
                                                    {block.content.substring(0, 60)}{block.content.length > 60 ? '...' : ''}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowReusableBlocksDialog(false)
                                    setNewBlockName('')
                                    setBlockError(null)
                                }}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Dialog */}
            {showImageDialog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowImageDialog(false)
                            setImageUrl('')
                            setImageAlt('')
                            setImageAlignment('center')
                            setImageSize('medium')
                            setImageCaption('')
                            setImageStyle('normal')
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-6 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Insert Image</h3>
                        <div className="space-y-4">
                            {/* Drag & Drop Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden group mb-4",
                                    isDragging 
                                        ? "border-[#FFDE1A] bg-[#FFDE1A]/5" 
                                        : "border-zinc-200 dark:border-white/10 hover:border-[#FFDE1A]/50 hover:bg-zinc-50 dark:hover:bg-white/5",
                                    imageUrl ? "border-solid" : "p-6"
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
                                            alt="Preview" 
                                            className="w-full h-full object-contain" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-1 text-white">
                                                <Upload className="w-5 h-5" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Replace Image</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {isUploading ? (
                                                <Loader2 className="w-5 h-5 animate-spin text-[#FFDE1A]" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                                {isUploading ? 'Uploading...' : 'Drop image here'}
                                            </p>
                                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                                                or click to browse local files
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* URL Input */}
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Image URL</label>
                            <Input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                    className="w-full text-xs h-9"
                            />
                            </div>
                            
                            {/* Alt Text Input (SEO Enhancement) */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    Alt Text <span className="text-amber-500">(Recommended for SEO)</span>
                                </label>
                                <Input
                                    type="text"
                                    value={imageAlt}
                                    onChange={(e) => setImageAlt(e.target.value)}
                                    placeholder="Describe the image for accessibility & SEO"
                                    className="w-full"
                                />
                            </div>
                            
                            {/* Alignment Options */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Alignment</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['left', 'center', 'right', 'full'] as const).map((align) => (
                                        <button
                                            key={align}
                                            type="button"
                                            onClick={() => setImageAlignment(align)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                                imageAlignment === align
                                                    ? 'border-[#FFDE1A] bg-[#FFDE1A]/20 text-black dark:text-white'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            {align.charAt(0).toUpperCase() + align.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Size Options */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Size</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setImageSize(size)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                                imageSize === size
                                                    ? 'border-[#FFDE1A] bg-[#FFDE1A]/20 text-black dark:text-white'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Style Options (NEW: Showcase image styles) */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Style</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['normal', 'rounded', 'shadow', 'bordered'] as const).map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            onClick={() => setImageStyle(style)}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                                imageStyle === style
                                                    ? 'border-[#FFDE1A] bg-[#FFDE1A]/20 text-black dark:text-white'
                                                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            {style.charAt(0).toUpperCase() + style.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Caption Input */}
                            <Input
                                type="text"
                                value={imageCaption}
                                onChange={(e) => setImageCaption(e.target.value)}
                                placeholder="Caption (optional)"
                                className="w-full"
                            />
                            
                            {/* Preview */}
                            {imageUrl && (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Preview</label>
                                    <div className={`rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 ${
                                        imageAlignment === 'center' ? 'mx-auto' : 
                                        imageAlignment === 'left' ? 'mr-auto' : 
                                        imageAlignment === 'right' ? 'ml-auto' : 
                                        'w-full'
                                    } ${
                                        imageSize === 'small' ? 'max-w-xs' :
                                        imageSize === 'medium' ? 'max-w-2xl' :
                                        imageSize === 'large' ? 'max-w-4xl' :
                                        'w-full'
                                    }`}>
                                        <div className="relative aspect-video">
                                            <img
                                                src={imageUrl}
                                                alt="Preview"
                                                width="800"
                                                height="450"
                                                decoding="async"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {imageCaption && (
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center italic">
                                            {imageCaption}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={insertImage}
                                    disabled={!imageUrl.trim()}
                                    className="flex-1 bg-[#FFDE1A] text-black hover:bg-[#F8BE00] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Insert
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowImageDialog(false)
                                        setImageUrl('')
                                        setImageAlt('')
                                        setImageAlignment('center')
                                        setImageSize('medium')
                                        setImageCaption('')
                                        setImageStyle('normal')
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

