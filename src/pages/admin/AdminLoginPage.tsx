import { useEffect, useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { isAdminEmail } from '@/lib/authHelpers'
import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const supabaseReady = isSupabaseReady()

  // Get the return URL from location state, or default to admin dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard'

  // Check if already authenticated via Supabase
  useEffect(() => {
    document.title = 'Admin Login | AI Image Prompts'

    const checkSession = async () => {
      try {
        if (!supabaseReady) {
          // Surface early when env vars are missing so UI can show the warning.
          setIsCheckingSession(false)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session check error:', error)
          setIsCheckingSession(false)
          return
        }

        if (session?.user?.email) {
          const userEmail = session.user.email.toLowerCase()
          if (isAdminEmail(userEmail)) {
            navigate(from, { replace: true })
            return
          }
        }
        setIsCheckingSession(false)
      } catch (err) {
        console.error('Error checking session:', err)
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [navigate, from])

  /* New Features Implementation */
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isCapsLockOn, setIsCapsLockOn] = useState(false)

  // Caps Lock Detection
  const checkCapsLock = (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.getModifierState('CapsLock')) {
      setIsCapsLockOn(true)
    } else {
      setIsCapsLockOn(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    if (!email || !password) {
      toast.error("Please enter both email and password")
      setIsLoading(false)
      return
    }

    try {
      if (!supabaseReady) {
        toast.error("Supabase is not configured. Please set VITE_SUPABASE_URL and key.")
        setIsLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (authError) {
        toast.error(authError.message || "Authentication Failed")
        setIsLoading(false)
        return
      }

      if (!data.user?.email) {
        toast.error("User data missing.")
        setIsLoading(false)
        return
      }

      const userEmail = data.user.email.toLowerCase()

      if (!isAdminEmail(userEmail)) {
        await supabase.auth.signOut()
        toast.error("Access denied. This account is not authorized.")
        setIsLoading(false)
        return
      }

      toast.success("Welcome back, Admin!")
      navigate(from, { replace: true })
    } catch (err) {
      console.error('Admin login error:', err)
      toast.error("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    } finally {
      // Safety net in case navigation does not occur due to routing issues.
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Admin Portal Login</CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Enter your credentials to access the admin dashboard
        </p>
        {!supabaseReady && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 text-center">
            Supabase is not configured. Set <code className="bg-red-100 px-1 rounded">VITE_SUPABASE_URL</code> and
            <code className="bg-red-100 px-1 rounded ml-1">VITE_SUPABASE_PUBLISHABLE_KEY</code> (or
            <code className="bg-red-100 px-1 rounded ml-1">VITE_SUPABASE_ANON_KEY</code>) plus
            <code className="bg-red-100 px-1 rounded ml-1">VITE_ADMIN_EMAIL_WHITELIST</code>, then restart the dev server.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={checkCapsLock}
                onKeyUp={checkCapsLock}
                onClick={checkCapsLock}
                className="pl-9 pr-9"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {isCapsLockOn && (
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Caps Lock is on
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !supabaseReady}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4 mt-2">
        <p className="text-xs text-muted-foreground text-center">
          Authorized Personnel Only
        </p>
      </CardFooter>
    </Card>
  )
}
