import { useState, useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  HomeIcon,
  PhotoIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  TagIcon,
  HashtagIcon,
  ArrowUpTrayIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../lib/utils'
import { useTheme } from '../components/use-theme'
import { supabase, isSupabaseReady } from '../lib/supabaseClient'
import { fetchPromptsForReview } from '../lib/services/prompts'
import { fetchEmailSubscriptions } from '../lib/services/emailSubscriptions'
import FloatingActionMenu from '../components/ui/floating-action-menu'
import { useAdmin } from '../contexts/AdminContext'
import PromptFormModal from '../components/admin/PromptFormModal'

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [reviewCount, setReviewCount] = useState(0)
  const [subscriptionsCount, setSubscriptionsCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { isPromptModalOpen, closePromptForm, openPromptForm, editingPrompt } = useAdmin()

  // Get user info from Supabase session and listen for changes
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          setUserEmail(session.user.email)
        }
      } catch (error) {
        console.error('Error getting user session:', error)
      }
    }

    getUserEmail()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      } else {
        setUserEmail('') // Fallback - empty string instead of misleading placeholder
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      navigate('/admin/login', { replace: true })
    } catch (error) {
      console.error('Error during logout:', error)
      // Still navigate to login even if signOut fails
      navigate('/admin/login', { replace: true })
    }
  }

  // Fetch counts for sidebar badges
  const fetchCounts = useCallback(async () => {
    if (!isSupabaseReady()) {
      setReviewCount(0)
      setSubscriptionsCount(0)
      return
    }

    try {
      const [reviewPrompts, subscriptions] = await Promise.all([
        fetchPromptsForReview().catch(() => []),
        fetchEmailSubscriptions().catch(() => []),
      ])
      setReviewCount(reviewPrompts.length)
      setSubscriptionsCount(subscriptions.length)
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }, [])

  useEffect(() => {
    fetchCounts()
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchCounts])

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, count: null },
    { name: 'Prompts', href: '/admin/prompts', icon: PhotoIcon, count: null },
    { name: 'Bulk', href: '/admin/bulk', icon: ArrowUpTrayIcon, count: null },
    { name: 'Review', href: '/admin/review', icon: ClipboardDocumentCheckIcon, count: reviewCount },
    { name: 'Explore Hero', href: '/admin/explore-hero', icon: PhotoIcon, count: null },
    { name: 'Blogs', href: '/admin/blogs', icon: DocumentTextIcon, count: null },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: EnvelopeIcon, count: subscriptionsCount },
    { name: 'Categories', href: '/admin/categories', icon: TagIcon, count: null },
    { name: 'Tags', href: '/admin/tags', icon: HashtagIcon, count: null },
    { name: 'Link Tracking', href: '/admin/links', icon: LinkIcon, count: null },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, count: null },
  ]

  const floatingMenuOptions = [
    {
      label: 'Add New Prompt',
      onClick: () => openPromptForm(),
      Icon: <PlusIcon className="w-4 h-4" />,
    },
    {
      label: 'View Public Site',
      onClick: () => window.open('/', '_blank'),
      Icon: <ArrowTopRightOnSquareIcon className="w-4 h-4" />,
    },
  ]

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-white font-sans selection:bg-[#FFDE1A] selection:text-black transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFDE1A] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl leading-none">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight">AI PROMPTS</span>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
            className="ml-auto lg:hidden text-zinc-500 hover:text-black dark:hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">Menu</p>
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden",
                  active
                    ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-zinc-200 dark:border-white/5"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-[#FFDE1A]/10 dark:bg-gradient-to-r dark:from-[#FFDE1A]/10 dark:to-transparent opacity-50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#FFDE1A] rounded-r-full shadow-[0_0_10px_#FFDE1A]" />
                )}

                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    active ? "text-[#FFDE1A] dark:text-[#FFDE1A]" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                  )}
                />
                <span className="relative z-10 flex-1">{item.name}</span>
                {item.count !== null && (
                  <span
                    className={cn(
                      "relative z-10 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-bold transition-colors",
                      active
                        ? item.count > 0
                          ? "bg-[#FFDE1A] text-black"
                          : "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400"
                        : item.count > 0
                          ? "bg-yellow-500 text-black"
                          : "bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User / Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#09090b]/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/10">
              <span className="font-bold text-sm text-zinc-700 dark:text-white">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">Administrator</p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="text-zinc-400 hover:text-[#FFDE1A] transition-colors p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        {/* Top Header Mobile */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 flex items-center px-4 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar menu"
            className="p-2 text-zinc-500 hover:text-black dark:hover:text-white"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <span className="ml-4 font-bold">Admin Panel</span>
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Menu */}
      <FloatingActionMenu options={floatingMenuOptions} />

      {/* Global Prompt Form Modal */}
      <PromptFormModal
        isOpen={isPromptModalOpen}
        onClose={closePromptForm}
        initialData={editingPrompt}
      />
    </div>
  )
}
