import { supabase } from '@/lib/supabaseClient'
import { isSupabaseReady } from '@/lib/supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { invalidateCategoryCache } from './categories'

const TABLE_NAME = 'prompts'
const PROMPT_IMAGES_BUCKET = 'prompt-images'

function extractStoragePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const marker = `/storage/v1/object/public/${PROMPT_IMAGES_BUCKET}/`
    const index = url.indexOf(marker)
    if (index === -1) return null
    return url.substring(index + marker.length)
  } catch {
    return null
  }
}

export type PromptRecord = {
  id: string
  title: string
  prompt: string
  negative_prompt: string | null
  category: string
  tags: string[] | null
  preview_image_url: string | null
  status: string
  views: number
  user_id: string | null
  created_at: string
  updated_at: string
  rating_avg?: number | null
  rating_count?: number
}

export type PromptPayload = Omit<PromptRecord, 'id' | 'created_at' | 'updated_at'>

export type SubmitPromptPayload = Omit<PromptPayload, 'status' | 'views'> & {
  user_id: string
}

export type PromptChangePayload = RealtimePostgresChangesPayload<PromptRecord>

export async function fetchPrompts() {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompts:', error)
    throw new Error(`Failed to fetch prompts: ${error.message}`)
  }

  return (data || []) as PromptRecord[]
}

export async function fetchFeaturedPrompts(limit = 10) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('status', 'Published')
    .order('views', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured prompts:', error)
    throw new Error(`Failed to fetch featured prompts: ${error.message}`)
  }

  return (data || []) as PromptRecord[]
}

/**
 * Fetch prompts filtered by status
 * @param status - Status to filter by ('Published', 'Pending', 'Draft', 'Rejected', 'Review', or 'all')
 * @returns Array of prompts matching the status filter
 */
export async function fetchPromptsByStatus(status: 'Published' | 'Pending' | 'Draft' | 'Rejected' | 'Review' | 'all' = 'all') {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching prompts by status:', error)
    throw new Error(`Failed to fetch prompts: ${error.message}`)
  }

  return (data || []) as PromptRecord[]
}

/**
 * Fetch prompts that are not yet published (moderation queue)
 */
export async function fetchPromptsForReview() {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .neq('status', 'Published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompts for review:', error)
    throw new Error(`Failed to fetch prompts for review: ${error.message}`)
  }

  return (data || []) as PromptRecord[]
}

export async function createPrompt(payload: PromptPayload) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([payload])
    .select('*')
    .single()

  if (error) {
    console.error('Error creating prompt:', error)
    throw new Error(`Failed to create prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to create prompt: No data returned')
  }

  // Invalidate category cache when a new prompt is created (especially if published)
  if (payload.status === 'Published') {
    invalidateCategoryCache()
  }

  return data as PromptRecord
}

export async function updatePrompt(id: string, payload: PromptPayload) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating prompt:', error)
    throw new Error(`Failed to update prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to update prompt: No data returned')
  }

  // Invalidate category cache when prompt status changes to Published or category/tags change
  if (payload.status === 'Published' || payload.category || payload.tags) {
    invalidateCategoryCache()
  }

  return data as PromptRecord
}

export async function deletePrompt(id: string) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  // Fetch preview_image_url so we can clean up storage
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('id, preview_image_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error loading prompt before delete:', fetchError)
    throw new Error(`Failed to delete prompt: ${fetchError.message}`)
  }

  const { data, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).select('id').maybeSingle()
  if (error) {
    console.error('Error deleting prompt:', error)
    throw new Error(`Failed to delete prompt: ${error.message}`)
  }
  if (!data) {
    throw new Error('Delete failed: prompt not deleted (check permissions).')
  }

  // Best-effort image cleanup
  try {
    const path = extractStoragePathFromPublicUrl(existing?.preview_image_url)
    if (path) {
      const { error: removeError } = await supabase.storage
        .from(PROMPT_IMAGES_BUCKET)
        .remove([path])
      if (removeError) {
        console.warn('Failed to remove prompt image from storage:', removeError)
      }
    }
  } catch (cleanupError) {
    console.warn('Error during prompt image cleanup:', cleanupError)
  }
}

