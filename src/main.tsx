import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from './components/theme-provider'
import { ToastProvider } from './contexts/ToastContext'
import App from './App'
import './index.css'

// Lazy load non-critical UI components
const Toaster = lazy(() => import('./components/ui/toaster').then(m => ({ default: m.Toaster })))

// Handle React DevTools compatibility issues with React 19
// This is a known issue where React DevTools browser extension tries to attach to React 19
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  // Suppress React DevTools 'Activity' property errors in production
  const originalError = window.onerror
  window.onerror = (message, source, lineno, colno, error) => {
    // Ignore React DevTools 'Activity' property errors (React 19 compatibility issue)
    if (
      typeof message === 'string' &&
      message.includes("Cannot set properties of undefined (setting 'Activity')")
    ) {
      return true // Suppress the error
    }
    // Call original error handler for other errors
    if (originalError) {
      return originalError(message, source, lineno, colno, error)
    }
    return false
  }

  // Also catch unhandled promise rejections related to React DevTools
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    if (
      reason &&
      typeof reason === 'object' &&
      reason.message &&
      typeof reason.message === 'string' &&
      reason.message.includes('Activity')
    ) {
      event.preventDefault()
    }
  }, { passive: true })
}

// Defer analytics until after interaction
if (typeof window !== 'undefined') {
  const loadAnalytics = () => {
    import('@vercel/analytics/react')
    import('@vercel/speed-insights/react')
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loadAnalytics(), { timeout: 3000 })
  } else {
    setTimeout(loadAnalytics, 2000)
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file')
}

// Safely initialize React
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  PUBLISHABLE_KEY ? (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider defaultTheme="dark" storageKey="ai-prompts-theme">
        <ToastProvider>
          <BrowserRouter>
            <App />
            <Suspense fallback={null}>
              <Toaster />
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ClerkProvider>
  ) : (
    <ThemeProvider defaultTheme="dark" storageKey="ai-prompts-theme">
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  ),
)
