import { supabase, isSupabaseReady } from '../supabaseClient'
import type { LocationData } from '../utils/location'

export interface EmailSubscription {
  id: string
  email: string
  ip_address?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  timezone?: string | null
  created_at: string
  updated_at: string
}

/**
 * Subscribe an email address to the newsletter with location data
 */
export async function subscribeEmail(
  email: string,
  locationData?: LocationData
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Database is not configured' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email address' }
  }

  try {
    const subscriptionData: {
      email: string
      ip_address?: string
      country?: string
      region?: string
      city?: string
      timezone?: string
    } = {
      email: email.toLowerCase().trim(),
    }

    // Add location data if available
    if (locationData) {
      if (locationData.ip_address) subscriptionData.ip_address = locationData.ip_address
      if (locationData.country) subscriptionData.country = locationData.country
      if (locationData.region) subscriptionData.region = locationData.region
      if (locationData.city) subscriptionData.city = locationData.city
      if (locationData.timezone) subscriptionData.timezone = locationData.timezone
    }

    const { error } = await supabase
      .from('email_subscriptions')
      .insert([subscriptionData])

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === '23505') {
        return { success: false, error: 'This email is already subscribed' }
      }
      console.error('Error subscribing email:', error)
      return { success: false, error: 'Failed to subscribe. Please try again.' }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error subscribing email:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Fetch all email subscriptions (admin only)
 */
export async function fetchEmailSubscriptions(): Promise<EmailSubscription[]> {
  if (!isSupabaseReady()) {
    throw new Error('Database is not configured')
  }

  try {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email subscriptions:', error)
      throw error
    }

    return data || []
  } catch (err) {
    console.error('Unexpected error fetching subscriptions:', err)
    throw err
  }
}

/**
 * Delete an email subscription (admin only)
 */
export async function deleteEmailSubscription(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady()) {
    return { success: false, error: 'Database is not configured' }
  }

  if (!id || id.trim() === '') {
    return { success: false, error: 'Invalid subscription ID' }
  }

  try {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error deleting subscription:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      
      // Provide more specific error messages
      if (error.code === '42501') {
        return { success: false, error: 'Permission denied. You may not have admin access.' }
      }
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Subscription not found' }
      }
      
      return { success: false, error: `Failed to delete subscription: ${error.message}` }
    }

    // Check if anything was actually deleted
    if (!data || data.length === 0) {
      return { success: false, error: 'Subscription not found or already deleted' }
    }

    return { success: true }
  } catch (err) {
    console.error('Unexpected error deleting subscription:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

