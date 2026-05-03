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

// Validate that we have a PUBLISHABLE key, not a SECRET key
if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY.trim() === '') {
  console.error('⚠️ Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file and restart the dev server.')
} else if (PUBLISHABLE_KEY.startsWith('sk_')) {
  console.error('❌ CRITICAL ERROR: You are using a SECRET key (sk_...) instead of a PUBLISHABLE key (pk_...).')
  console.error('   Secret keys should NEVER be used in frontend code!')
  console.error('   Please get your PUBLISHABLE key from Clerk Dashboard > API Keys > Publishable Key')
  console.error('   It should start with "pk_test_" or "pk_live_"')
  // Don't render the app with a secret key - it's a security risk
  throw new Error('Invalid Clerk key: Secret keys cannot be used in frontend. Use a publishable key (pk_...) instead.')
} else if (!PUBLISHABLE_KEY.startsWith('pk_')) {
  console.warn('⚠️ Warning: Clerk key format looks incorrect. Publishable keys should start with "pk_test_" or "pk_live_"')
} else {
  console.log('✅ Clerk Publishable Key loaded:', PUBLISHABLE_KEY.substring(0, 20) + '...')
}

// Don't render if we have a secret key (security risk)
if (PUBLISHABLE_KEY && PUBLISHABLE_KEY.startsWith('sk_')) {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="color: #ef4444; margin-bottom: 20px;">❌ Critical Security Error</h1>
          <p style="margin-bottom: 16px; line-height: 1.6;">
            You are using a <strong>SECRET key</strong> (sk_...) instead of a <strong>PUBLISHABLE key</strong> (pk_...).
          </p>
          <p style="margin-bottom: 16px; line-height: 1.6; color: #fbbf24;">
            <strong>Secret keys should NEVER be used in frontend code!</strong>
          </p>
          <p style="margin-bottom: 24px; line-height: 1.6;">
            Please update your <code style="background: #1f2937; padding: 4px 8px; border-radius: 4px;">.env.local</code> file with your PUBLISHABLE key from Clerk Dashboard.
          </p>
          <p style="color: #9ca3af; font-size: 14px;">
            Get it from: Clerk Dashboard > API Keys > Publishable Key (starts with pk_test_ or pk_live_)
          </p>
        </div>
      </div>
    `
  }
  throw new Error('Invalid Clerk key: Secret keys cannot be used in frontend')
}

// Always render ClerkProvider to prevent "useAuth outside ClerkProvider" errors
// If key is missing, ClerkProvider will handle it gracefully
createRoot(document.getElementById('root')!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY || ''}
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
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
  </ClerkProvider>,
)
