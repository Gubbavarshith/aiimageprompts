import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  createTrackedLink,
  updateTrackedLink,
  type TrackedLinkWithStats,
  type TrackedLinkPayload,
} from '@/lib/services/trackedLinks'
import { useToast } from '@/contexts/ToastContext'

const SITE_URL = 'https://aiimageprompts.xyz'

const PLATFORM_OPTIONS = [
  'Pinterest',
  'Twitter',
  'Ads',
  'Manual',
  'Telegram',
  'Facebook',
  'Instagram',
  'Other',
]

const WEBSITE_PAGES = [
  { label: 'Homepage', path: '/' },
  { label: 'Explore', path: '/explore' },
  { label: 'Submit Prompt', path: '/submit' },
  { label: 'Saved Prompts', path: '/saved' },
  { label: 'Profile', path: '/profile' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Guidelines', path: '/guidelines' },
  { label: 'Terms', path: '/terms' },
  { label: 'Privacy', path: '/privacy' },
  { label: 'Refund Policy', path: '/refund' },
]

interface LinkCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingLink?: TrackedLinkWithStats | null
}

export default function LinkCreationModal({ isOpen, onClose, onSuccess, editingLink }: LinkCreationModalProps) {
  const [formData, setFormData] = useState<TrackedLinkPayload>({
    destination_url: '',
    campaign_name: '',
    platform: 'Manual',
    notes: null,
    status: 'active',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [createdLink, setCreatedLink] = useState<{ unique_id: string } | null>(null)
  const [urlInputType, setUrlInputType] = useState<'dropdown' | 'manual'>('dropdown')
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [customPlatform, setCustomPlatform] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      if (editingLink) {
        setFormData({
          destination_url: editingLink.destination_url,
          campaign_name: editingLink.campaign_name,
          platform: editingLink.platform,
          notes: editingLink.notes,
          status: editingLink.status,
        })
        setCreatedLink(null)
        // Check if URL is from our website pages
        const isWebsitePage = WEBSITE_PAGES.some(page => editingLink.destination_url === `${SITE_URL}${page.path}`)
        setUrlInputType(isWebsitePage ? 'dropdown' : 'manual')
      } else {
        setFormData({
          destination_url: '',
          campaign_name: '',
          platform: 'Manual',
          notes: null,
          status: 'active',
        })
        setCreatedLink(null)
        setUrlInputType('dropdown')
      }
      setShowPlatformModal(false)
      setCustomPlatform('')
    }
  }, [isOpen, editingLink])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Validate URL
      try {
        new URL(formData.destination_url)
      } catch {
        toast.error('Please enter a valid URL')
        setIsSaving(false)
        return
      }

      if (editingLink) {
        // Update existing link
        await updateTrackedLink(editingLink.id, formData)
        toast.success('Link updated successfully')
        onSuccess()
      } else {
        // Create new link
        const newLink = await createTrackedLink(formData)
        setCreatedLink({ unique_id: newLink.unique_id })
        toast.success('Link created successfully')
        // Don't close immediately - show the created link
      }
    } catch (err: any) {
      console.error(err)
      toast.error(`Failed to ${editingLink ? 'update' : 'create'} link: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyShortUrl = async () => {
    if (!createdLink) return
    const shortUrl = `${SITE_URL}/go/${createdLink.unique_id}`
    try {
      await navigator.clipboard.writeText(shortUrl)
      toast.success('Short URL copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy URL')
    }
  }

  const handlePageSelect = (path: string) => {
    setFormData({ ...formData, destination_url: `${SITE_URL}${path}` })
  }

  const handlePlatformChange = (platform: string) => {
    if (platform === 'Other') {
      setShowPlatformModal(true)
    } else {
      setFormData({ ...formData, platform })
    }
  }

  const handleCustomPlatformSubmit = () => {
    if (!customPlatform.trim()) {
      toast.error('Please enter a platform name')
      return
    }
    setFormData({ ...formData, platform: customPlatform.trim() })
    setShowPlatformModal(false)
    setCustomPlatform('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-[#0c0c0e] z-10 pb-4 border-b border-zinc-100 dark:border-white/5">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {editingLink ? 'Edit Tracked Link' : 'Create Tracked Link'}
              </h2>
              <p className="text-sm text-zinc-500">Manage your campaign tracking links</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Created Link Display */}
          {createdLink && !editingLink && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Link created successfully!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white dark:bg-black rounded border border-green-200 dark:border-green-800 text-sm font-mono text-green-700 dark:text-green-300">
                  {SITE_URL}/go/{createdLink.unique_id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyShortUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Use this link in your campaigns. Analytics will be tracked automatically.
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Destination URL *
                </label>
                <button
                  type="button"
                  onClick={() => setUrlInputType(urlInputType === 'dropdown' ? 'manual' : 'dropdown')}
                  className="text-xs text-[#FFDE1A] hover:underline"
                >
                  {urlInputType === 'dropdown' ? 'Enter custom URL' : 'Select from pages'}
                </button>
              </div>
              {urlInputType === 'dropdown' ? (
                <select
                  value={formData.destination_url}
                  onChange={(e) => {
                    if (e.target.value) {
                      handlePageSelect(e.target.value)
                    } else {
                      setFormData({ ...formData, destination_url: '' })
                    }
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
                >
                  <option value="">Select a page...</option>
                  {WEBSITE_PAGES.map((page) => (
                    <option key={page.path} value={page.path}>
                      {page.label} ({page.path})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="url"
                  value={formData.destination_url}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                  placeholder="https://example.com/page"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={formData.campaign_name}
                  onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                  placeholder="Summer Sale 2024"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Platform *
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
                >
                  {PLATFORM_OPTIONS.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                placeholder="Internal notes about this link..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              disabled={isSaving}
            >
              {createdLink && !editingLink ? 'Done' : 'Cancel'}
            </button>
            {(!createdLink || editingLink) && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : editingLink ? 'Update Link' : 'Create Link'}
              </button>
            )}
          </div>
        </form>

        {/* Custom Platform Modal */}
        {showPlatformModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl p-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                Enter Custom Platform
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Please enter the name of the platform
              </p>
              <input
                type="text"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCustomPlatformSubmit()
                  }
                  if (e.key === 'Escape') {
                    setShowPlatformModal(false)
                    setCustomPlatform('')
                  }
                }}
                placeholder="e.g., LinkedIn, TikTok, etc."
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50 mb-4"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlatformModal(false)
                    setCustomPlatform('')
                    setFormData({ ...formData, platform: 'Manual' })
                  }}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCustomPlatformSubmit}
                  className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

