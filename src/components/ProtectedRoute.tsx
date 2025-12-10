import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseReady()) {
        console.error('Supabase is not configured. Redirecting to maintenance.')
        navigate('/maintenance', {
          replace: true,
          state: { error: 'Supabase is not configured. Set environment variables.' },
        })
        return
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth check error:', error)
          navigate('/admin/login', { replace: true })
          return
        }

        if (!session?.user?.email) {
          navigate('/admin/login', { replace: true })
          return
        }

        // Check if user is admin
        if (!isAdminEmail(session.user.email)) {
          navigate('/admin/login', { 
            replace: true,
            state: { error: 'Access denied. Admin privileges required.' }
          })
          return
        }

        setIsAuthorized(true)
      } catch (err) {
        console.error('Error checking authentication:', err)
        navigate('/admin/login', { replace: true })
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        navigate('/admin/login', { replace: true })
      }
    })

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [navigate])

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

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

