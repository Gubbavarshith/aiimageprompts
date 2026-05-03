import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateMetaTags } from '@/lib/seo'

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn } = useAuth()
  
  // Check if Clerk is properly configured
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const isClerkConfigured = clerkKey && clerkKey.length > 0 && clerkKey !== 'placeholder'

  // Detect if we're on a Clerk sub-route (like verify-email-address)
  const isClerkSubRoute = location.pathname !== '/auth' && location.pathname.startsWith('/auth/')

  // If signed in and on base auth route (not sub-routes), redirect to home immediately
  useEffect(() => {
    updateMetaTags({
      title: 'Sign In | AI Image Prompts',
      description: 'Sign in or create an account for AI Image Prompts.',
      canonical: '/auth',
      robots: 'noindex, follow',
      og: {
        title: 'Sign In | AI Image Prompts',
        description: 'Sign in or create an account for AI Image Prompts.',
        url: '/auth',
        image: '/og-image.png',
        type: 'website',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Sign In | AI Image Prompts',
        description: 'Sign in or create an account for AI Image Prompts.',
        image: '/og-image.png',
      },
    })

    if (isSignedIn && location.pathname === '/auth') {
      navigate('/', { replace: true })
    }
  }, [isSignedIn, location.pathname, navigate])

  // Don't show mode toggle on Clerk sub-routes (like email verification)
  const showModeToggle = !isClerkSubRoute

  // Handle mode toggle - navigate to base auth path, Clerk will handle showing the right component
  const handleModeChange = (newMode: 'sign-in' | 'sign-up') => {
    setMode(newMode)
    navigate('/auth', { replace: true })
  }

  // Sync mode with current path when on base /auth route
  useEffect(() => {
    if (location.pathname === '/auth') {
      // Default to sign-in when on base route
      setMode('sign-in')
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Premium Animated Aurora/Orb Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Purple Orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/40 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-float-wide" />
        {/* Blue Orb */}
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/40 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-float-wide animation-delay-2000" />
        {/* Pink/Orange Orb */}
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-600/40 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-float-wide animation-delay-4000" />

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

        {/* Noise Texture for Texture */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Glass Overlay */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Top Right Close Button */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/')}
          className="bg-white hover:bg-gray-100 text-black border-none rounded-full h-12 w-12 shadow-xl transition-all duration-300 hover:scale-110 hover:rotate-90 hover:shadow-2xl"
          aria-label="Close"
        >
          <X className="h-6 w-6 stroke-[3]" />
        </Button>
      </div>

      <main className="relative z-10 flex items-center justify-center min-h-screen w-full px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md"
        >


          {/* Mode Toggle - only show on main auth page */}
          {showModeToggle && (
            <div className="flex items-center gap-2 mb-8 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full w-fit mx-auto shadow-2xl">
              <button
                onClick={() => handleModeChange('sign-in')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'sign-in'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleModeChange('sign-up')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'sign-up'
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Clerk Components */}
          {!isClerkConfigured ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center"
            >
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Clerk Not Configured</h3>
              <p className="text-white/70 text-sm mb-4">
                Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file and restart the dev server
              </p>
              <Button onClick={() => navigate('/')} variant="outline" className="bg-white text-black hover:bg-gray-100">
                Go Home
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="w-full flex justify-center"
            >
              {isClerkSubRoute ? (
                <SignUp
                  routing="virtual"
                  signInUrl="/auth"
                  afterSignUpUrl="/"
                  appearance={{
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl",
                      headerTitle: "text-black dark:text-white",
                      headerSubtitle: "text-gray-600 dark:text-gray-400",
                      socialButtonsBlockButton: "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700",
                      formButtonPrimary: "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200",
                      formFieldInput: "bg-white dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-700",
                      footerActionLink: "text-black dark:text-white",
                    }
                  }}
                />
              ) : mode === 'sign-in' ? (
                <SignIn
                  routing="virtual"
                  signUpUrl="/auth"
                  afterSignInUrl="/"
                  appearance={{
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl",
                      headerTitle: "text-black dark:text-white",
                      headerSubtitle: "text-gray-600 dark:text-gray-400",
                      socialButtonsBlockButton: "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700",
                      formButtonPrimary: "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200",
                      formFieldInput: "bg-white dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-700",
                      footerActionLink: "text-black dark:text-white",
                    }
                  }}
                />
              ) : (
                <SignUp
                  routing="virtual"
                  signInUrl="/auth"
                  afterSignUpUrl="/"
                  appearance={{
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl",
                      headerTitle: "text-black dark:text-white",
                      headerSubtitle: "text-gray-600 dark:text-gray-400",
                      socialButtonsBlockButton: "bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-200 dark:border-gray-700",
                      formButtonPrimary: "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200",
                      formFieldInput: "bg-white dark:bg-gray-900 text-black dark:text-white border-gray-200 dark:border-gray-700",
                      footerActionLink: "text-black dark:text-white",
                    }
                  }}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
