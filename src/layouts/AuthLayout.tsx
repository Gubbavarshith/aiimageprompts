import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/use-theme'

export default function AuthLayout() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (location.pathname.includes('login')) {
      document.title = 'Login - Admin Panel'
    }
  }, [location])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300 relative">
      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 transition-all duration-200 shadow-sm hover:shadow-md"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>

      <div className="w-full max-w-[300px]">
        <Outlet />
      </div>
    </div>
  )
}
