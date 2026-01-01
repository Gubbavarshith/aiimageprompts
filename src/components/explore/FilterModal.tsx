import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SlidersHorizontal, Hash } from 'lucide-react'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  popularTags: Array<{ tag: string; count: number }>
  selectedTag: string | null
  onTagClick: (tag: string) => void
  isLoadingCategories: boolean
  isLoadingTags: boolean
}

export function FilterModal({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
  popularTags,
  selectedTag,
  onTagClick,
  isLoadingCategories,
  isLoadingTags
}: FilterModalProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories')

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleCategorySelect = (category: string) => {
    onCategoryChange(category)
    onClose()
  }

  const handleTagSelect = (tag: string) => {
    onTagClick(tag)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-[2.5rem] shadow-[24px_24px_0px_0px_rgba(248,190,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(248,190,0,0.4)] overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b-2 border-black/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="font-display font-bold text-2xl text-black dark:text-white">
                Filters
              </h2>
              <button
                onClick={onClose}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-[#F8BE00] hover:text-black transition-all active:scale-90"
                aria-label="Close filter modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-black/10 dark:border-white/10">
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex-1 px-6 py-4 font-display font-bold text-lg transition-all duration-200 relative ${
                  activeTab === 'categories'
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <SlidersHorizontal size={20} strokeWidth={2.5} />
                  Categories
                </div>
                {activeTab === 'categories' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#F8BE00]"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`flex-1 px-6 py-4 font-display font-bold text-lg transition-all duration-200 relative ${
                  activeTab === 'tags'
                    ? 'text-black dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Hash size={20} strokeWidth={2.5} />
                  Tags
                </div>
                {activeTab === 'tags' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#F8BE00]"
                  />
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'categories' ? (
                  <motion.div
                    key="categories"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h3 className="font-display font-bold text-xl text-black dark:text-white mb-4">
                      All Categories
                    </h3>
                    {isLoadingCategories ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <div key={i} className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {/* "All" Option */}
                        <motion.button
                          onClick={() => handleCategorySelect('All')}
                          className={`col-span-2 flex items-center justify-center w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden ${
                            selectedCategory === 'All' || !selectedCategory
                              ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(248,190,0,1)]'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white bg-white/50 dark:bg-zinc-800/50'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors ${
                              selectedCategory === 'All' || !selectedCategory
                                ? 'bg-[#F8BE00]'
                                : 'bg-gray-300 dark:bg-zinc-700 group-hover:bg-[#F8BE00]'
                            }`}
                          />
                          All Categories
                        </motion.button>

                        {categories.map((cat) => (
                          <motion.button
                            key={cat}
                            onClick={() => handleCategorySelect(cat)}
                            className={`flex items-center w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200 group relative overflow-hidden ${
                              selectedCategory === cat
                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(248,190,0,1)]'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white bg-white/50 dark:bg-zinc-800/50'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 flex-shrink-0 rounded-full mr-2 transition-colors ${
                                selectedCategory === cat
                                  ? 'bg-[#F8BE00]'
                                  : 'bg-gray-300 dark:bg-zinc-700 group-hover:bg-[#F8BE00]'
                              }`}
                            />
                            <span className="truncate">{cat}</span>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="tags"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <h3 className="font-display font-bold text-xl text-black dark:text-white mb-4">
                      All Tags
                    </h3>
                    {isLoadingTags ? (
                      <div className="text-sm text-gray-400">Loading tags...</div>
                    ) : popularTags.length === 0 ? (
                      <div className="text-sm text-gray-400">No tags available</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map((tagItem) => {
                          const isActive = selectedTag === tagItem.tag
                          return (
                            <button
                              key={tagItem.tag}
                              onClick={() => handleTagSelect(tagItem.tag)}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#F8BE00] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                              }`}
                            >
                              #{tagItem.tag}
                              {tagItem.count > 1 && (
                                <span className="ml-1 opacity-60">({tagItem.count})</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

