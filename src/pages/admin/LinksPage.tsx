import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  LinkIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import LinkCreator from '@/components/admin/LinkCreator'
import LinkManager from '@/components/admin/LinkManager'
import LinkAnalytics from '@/components/admin/LinkAnalytics'
import { useToast } from '@/contexts/ToastContext'
import type { TrackedLink, TrackedLinkWithStats } from '@/lib/services/trackedLinks'

type TabType = 'all' | 'create' | 'analytics'

export default function LinksPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [editingLink, setEditingLink] = useState<TrackedLinkWithStats | null>(null)
  const [viewingAnalytics, setViewingAnalytics] = useState<TrackedLinkWithStats | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const toast = useToast()

  useEffect(() => {
    document.title = 'Tracked Links | AI Image Prompts Admin'
  }, [])

  const handleCreateSuccess = useCallback((_link: TrackedLink) => {
    toast.success(editingLink ? 'Link updated successfully!' : 'Link created successfully!')
    setEditingLink(null)
    setActiveTab('all')
    setRefreshTrigger(t => t + 1)
  }, [editingLink, toast])

  const handleEdit = useCallback((link: TrackedLinkWithStats) => {
    setEditingLink(link)
    setActiveTab('create')
  }, [])

  const handleViewAnalytics = useCallback((link: TrackedLinkWithStats) => {
    setViewingAnalytics(link)
    setActiveTab('analytics')
  }, [])

  const handleCancelCreate = useCallback(() => {
    setEditingLink(null)
    setActiveTab('all')
  }, [])

  const handleBackFromAnalytics = useCallback(() => {
    setViewingAnalytics(null)
    setActiveTab('all')
  }, [])

  const tabs = [
    { id: 'all' as const, label: 'All Links', icon: ListBulletIcon },
    { id: 'create' as const, label: editingLink ? 'Edit Link' : 'Create New', icon: PlusIcon },
    { id: 'analytics' as const, label: 'Analytics', icon: ChartBarIcon },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FFDE1A]/10 border border-[#FFDE1A]/20">
              <LinkIcon className="w-6 h-6 text-[#FFDE1A]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Tracked Links</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Create and manage trackable short links with analytics.</p>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onClick={() => {
            setEditingLink(null)
            setActiveTab('create')
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE1A] hover:bg-[#F8BE00] text-black font-bold rounded-xl transition-colors text-sm shadow-[0_0_20px_-5px_#FFDE1A] active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Link</span>
        </motion.button>
      </div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 w-fit"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'all') {
                setEditingLink(null)
                setViewingAnalytics(null)
              }
              if (tab.id === 'create') {
                setViewingAnalytics(null)
              }
              if (tab.id === 'analytics') {
                setEditingLink(null)
              }
              setActiveTab(tab.id)
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'analytics' && viewingAnalytics && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#FFDE1A] text-black text-xs font-bold rounded-full">1</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'all' && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LinkManager
              onEdit={handleEdit}
              onViewAnalytics={handleViewAnalytics}
              refreshTrigger={refreshTrigger}
            />
          </motion.div>
        )}

        {activeTab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LinkCreator
              editingLink={editingLink}
              onSuccess={handleCreateSuccess}
              onCancel={handleCancelCreate}
            />
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-none"
          >
            <LinkAnalytics
              link={viewingAnalytics}
              onBack={viewingAnalytics ? handleBackFromAnalytics : undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

