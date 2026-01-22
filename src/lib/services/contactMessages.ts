import { supabase, isSupabaseReady } from '../supabaseClient'

export type ContactMessageStatus = 'new' | 'read' | 'archived' | 'replied'

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  ip_address?: string | null
  user_agent?: string | null
  status: ContactMessageStatus
  created_at: string
  updated_at: string
}

export interface CreateContactMessagePayload {
  name: string
  email: string
  message: string
  ip_address?: string
  user_agent?: string
}

/**
 * Create a new contact message
 */
export async function createContactMessage(
  payload: CreateContactMessagePayload
): Promise<{ success: boolean; error?: string; data?: ContactMessage }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Database is not configured' }
  }

  // Validate required fields
  const trimmedName = String(payload.name ?? '').trim()
  const trimmedEmail = String(payload.email ?? '').trim()
  const trimmedMessage = String(payload.message ?? '').trim()

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return { success: false, error: 'Missing required fields' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { success: false, error: 'Invalid email address' }
  }

  // Validate lengths
  if (trimmedName.length > 120) {
    return { success: false, error: 'Name is too long (max 120 characters)' }
  }
  if (trimmedEmail.length > 200) {
    return { success: false, error: 'Email is too long (max 200 characters)' }
  }
  if (trimmedMessage.length > 5000) {
    return { success: false, error: 'Message is too long (max 5000 characters)' }
  }

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([
        {
          name: trimmedName,
          email: trimmedEmail.toLowerCase().trim(),
          message: trimmedMessage,
          ip_address: payload.ip_address || null,
          user_agent: payload.user_agent || null,
          status: 'new',
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating contact message:', error)
      return { success: false, error: 'Failed to send message. Please try again.' }
    }

    return { success: true, data: data as ContactMessage }
  } catch (err) {
    console.error('Unexpected error creating contact message:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Fetch all contact messages (admin only)
 */
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseReady()) {
    throw new Error('Database is not configured')
  }

  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contact messages:', error)
      throw error
    }

    return (data || []) as ContactMessage[]
  } catch (err) {
    console.error('Unexpected error fetching contact messages:', err)
    throw err
  }
}

/**
 * Update contact message status (admin only)
 */
export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Database is not configured' }
  }

  if (!id || id.trim() === '') {
    return { success: false, error: 'Invalid message ID' }
  }

  const validStatuses: ContactMessageStatus[] = ['new', 'read', 'archived', 'replied']
  if (!validStatuses.includes(status)) {
    return { success: false, error: 'Invalid status' }
  }

  try {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating contact message status:', error)
      if (error.code === '42501') {
        return { success: false, error: 'Permission denied. You may not have admin access.' }
      }
      return { success: false, error: `Failed to update message: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error updating contact message:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a contact message (admin only)
 */
export async function deleteContactMessage(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Database is not configured' }
  }

  if (!id || id.trim() === '') {
    return { success: false, error: 'Invalid message ID' }
  }

  try {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting contact message:', error)
      if (error.code === '42501') {
        return { success: false, error: 'Permission denied. You may not have admin access.' }
      }
      return { success: false, error: `Failed to delete message: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting contact message:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get count of unread messages (admin only)
 */
export async function getUnreadContactMessagesCount(): Promise<number> {
  if (!isSupabaseReady()) {
    return 0
  }

  try {
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')

    if (error) {
      console.error('Error counting unread messages:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('Unexpected error counting unread messages:', err)
    return 0
  }
}
