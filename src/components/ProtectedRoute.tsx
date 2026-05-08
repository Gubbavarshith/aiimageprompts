import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import { isAdminEmail } from '@/lib/authHelpers'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let isMounted = true
    let subscription: { unsubscribe: () => void } | null = null

    const checkAuth = async () => {
      // Prevent unauthorized access during check
      if (!isMounted) return

      if (!isSupabaseReady()) {
        if (isMounted) {
          setIsAuthorized(false)
          setIsChecking(false)
        }
        console.error('Supabase is not configured. Redirecting to maintenance.')
        navigate('/maintenance', {
          replace: true,
          state: { error: 'Supabase is not configured. Set environment variables.', from: location.pathname },
        })
        return
      }

      try {
        // Double-check with getUser for more reliable auth state
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user?.email) {
          console.error('Auth check error:', userError)
          navigate('/admin/login', { 
            replace: true,
            state: { error: 'Please sign in to access this page.', from: location.pathname }
          })
          if (isMounted) {
            setIsAuthorized(false)
            setIsChecking(false)
          }
          return
        }

        // Verify admin status
        if (!isAdminEmail(user.email)) {
          console.warn('Unauthorized access attempt:', user.email)
          navigate('/admin/login', { 
            replace: true,
            state: { error: 'Access denied. Admin privileges required.', from: location.pathname }
          })
          if (isMounted) {
            setIsAuthorized(false)
            setIsChecking(false)
          }
          return
        }

        // Also check session for consistency
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user?.email || !isAdminEmail(session.user.email)) {
          navigate('/admin/login', { 
            replace: true,
            state: { error: 'Session expired. Please sign in again.', from: location.pathname }
          })
          if (isMounted) {
            setIsAuthorized(false)
            setIsChecking(false)
          }
          return
        }

        // All checks passed
        if (isMounted) {
          setIsAuthorized(true)
          setIsChecking(false)
        }
      } catch (err) {
        console.error('Error checking authentication:', err)
        navigate('/admin/login', { 
          replace: true,
          state: { error: 'Authentication error. Please try again.', from: location.pathname }
        })
        if (isMounted) {
          setIsAuthorized(false)
          setIsChecking(false)
        }
      }
    }

    checkAuth()

    // Listen for auth state changes and re-validate
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      // If session is lost or user is not admin, redirect immediately
      if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        setIsAuthorized(false)
        setIsChecking(false)
        navigate('/admin/login', { 
          replace: true,
          state: { error: 'Session expired. Please sign in again.', from: location.pathname }
        })
      } else {
        // Re-validate on auth state change
        await checkAuth()
      }
    })

    subscription = authSubscription

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [navigate, location.pathname])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authorized (prevents flash of content)
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

