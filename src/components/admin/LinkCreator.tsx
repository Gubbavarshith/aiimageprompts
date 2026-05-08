import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LinkIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  createTrackedLink,
  updateTrackedLink,
  isSlugTaken,
  generateUniqueSlug,
  buildTrackingUrl,
  type TrackedLink,
  type CreateTrackedLinkInput,
} from '@/lib/services/trackedLinks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LinkCreatorProps {
  editingLink?: TrackedLink | null
  onSuccess?: (link: TrackedLink) => void
  onCancel?: () => void
}

export default function LinkCreator({ editingLink, onSuccess, onCancel }: LinkCreatorProps) {
  const isEditing = !!editingLink

  // Form state
  const [destination, setDestination] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmContent, setUtmContent] = useState('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showUtmFields, setShowUtmFields] = useState(false)

  // Initialize form with editing data
  useEffect(() => {
    if (editingLink) {
      setDestination(editingLink.destination)
      setCustomSlug(editingLink.slug)
      setTitle(editingLink.title || '')
      setDescription(editingLink.description || '')
      setUtmSource(editingLink.utm_source || '')
      setUtmMedium(editingLink.utm_medium || '')
      setUtmCampaign(editingLink.utm_campaign || '')
      setUtmContent(editingLink.utm_content || '')
      setShowUtmFields(!!(editingLink.utm_source || editingLink.utm_medium || editingLink.utm_campaign || editingLink.utm_content))
    } else {
      resetForm()
    }
  }, [editingLink])

  const resetForm = () => {
    setDestination('')
    setCustomSlug('')
    setTitle('')
    setDescription('')
    setUtmSource('')
    setUtmMedium('')
    setUtmCampaign('')
    setUtmContent('')
    setError(null)
    setSlugStatus('idle')
    setGeneratedSlug(null)
    setShowUtmFields(false)
  }

  // Check slug availability with debounce
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug.trim()) {
      setSlugStatus('idle')
      return
    }

    setSlugStatus('checking')
    try {
      const taken = await isSlugTaken(slug, editingLink?.id)
      setSlugStatus(taken ? 'taken' : 'available')
    } catch {
      setSlugStatus('idle')
    }
  }, [editingLink?.id])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customSlug) {
        checkSlug(customSlug)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [customSlug, checkSlug])

  const handleGenerateSlug = async () => {
    try {
      const slug = await generateUniqueSlug()
      setCustomSlug(slug)
      setGeneratedSlug(slug)
      setSlugStatus('available')
    } catch {
      setError('Failed to generate slug')
    }
  }

  const handleCopyLink = async () => {
    const slug = customSlug || generatedSlug
    if (!slug) return

    const url = buildTrackingUrl(slug)
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!destination.trim()) {
      setError('Destination URL is required')
      return
    }

    try {
      new URL(destination)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    if (slugStatus === 'taken') {
      setError('This slug is already taken. Please choose a different one.')
      return
    }

    setIsSubmitting(true)

    try {
      let link: TrackedLink

      if (isEditing && editingLink) {
        link = await updateTrackedLink(editingLink.id, {
          destination: destination.trim(),
          slug: customSlug.trim() || undefined,
          title: title.trim() || null,
          description: description.trim() || null,
          utm_source: utmSource.trim() || null,
          utm_medium: utmMedium.trim() || null,
          utm_campaign: utmCampaign.trim() || null,
          utm_content: utmContent.trim() || null,
        })
      } else {
        const input: CreateTrackedLinkInput = {
          destination: destination.trim(),
          slug: customSlug.trim() || undefined,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          utm_source: utmSource.trim() || undefined,
          utm_medium: utmMedium.trim() || undefined,
          utm_campaign: utmCampaign.trim() || undefined,
          utm_content: utmContent.trim() || undefined,
        }
        link = await createTrackedLink(input)
      }

      onSuccess?.(link)
      if (!isEditing) {
        resetForm()
      }
    } catch (err) {
      console.error('Error saving link:', err)
      setError(err instanceof Error ? err.message : 'Failed to save link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewUrl = (customSlug || generatedSlug) ? buildTrackingUrl(customSlug || generatedSlug!) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FFDE1A]/10 border border-[#FFDE1A]/20">
            <LinkIcon className="w-5 h-5 text-[#FFDE1A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {isEditing ? 'Edit Tracked Link' : 'Create New Link'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isEditing ? 'Update link details and tracking parameters' : 'Generate a trackable short link with analytics'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination URL */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Destination URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="destination"
            type="url"
            placeholder="https://example.com/your-page"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full"
            required
          />
        </div>

        {/* Custom Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Custom Slug (optional)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="slug"
                type="text"
                placeholder="my-custom-link"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className={`w-full pr-10 ${
                  slugStatus === 'taken' ? 'border-red-500 focus:border-red-500' :
                  slugStatus === 'available' ? 'border-green-500 focus:border-green-500' : ''
                }`}
              />
              {slugStatus === 'checking' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                </div>
              )}
              {slugStatus === 'available' && (
                <CheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {slugStatus === 'taken' && (
                <ExclamationCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateSlug}
              className="shrink-0"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
          {slugStatus === 'taken' && (
            <p className="text-xs text-red-500">This slug is already taken</p>
          )}
          {slugStatus === 'available' && customSlug && (
            <p className="text-xs text-green-500">Slug is available!</p>
          )}
        </div>

        {/* Preview URL */}
        {previewUrl && (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Preview URL</p>
                <p className="text-sm font-mono text-zinc-900 dark:text-white truncate">{previewUrl}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Title & Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title (optional)
            </Label>
            <Input
              id="title"
              type="text"
              placeholder="My Campaign Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description (optional)
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Link for Q1 marketing campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* UTM Parameters Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowUtmFields(!showUtmFields)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <span className={`transform transition-transform ${showUtmFields ? 'rotate-90' : ''}`}>▶</span>
            UTM Parameters
            {(utmSource || utmMedium || utmCampaign || utmContent) && (
              <span className="px-1.5 py-0.5 bg-[#FFDE1A] text-black text-xs font-bold rounded-full">
                {[utmSource, utmMedium, utmCampaign, utmContent].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* UTM Fields */}
        {showUtmFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10"
          >
            <div className="space-y-2">
              <Label htmlFor="utm_source" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                UTM Source
              </Label>
              <Input
                id="utm_source"
                type="text"
                placeholder="google, newsletter, twitter"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_medium" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                UTM Medium
              </Label>
              <Input
                id="utm_medium"
                type="text"
                placeholder="cpc, email, social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_campaign" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                UTM Campaign
              </Label>
              <Input
                id="utm_campaign"
                type="text"
                placeholder="spring_sale, product_launch"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_content" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                UTM Content
              </Label>
              <Input
                id="utm_content"
                type="text"
                placeholder="banner_ad, text_link"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
              />
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#FFDE1A] hover:bg-[#F8BE00] text-black font-bold shadow-[0_0_20px_-5px_#FFDE1A]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Link' : 'Create Link'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  )
}

