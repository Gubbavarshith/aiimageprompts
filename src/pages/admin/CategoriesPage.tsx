import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { fetchCategoriesWithCounts, type CategoryWithCount } from '@/lib/services/categories'
import { fetchAllCategoryMeta, upsertCategoryMeta, type CategoryMeta, type CategoryMetaPayload } from '@/lib/services/categoryMeta'
import { useToast } from '@/contexts/ToastContext'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [categoryMeta, setCategoryMeta] = useState<Map<string, CategoryMeta>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<CategoryMetaPayload | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    document.title = 'Categories | AI Image Prompts Admin'
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [categoriesData, metaData] = await Promise.all([
        fetchCategoriesWithCounts(),
        fetchAllCategoryMeta(),
      ])

      setCategories(categoriesData)
      
      // Create a map of category name -> meta
      const metaMap = new Map<string, CategoryMeta>()
      metaData.forEach(meta => {
        metaMap.set(meta.category_name, meta)
      })
      setCategoryMeta(metaMap)
    } catch (err) {
      console.error(err)
      setError('Unable to load categories right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (categoryName: string) => {
    const meta = categoryMeta.get(categoryName)
    setEditingCategory(categoryName)
    setEditForm({
      category_name: categoryName,
      icon: meta?.icon || null,
      accent_color: meta?.accent_color || null,
      description: meta?.description || null,
      is_featured: meta?.is_featured || false,
      display_order: meta?.display_order || 0,
    })
  }

  const handleSave = async () => {
    if (!editForm) return

    setIsSaving(true)
    try {
      await upsertCategoryMeta(editForm)
      toast.success('Category meta updated successfully!')
      setEditingCategory(null)
      setEditForm(null)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update category meta. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Categories</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage category metadata and display settings.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0c0c0e] overflow-hidden shadow-sm dark:shadow-none">
        <div className="overflow-x-auto">
          {categories.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-zinc-500 dark:text-zinc-400">No categories found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Prompt Count</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Icon</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Accent Color</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {categories.map((category) => {
                  const meta = categoryMeta.get(category.category)
                  return (
                    <motion.tr
                      key={category.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-white">{category.category}</div>
                        {meta?.description && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{meta.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {category.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                        {meta?.icon || '—'}
                      </td>
                      <td className="px-6 py-4">
                        {meta?.accent_color ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-zinc-200 dark:border-white/10"
                              style={{ backgroundColor: meta.accent_color }}
                            />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{meta.accent_color}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {meta?.is_featured ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFDE1A]/10 text-[#FFDE1A] border border-[#FFDE1A]/20">
                            Yes
                          </span>
                        ) : (
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(category.category)}
                            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors active:scale-95"
                            title="Edit category meta"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCategory && editForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingCategory(null)
                setEditForm(null)
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Category Meta</h2>
                  <button
                    onClick={() => {
                      setEditingCategory(null)
                      setEditForm(null)
                    }}
                    className="p-2 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Category</label>
                    <input
                      type="text"
                      value={editForm.category_name}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Icon</label>
                    <input
                      type="text"
                      value={editForm.icon || ''}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value || null })}
                      placeholder="e.g., 🎨 or icon-name"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editForm.accent_color || '#FFDE1A'}
                        onChange={(e) => setEditForm({ ...editForm, accent_color: e.target.value })}
                        className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-white/10 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editForm.accent_color || ''}
                        onChange={(e) => setEditForm({ ...editForm, accent_color: e.target.value || null })}
                        placeholder="#FFDE1A"
                        className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value || null })}
                      placeholder="Brief description of this category"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.is_featured || false}
                        onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-300 text-[#FFDE1A] focus:ring-[#FFDE1A]"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
                    </label>

                    <div className="flex-1">
                      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={editForm.display_order || 0}
                        onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#FFDE1A]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      setEditingCategory(null)
                      setEditForm(null)
                    }}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-[#FFDE1A] text-black text-sm font-semibold shadow-[0_0_15px_-5px_#FFDE1A] hover:bg-[#ffe64d] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

