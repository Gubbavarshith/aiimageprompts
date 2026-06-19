import { supabase, isSupabaseReady } from '../supabaseClient'

export type ContactMessageStatus = 'new' | 'read' | 'archived' | 'replied'

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  ip_address?: string | null
  user_agent?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  timezone?: string | null
  status: ContactMessageStatus
  created_at: string
  updated_at: string
}

export interface CreateContactMessagePayload {
  name: string
  email: string
  subject?: string
  message: string
  ip_address?: string
  user_agent?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
}

/**
 * RFC 5321-aligned email regex.
 * Accepts: personal (user@gmail.com), company (first.last@corp.co.in),
 *          subdomains (user@mail.company.org), plus-addressing (user+tag@domain.com),
 *          country-code TLDs, new TLDs (.io, .app, .dev …)
 * Rejects: missing TLD, spaces, double-@, missing local-part.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

/**
 * Create a new contact message (public – no auth required).
 */
export async function createContactMessage(
  payload: CreateContactMessagePayload
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Service is temporarily unavailable. Please email us at team@aiimageprompts.xyz' }
  }

  // ── Sanitise & validate ────────────────────────────────────────────────────
  const trimmedName    = String(payload.name    ?? '').trim()
  const trimmedEmail   = String(payload.email   ?? '').trim().toLowerCase()
  const trimmedSubject = String(payload.subject ?? '').trim()
  const trimmedMessage = String(payload.message ?? '').trim()

  if (!trimmedName)    return { success: false, error: 'Name is required.' }
  if (!trimmedEmail)   return { success: false, error: 'Email address is required.' }
  if (!trimmedMessage) return { success: false, error: 'Message is required.' }

  if (!isValidEmail(trimmedEmail)) {
    return {
      success: false,
      error:
        'Please enter a valid email address ' +
        '(e.g. you@gmail.com or you@company.co.in).',
    }
  }

  if (trimmedName.length > 120)    return { success: false, error: 'Name is too long (max 120 characters).' }
  if (trimmedEmail.length > 200)   return { success: false, error: 'Email is too long (max 200 characters).' }
  if (trimmedMessage.length > 2000) return { success: false, error: 'Message is too long (max 2000 characters).' }

  // ── Insert ─────────────────────────────────────────────────────────────────
  // We skip .select() to avoid needing a SELECT RLS policy for anon users.
  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name:       trimmedName,
          email:      trimmedEmail,
          subject:    trimmedSubject || null,
          message:    trimmedMessage,
          ip_address: payload.ip_address  || null,
          user_agent: payload.user_agent  || null,
          country:    payload.country     || null,
          region:     payload.region      || null,
          city:       payload.city        || null,
          timezone:   payload.timezone    || null,
          status:     'new',
        },
      ])

    if (error) {
      console.error('[contact] insert error:', error)

      if (error.code === '42501' || error.message?.includes('policy')) {
        return { success: false, error: 'Permission denied. Please email us at team@aiimageprompts.xyz' }
      }
      if (error.code === '23514') {
        // CHECK constraint violation — email format rejected at DB level
        return { success: false, error: 'The email address format is not accepted. Please check and try again.' }
      }
      return {
        success: false,
        error: `Could not send message (${error.code ?? error.message}). Please try again or email us directly.`,
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[contact] unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please email us at team@aiimageprompts.xyz' }
  }
}

/**
 * Fetch all contact messages – admin only (authenticated role).
 */
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseReady()) throw new Error('Database is not configured')

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[contact] fetch error:', error)
    throw error
  }

  return (data ?? []) as ContactMessage[]
}

/**
 * Update message status – admin only.
 */
export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) return { success: false, error: 'Database is not configured' }
  if (!id?.trim())       return { success: false, error: 'Invalid message ID' }

  const valid: ContactMessageStatus[] = ['new', 'read', 'archived', 'replied']
  if (!valid.includes(status)) return { success: false, error: 'Invalid status' }

  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('[contact] status update error:', error)
    if (error.code === '42501') return { success: false, error: 'Permission denied.' }
    return { success: false, error: `Failed to update: ${error.message}` }
  }
  return { success: true }
}

/**
 * Delete a message – admin only.
 */
export async function deleteContactMessage(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) return { success: false, error: 'Database is not configured' }
  if (!id?.trim())       return { success: false, error: 'Invalid message ID' }

  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[contact] delete error:', error)
    if (error.code === '42501') return { success: false, error: 'Permission denied.' }
    return { success: false, error: `Failed to delete: ${error.message}` }
  }
  return { success: true }
}

/**
 * Count unread messages for the admin sidebar badge.
 */
export async function getUnreadContactMessagesCount(): Promise<number> {
  if (!isSupabaseReady()) return 0

  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) { console.error('[contact] count error:', error); return 0 }
  return count ?? 0
}
