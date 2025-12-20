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
    Maximize2, Minimize2, Trash2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'

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
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showLinkDialog, setShowLinkDialog] = useState(false)
    const [showImageDialog, setShowImageDialog] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [imageAlt, setImageAlt] = useState('')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [showHighlightPicker, setShowHighlightPicker] = useState(false)
    const colorPickerRef = useRef<HTMLDivElement>(null)
    const highlightPickerRef = useRef<HTMLDivElement>(null)

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
                inline: true,
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
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-4 py-3',
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

    const insertImage = () => {
        if (!imageUrl.trim()) return
        
        editor?.chain().focus().setImage({
            src: imageUrl,
            alt: imageAlt || '',
        }).run()
        
        setImageUrl('')
        setImageAlt('')
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
        <div className={`flex flex-col border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 overflow-x-auto">
                {/* Text Formatting */}
                <div className="flex items-center gap-1 border-r border-zinc-300 dark:border-zinc-700 pr-2 mr-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleBold}
                        className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Bold (Ctrl+B)"
                    >
                        <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleItalic}
                        className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Italic (Ctrl+I)"
                    >
                        <Italic className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleUnderline}
                        className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Underline (Ctrl+U)"
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleStrike}
                        className={`h-8 w-8 ${editor.isActive('strike') ? 'bg-[#F8BE00] text-black' : ''}`}
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
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Heading 1"
                    >
                        <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(2)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Heading 2"
                    >
                        <Heading2 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(3)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Heading 3"
                    >
                        <Heading3 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setHeading(4)}
                        className={`h-8 w-8 ${editor.isActive('heading', { level: 4 }) ? 'bg-[#F8BE00] text-black' : ''}`}
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
                        className={`h-8 w-8 ${editor.isActive('bulletList') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Bullet List"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleOrderedList}
                        className={`h-8 w-8 ${editor.isActive('orderedList') ? 'bg-[#F8BE00] text-black' : ''}`}
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
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'left' }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Align Left"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('center')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'center' }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Align Center"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('right')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'right' }) ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Align Right"
                    >
                        <AlignRight className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTextAlign('justify')}
                        className={`h-8 w-8 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-[#F8BE00] text-black' : ''}`}
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
                        className={`h-8 w-8 ${editor.isActive('blockquote') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Quote"
                    >
                        <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleCode}
                        className={`h-8 w-8 ${editor.isActive('code') ? 'bg-[#F8BE00] text-black' : ''}`}
                        title="Inline Code"
                    >
                        <Code className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={toggleCodeBlock}
                        className={`h-8 w-8 ${editor.isActive('codeBlock') ? 'bg-[#F8BE00] text-black' : ''}`}
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
                        className={`h-8 w-8 ${editor.isActive('link') ? 'bg-[#F8BE00] text-black' : ''}`}
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
            <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900" onClick={() => editor?.chain().focus().run()}>
                <EditorContent editor={editor} />
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
                                    className="flex-1 bg-[#F8BE00] text-black hover:bg-[#FFD700]"
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

            {/* Image Dialog */}
            {showImageDialog && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowImageDialog(false)
                            setImageUrl('')
                            setImageAlt('')
                        }
                    }}
                >
                    <div 
                        className="bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl p-6 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Insert Image</h3>
                        <div className="space-y-4">
                            <Input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setShowImageDialog(false)
                                        setImageUrl('')
                                        setImageAlt('')
                                    }
                                }}
                            />
                            <Input
                                type="text"
                                value={imageAlt}
                                onChange={(e) => setImageAlt(e.target.value)}
                                placeholder="Alt text (optional)"
                                className="w-full"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && imageUrl) {
                                        insertImage()
                                    } else if (e.key === 'Escape') {
                                        setShowImageDialog(false)
                                        setImageUrl('')
                                        setImageAlt('')
                                    }
                                }}
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
                            <div className="flex gap-2">
                                <Button
                                    onClick={insertImage}
                                    disabled={!imageUrl.trim()}
                                    className="flex-1 bg-[#F8BE00] text-black hover:bg-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Insert
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowImageDialog(false)
                                        setImageUrl('')
                                        setImageAlt('')
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

