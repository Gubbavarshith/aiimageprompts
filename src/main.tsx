import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from './components/theme-provider'
import { ToastProvider } from './contexts/ToastContext'
import App from './App'
import './index.css'

// Lazy load non-critical UI components
const Toaster = lazy(() => import('./components/ui/toaster').then(m => ({ default: m.Toaster })))

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
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
    )}
  </StrictMode>,
)
