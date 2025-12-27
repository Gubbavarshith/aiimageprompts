import React from 'react'
import { Search, X, SlidersHorizontal, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ExploreSidebarProps {
  searchQuery: string
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearSearch: () => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  popularTags: Array<{ tag: string; count: number }>
  selectedTag: string | null
  onTagClick: (tag: string) => void
  isLoadingCategories: boolean
  isLoadingTags: boolean
  isSearchFocused: boolean
  setIsSearchFocused: (focused: boolean) => void
}

export function ExploreSidebar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  categories,
  selectedCategory,
  onCategoryChange,
  popularTags,
  selectedTag,
  onTagClick,
  isLoadingCategories,
  isLoadingTags,
  isSearchFocused,
  setIsSearchFocused
}: ExploreSidebarProps) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0 space-y-8">
      {/* Search Section */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl flex items-center gap-2">
          <Search size={20} strokeWidth={2.5} />
          Search
        </h3>
        <div className="relative group">
          <motion.div
            className={`absolute -inset-1 bg-gradient-to-r from-[#F8BE00] via-orange-400 to-[#F8BE00] rounded-xl blur-md opacity-0 transition-opacity duration-500 ${isSearchFocused ? 'opacity-50' : 'group-hover:opacity-25'}`}
          />
          <div className={`relative flex items-center bg-white dark:bg-zinc-900 rounded-xl transition-all duration-300 border-2 ${isSearchFocused ? 'border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black/10 dark:border-white/10 hover:border-black/30'}`}>
            <div className={`pl-4 text-gray-400 transition-colors duration-300 ${isSearchFocused ? 'text-black dark:text-white' : ''}`}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search prompts..."
              className="w-full h-12 pl-3 pr-10 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base font-bold placeholder:text-gray-400 dark:placeholder:text-zinc-600 text-black dark:text-white"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={onClearSearch}
                  className="absolute right-3 p-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                >
                  <X size={14} strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Categories Section - Styled like the reference sidebar (Vertical list) */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl flex items-center gap-2">
          <SlidersHorizontal size={20} strokeWidth={2.5} />
          Categories
        </h3>

        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-black/5 dark:border-white/5 p-4 space-y-1">
          {isLoadingCategories ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* "All" Option - Spans full width for prominence or just 1st tile */}
              <motion.button
                onClick={() => onCategoryChange('All')}
                className={`col-span-2 flex items-center justify-center w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 group relative overflow-hidden ${(selectedCategory === 'All' || !selectedCategory)
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(248,190,0,1)]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white bg-white/50 dark:bg-zinc-800/50'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors ${(selectedCategory === 'All' || !selectedCategory) ? 'bg-[#F8BE00]' : 'bg-gray-300 dark:bg-zinc-700 group-hover:bg-[#F8BE00]'
                  }`} />
                All Categories
              </motion.button>

              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`flex items-center w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200 group relative overflow-hidden ${selectedCategory === cat
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(248,190,0,1)]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white bg-white/50 dark:bg-zinc-800/50'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 flex-shrink-0 rounded-full mr-2 transition-colors ${selectedCategory === cat ? 'bg-[#F8BE00]' : 'bg-gray-300 dark:bg-zinc-700 group-hover:bg-[#F8BE00]'
                    }`} />
                  <span className="truncate">{cat}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular Tags Section */}
      {popularTags.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-xl flex items-center gap-2">
            <Hash size={20} strokeWidth={2.5} />
            Popular Tags
          </h3>

          <div className="flex flex-wrap gap-2">
            {isLoadingTags ? (
              <div className="text-sm text-gray-400">Loading tags...</div>
            ) : (
              popularTags.slice(0, 15).map((tagItem) => {
                const isActive = selectedTag === tagItem.tag
                return (
                  <button
                    key={tagItem.tag}
                    onClick={() => onTagClick(tagItem.tag)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${isActive
                        ? 'bg-[#F8BE00] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                      }`}
                  >
                    #{tagItem.tag}
                    {tagItem.count > 1 && <span className="ml-1 opacity-60">({tagItem.count})</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
