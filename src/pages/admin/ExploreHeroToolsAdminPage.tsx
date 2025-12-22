import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Link2, Image as ImageIcon, Trash2, Edit2, Loader2, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  type ExploreHeroTool,
  fetchAllExploreHeroTools,
  createExploreHeroTool,
  updateExploreHeroTool,
  deleteExploreHeroTool,
  uploadExploreHeroImage,
} from '@/lib/services/exploreHeroTools'
import { useToast } from '@/contexts/ToastContext'

type FormState = {
  id?: string
  name: string
  affiliate_link: string
  logo_url: string
  color: string
  sort_order: number
  is_active: boolean
}

const DEFAULT_COLOR = '#000000'

export default function ExploreHeroToolsAdminPage() {
  const toast = useToast()

  const [tools, setTools] = useState<ExploreHeroTool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formState, setFormState] = useState<FormState>({
    name: '',
    affiliate_link: '',
    logo_url: '',
    color: DEFAULT_COLOR,
    sort_order: 0,
    is_active: true,
  })

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchAllExploreHeroTools()
        setTools(data)
      } catch (err) {
        console.error('Error loading hero tools:', err)
        setError('Failed to load hero cards')
        toast.error('Failed to load hero cards')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [toast])

  const resetForm = () => {
    setFormState({
      name: '',
      affiliate_link: '',
      logo_url: '',
      color: DEFAULT_COLOR,
      sort_order: tools.length ? Math.max(...tools.map(t => t.sort_order ?? 0)) + 1 : 0,
      is_active: true,
    })
  }

  const openCreateForm = () => {
    resetForm()
    setIsFormOpen(true)
  }

  const openEditForm = (tool: ExploreHeroTool) => {
    setFormState({
      id: tool.id,
      name: tool.name,
      affiliate_link: tool.affiliate_link,
      logo_url: tool.logo_url,
      color: tool.color || DEFAULT_COLOR,
      sort_order: tool.sort_order ?? 0,
      is_active: tool.is_active,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
  }

  const handleInputChange = (field: keyof FormState, value: string | number | boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const filteredTools = useMemo(() => {
    if (!searchQuery) return tools
    const q = searchQuery.toLowerCase()
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.affiliate_link.toLowerCase().includes(q),
    )
  }, [tools, searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formState.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!formState.affiliate_link.trim()) {
      toast.error('Link is required')
      return
    }
    if (!formState.logo_url.trim()) {
      toast.error('Logo / image URL is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      if (formState.id) {
        const updated = await updateExploreHeroTool({
          id: formState.id,
          name: formState.name.trim(),
          affiliate_link: formState.affiliate_link.trim(),
          logo_url: formState.logo_url.trim(),
          color: formState.color || DEFAULT_COLOR,
          sort_order: formState.sort_order,
          is_active: formState.is_active,
        })

        setTools(prev => prev.map(t => (t.id === updated.id ? updated : t)))
        toast.success('Hero card updated')
      } else {
        const created = await createExploreHeroTool({
          name: formState.name.trim(),
          affiliate_link: formState.affiliate_link.trim(),
          logo_url: formState.logo_url.trim(),
          color: formState.color || DEFAULT_COLOR,
          sort_order: formState.sort_order,
          is_active: formState.is_active,
        })

        setTools(prev => [...prev, created].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
        toast.success('Hero card created')
      }

      setIsFormOpen(false)
    } catch (err) {
      console.error('Error saving hero tool:', err)
      const message = err instanceof Error ? err.message : 'Failed to save hero card'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (tool: ExploreHeroTool) => {
    if (!confirm(`Delete hero card for "${tool.name}"?`)) return

    try {
      setDeletingId(tool.id)
      await deleteExploreHeroTool(tool.id)
      setTools(prev => prev.filter(t => t.id !== tool.id))
      toast.success('Hero card deleted')
    } catch (err) {
      console.error('Error deleting hero tool:', err)
      toast.error('Failed to delete hero card')
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (tool: ExploreHeroTool) => {
    try {
      const updated = await updateExploreHeroTool({
        id: tool.id,
        is_active: !tool.is_active,
      })
      setTools(prev => prev.map(t => (t.id === updated.id ? updated : t)))
      toast.success(updated.is_active ? 'Card enabled' : 'Card hidden from hero')
    } catch (err) {
      console.error('Error toggling active:', err)
      toast.error('Failed to update card visibility')
    }
  }

  const handleBumpSort = async (tool: ExploreHeroTool, direction: 'up' | 'down') => {
    const sorted = [...tools].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const index = sorted.findIndex(t => t.id === tool.id)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sorted.length) return

    const other = sorted[targetIndex]
    try {
      const [updatedA, updatedB] = await Promise.all([
        updateExploreHeroTool({ id: tool.id, sort_order: other.sort_order }),
        updateExploreHeroTool({ id: other.id, sort_order: tool.sort_order }),
      ])

      let next = tools.map(t => {
        if (t.id === updatedA.id) return updatedA
        if (t.id === updatedB.id) return updatedB
        return t
      })
      next = next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setTools(next)
    } catch (err) {
      console.error('Error reordering tools:', err)
      toast.error('Failed to reorder cards')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB, matches prompt-images bucket limit
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image is too large. Max size is 5MB.')
      return
    }

    try {
      setIsSaving(true)
      const url = await uploadExploreHeroImage(file)
      setFormState(prev => ({ ...prev, logo_url: url }))
      toast.success('Image uploaded')
    } catch (err) {
      console.error('Error uploading image:', err)
      const message = err instanceof Error ? err.message : 'Failed to upload image'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-height-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFDE1A]" />
          <p className="text-sm text-zinc-500">Loading hero cards…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Explore Hero Cards
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            Curate the AI tools showcased in the Explore page hero. Upload logos, set destination links,
            re-order cards, and toggle which ones are live.
          </p>
        </div>
        <Button onClick={openCreateForm} className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Add Hero Card
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name or link..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FFDE1A]/50 focus:border-[#FFDE1A] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
            <span className="text-zinc-900 dark:text-white font-bold">{filteredTools.length}</span> cards
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {filteredTools.filter(t => t.is_active).length} active
            </span>
          </div>
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No hero cards found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
            Get started by adding your first AI tool card. It will be showcased in the Explore page hero section.
          </p>
          <Button onClick={openCreateForm} className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" />
            Create First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTools
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map(tool => (
              <div
                key={tool.id}
                className={`group relative flex flex-col justify-between bg-white dark:bg-zinc-900 border-2 rounded-2xl transition-all duration-200 hover:shadow-md ${tool.is_active
                  ? 'border-zinc-100 dark:border-zinc-800 hover:border-[#FFDE1A] dark:hover:border-[#FFDE1A]'
                  : 'border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
              >
                {/* Status Indicator Bar */}
                {tool.is_active && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                )}

                <div className="p-5 pb-0 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-black p-1 shadow-sm group-hover:scale-105 transition-transform duration-300"
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center">
                          {tool.logo_url ? (
                            <img
                              src={tool.logo_url}
                              alt={tool.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                      </div>
                      <div
                        className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold shadow-sm"
                        style={{ backgroundColor: tool.color || '#000', color: '#fff' }}
                      >
                        #
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-full">
                      <Link2 className="w-3 h-3 flex-shrink-0" />
                      <a href={tool.affiliate_link} target="_blank" rel="noreferrer" className="truncate hover:underline decoration-zinc-300 underline-offset-2">
                        {tool.affiliate_link.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-5 p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-b-2xl">
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
                    <button
                      onClick={() => handleBumpSort(tool, 'up')}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-zinc-400 w-6 text-center select-none">
                      {tool.sort_order}
                    </span>
                    <button
                      onClick={() => handleBumpSort(tool, 'down')}
                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(tool)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all ${tool.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'
                        }`}
                      title={tool.is_active ? "Card is Visible" : "Card is Hidden"}
                    >
                      {tool.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
                    <button
                      onClick={() => openEditForm(tool)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      title="Edit Card"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tool)}
                      disabled={deletingId === tool.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete Card"
                    >
                      {deletingId === tool.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {formState.id ? 'Edit Hero Card' : 'New Hero Card'}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Upload a logo, set the outbound link, and choose a signature color that matches the tool’s identity.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="text-zinc-400 hover:text-zinc-100 text-sm"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Tool name</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Midjourney, DALL·E 3, Stable Diffusion"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="affiliate_link">Link</Label>
                <Input
                  id="affiliate_link"
                  value={formState.affiliate_link}
                  onChange={e => handleInputChange('affiliate_link', e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Use your affiliate URL if you have one – clicks from the hero cards will go here.
                </p>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="logo_url">Logo / image URL</Label>
                  <Input
                    id="logo_url"
                    value={formState.logo_url}
                    onChange={e => handleInputChange('logo_url', e.target.value)}
                    placeholder="https:// or Supabase public image URL"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Upload</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <label className="inline-flex items-center justify-center gap-1 cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              {formState.logo_url && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                  <div className="aspect-[4/1] flex items-center justify-center">
                    <img
                      src={formState.logo_url}
                      alt="Preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="color">Accent color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      value={formState.color}
                      onChange={e => handleInputChange('color', e.target.value)}
                      placeholder="#000000"
                      className="font-mono text-xs"
                    />
                    <div
                      className="w-8 h-8 rounded-md border border-zinc-200 dark:border-zinc-700"
                      style={{ backgroundColor: formState.color || DEFAULT_COLOR }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Used for card halo and tag styling in the hero.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sort_order">Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formState.sort_order}
                    onChange={e => handleInputChange('sort_order', Number(e.target.value || 0))}
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Lower numbers appear earlier in the hero rotation.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleInputChange('is_active', !formState.is_active)}
                  className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  {formState.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-500" />
                      Visible in hero
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-zinc-400" />
                      Hidden
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-[#FFDE1A] text-black hover:bg-[#F8BE00] font-bold min-w-[110px]"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save card'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}


