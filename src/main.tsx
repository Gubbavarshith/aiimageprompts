import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { ThemeProvider } from './components/theme-provider'
import { ToastProvider } from './contexts/ToastContext'
import { Toaster } from './components/ui/toaster'
import App from './App'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your .env file')
  // Don't throw - show a helpful error message instead
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; padding: 20px;">
      <div style="text-align: center; max-width: 500px;">
        <h1 style="font-size: 24px; margin-bottom: 16px; color: #ef4444;">Configuration Error</h1>
        <p style="color: #64748b; margin-bottom: 8px;">Missing Clerk Publishable Key</p>
        <p style="color: #64748b; font-size: 14px;">Please set <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">VITE_CLERK_PUBLISHABLE_KEY</code> in your <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">.env</code> file</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px;">Check the browser console for more details.</p>
      </div>
    </div>
  `
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ThemeProvider defaultTheme="dark" storageKey="ai-prompts-theme">
        <ToastProvider>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ClerkProvider>
  </StrictMode>,
)
