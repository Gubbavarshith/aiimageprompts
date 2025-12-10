import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const navigate = useNavigate()
  const location = useLocation()
  const { isSignedIn } = useAuth()

  // Detect if we're on a Clerk sub-route (like verify-email-address)
  const isClerkSubRoute = location.pathname !== '/auth' && location.pathname.startsWith('/auth/')

  // If signed in and on base auth route (not sub-routes), redirect to home immediately
  useEffect(() => {
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
          <motion.div
            layout
            className="w-full flex justify-center"
          >
            {isClerkSubRoute ? (
              <SignUp
                routing="path"
                path="/auth"
                signInUrl="/auth"
                afterSignUpUrl="/"
              />
            ) : mode === 'sign-in' ? (
              <SignIn
                routing="path"
                path="/auth"
                signUpUrl="/auth"
                afterSignInUrl="/"
              />
            ) : (
              <SignUp
                routing="path"
                path="/auth"
                signInUrl="/auth"
                afterSignUpUrl="/"
              />
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