export async function deletePrompts(ids: string[]) {
  if (!ids || ids.length === 0) {
    throw new Error('No prompt IDs provided for deletion')
  }
  if (!isSupabaseReady()) throw new Error('Supabase not configured')

  // Load images for all prompts first
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('id, preview_image_url')
    .in('id', ids)

  if (fetchError) {
    console.error('Error loading prompts before bulk delete:', fetchError)
    throw new Error(`Failed to delete prompts: ${fetchError.message}`)
  }

  const { data, error } = await supabase.from(TABLE_NAME).delete().in('id', ids).select('id')
  if (error) {
    console.error('Error deleting prompts:', error)
    throw new Error(`Failed to delete prompts: ${error.message}`)
  }
  if (!data || data.length === 0) {
    throw new Error('Delete failed: no prompts deleted (check permissions).')
  }

  // Best-effort bulk image cleanup
  try {
    const paths = (existing || [])
      .map(row => extractStoragePathFromPublicUrl(row.preview_image_url as string | null))
      .filter((p): p is string => !!p)

    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage
        .from(PROMPT_IMAGES_BUCKET)
        .remove(paths)
      if (removeError) {
        console.warn('Failed to remove some prompt images from storage:', removeError)
      }
    }
  } catch (cleanupError) {
    console.warn('Error during bulk prompt image cleanup:', cleanupError)
  }
}

export async function submitPrompt(payload: SubmitPromptPayload) {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  // Validate that user_id is present (required for RLS policy)
  if (!payload.user_id || payload.user_id.trim() === '') {
    throw new Error('User ID is required to submit a prompt. Please ensure you are logged in.')
  }

  // Prepare the insert payload
  const insertPayload = {
    ...payload,
    status: 'Pending' as const, // User submissions start as Pending
    views: 0,
    user_id: payload.user_id, // Explicitly set user_id to ensure it's not undefined
  }

  // Enhanced logging for debugging RLS issues
  if (import.meta.env.DEV) {
    console.log('[submitPrompt] Attempting to insert prompt:', {
      title: insertPayload.title,
      category: insertPayload.category,
      user_id: insertPayload.user_id,
      status: insertPayload.status,
      hasPrompt: !!insertPayload.prompt,
      hasNegativePrompt: !!insertPayload.negative_prompt,
      tagsCount: insertPayload.tags?.length || 0,
      hasPreviewImage: !!insertPayload.preview_image_url,
    })
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([insertPayload])
    .select('*')
    .single()

  if (error) {
    // Enhanced error logging
    console.error('[submitPrompt] Error submitting prompt:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: error,
    })
    console.error('[submitPrompt] Payload that failed:', insertPayload)
    throw new Error(`Failed to submit prompt: ${error.message}`)
  }

  if (!data) {
    console.error('[submitPrompt] No data returned from insert, but no error occurred')
    throw new Error('Failed to submit prompt: No data returned')
  }

  if (import.meta.env.DEV) {
    console.log('[submitPrompt] Successfully inserted prompt:', {
      id: data.id,
      title: data.title,
      status: data.status,
    })
  }

  // Note: Don't invalidate cache for user submissions (status: Pending)
  // Cache will be invalidated when admin publishes the prompt

  return data as PromptRecord
}

export async function approvePrompt(id: string) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ status: 'Published', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error approving prompt:', error)
    throw new Error(`Failed to approve prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to approve prompt: No data returned')
  }

  return data as PromptRecord
}

export async function rejectPrompt(id: string) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ status: 'Rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error rejecting prompt:', error)
    throw new Error(`Failed to reject prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to reject prompt: No data returned')
  }

  return data as PromptRecord
}

export function subscribeToPromptChanges(handler: (payload: PromptChangePayload) => void) {
  const channel = supabase
    .channel('prompts-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      handler,
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}


