import { supabase } from './supabaseClient'

const adminEmailList = (import.meta.env.VITE_ADMIN_EMAIL_WHITELIST || 'admin@example.com')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false
  return adminEmailList.includes(email.trim().toLowerCase())
}

export const getAdminEmailWhitelist = () => [...adminEmailList]

/**
 * Check if the current Supabase user is an admin
 * @returns Promise<boolean> - true if user is authenticated and is admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false
    return isAdminEmail(user.email)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get current Supabase user email
 * @returns Promise<string | null> - user email or null if not authenticated
 */
export const getCurrentUserEmail = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.email || null
  } catch (error) {
    console.error('Error getting user email:', error)
    return null
  }
}

// Deprecated: Mock Auth Helpers - kept for backward compatibility during migration
// These will be removed once all components use Supabase Auth
const MOCK_SESSION_KEY = 'ai_prompts_mock_session'

/** @deprecated Use Supabase Auth instead */
export const setMockSession = (email: string) => {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify({ email, timestamp: Date.now() }))
}

/** @deprecated Use Supabase Auth instead */
export const getMockSession = () => {
  const sessionStr = localStorage.getItem(MOCK_SESSION_KEY)
  if (!sessionStr) return null
  try {
    return JSON.parse(sessionStr) as { email: string; timestamp: number }
  } catch {
    return null
  }
}

/** @deprecated Use Supabase Auth instead */
export const clearMockSession = () => {
  localStorage.removeItem(MOCK_SESSION_KEY)
}

/** @deprecated Use Supabase Auth instead */
export const checkMockCredentials = (email: string, _password: string) => {
  // In a real app, we'd check the password.
  // For this mock "pure frontend" mode, we just check if the email is valid format.
  // We allow any password.
  return email.includes('@') && email.includes('.')
}


