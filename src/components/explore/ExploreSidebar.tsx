import React, { useState, useEffect } from 'react'
import { Search, X, SlidersHorizontal, Hash, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterModal } from './FilterModal'

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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(!!searchQuery)

  // Calculate visible categories (10 total including "All Categories")
  // "All Categories" counts as 1, so we show 9 more categories
  const visibleCategories = categories.slice(0, 9)
  const hasMoreCategories = categories.length > 9

  // Keep search expanded if there's a query
  useEffect(() => {
    if (searchQuery) {
      setIsSearchExpanded(true)
    }
  }, [searchQuery])

  const handleSearchButtonClick = () => {
    setIsSearchExpanded(true)
    setIsSearchFocused(true)
  }

  const handleSearchBlur = () => {
    // Only collapse if search query is empty
    if (!searchQuery) {
      setIsSearchExpanded(false)
      setIsSearchFocused(false)
    } else {
      setIsSearchFocused(false)
    }
  }

  return (
    <>
      <aside className="w-full lg:w-80 flex-shrink-0">
        {/* Unified Container: Search, Categories, and Popular Tags */}
        <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-black/5 dark:border-white/5 p-6 space-y-6">
          {/* Search Section */}
          <div className="flex items-center gap-3">
            {/* Search Button/Bar - Left Side */}
            <motion.div
              layout
              initial={false}
              animate={{
                width: isSearchExpanded ? '100%' : 40,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className={`relative flex items-center bg-white dark:bg-zinc-900 rounded-full border-2 h-10 overflow-hidden ${isSearchFocused ? 'border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black/10 dark:border-white/10 hover:border-black/30'} ${!isSearchExpanded ? 'justify-center cursor-pointer' : ''}`}
              onClick={!isSearchExpanded ? handleSearchButtonClick : undefined}
              role={!isSearchExpanded ? 'button' : undefined}
              aria-label={!isSearchExpanded ? 'Search' : undefined}
              tabIndex={!isSearchExpanded ? 0 : undefined}
            >
              {!isSearchExpanded ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Search size={18} strokeWidth={2.5} className="text-gray-600 dark:text-gray-400" />
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className={`pl-3 text-gray-400 transition-colors duration-200 ${isSearchFocused ? 'text-black dark:text-white' : ''}`}
                  >
                    <Search size={16} strokeWidth={2.5} />
                  </motion.div>
                  <motion.input
                    layout
                    type="text"
                    value={searchQuery}
                    onChange={onSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={handleSearchBlur}
                    placeholder="Search prompts..."
                    autoFocus
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.15 }}
                    className="flex-1 h-full pl-2 pr-8 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold placeholder:text-gray-400 dark:placeholder:text-zinc-600 text-black dark:text-white min-w-0"
                  />
                  <AnimatePresence>
                    {searchQuery && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={onClearSearch}
                        className="absolute right-2 p-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                      >
                        <X size={12} strokeWidth={3} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>

            {/* Filter Icon Button - Right Side */}
            <motion.button
              layout
              onClick={() => setIsFilterModalOpen(true)}
              className="h-10 w-10 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full border-2 border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 transition-all duration-200 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] flex-shrink-0"
              aria-label="View all filters"
            >
              <Filter size={18} strokeWidth={2.5} className="text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Categories Section - Limited to 10 (including "All Categories") */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <SlidersHorizontal size={20} strokeWidth={2.5} />
              Categories
            </h3>

            <div className="space-y-1">
              {isLoadingCategories ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-10 bg-gray-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {/* "All" Option - Spans full width for prominence */}
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

                    {/* Show only first 9 categories (10 total with "All") */}
                    {visibleCategories.map((cat) => (
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

                  {/* Filter Button - Show if there are more categories */}
                  {hasMoreCategories && (
                    <motion.button
                      onClick={() => setIsFilterModalOpen(true)}
                      className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-[#F8BE00] hover:text-black hover:border-black transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                    >
                      <Filter size={16} strokeWidth={2.5} />
                      View All Filters
                    </motion.button>
                  )}
                </>
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
                  popularTags.slice(0, 5).map((tagItem) => {
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
        </div>
      </aside>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        popularTags={popularTags}
        selectedTag={selectedTag}
        onTagClick={onTagClick}
        isLoadingCategories={isLoadingCategories}
        isLoadingTags={isLoadingTags}
      />
    </>
  )
}
