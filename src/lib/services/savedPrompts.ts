import { supabase } from '@/lib/supabaseClient'
import { isSupabaseReady } from '@/lib/supabaseClient'
import type { PromptRecord } from './prompts'

const TABLE_NAME = 'saved_prompts'

export type SavedPromptRecord = {
  id: string
  user_id: string
  prompt_id: string
  created_at: string
  updated_at: string
}

export type SavedPromptWithDetails = SavedPromptRecord & {
  prompts: PromptRecord
}

/**
 * Save a prompt for a user
 * @param userId - Clerk user ID
 * @param promptId - Prompt ID to save
 */
export async function savePrompt(userId: string, promptId: string): Promise<SavedPromptRecord> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  if (!userId || !promptId) {
    throw new Error('User ID and Prompt ID are required')
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([{ user_id: userId, prompt_id: promptId }])
    .select('*')
    .single()

  if (error) {
    // Handle duplicate save gracefully
    if (error.code === '23505') {
      // Unique constraint violation - prompt already saved
      // Fetch the existing record
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
        .single()
      
      if (existing) {
        return existing as SavedPromptRecord
      }
    }
    console.error('Error saving prompt:', error)
    throw new Error(`Failed to save prompt: ${error.message}`)
  }

  if (!data) {
    throw new Error('Failed to save prompt: No data returned')
  }

  return data as SavedPromptRecord
}

/**
 * Unsave a prompt for a user
 * @param userId - Clerk user ID
 * @param promptId - Prompt ID to unsave
 */
export async function unsavePrompt(userId: string, promptId: string): Promise<void> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  if (!userId || !promptId) {
    throw new Error('User ID and Prompt ID are required')
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('user_id', userId)
    .eq('prompt_id', promptId)

  if (error) {
    console.error('Error unsaving prompt:', error)
    throw new Error(`Failed to unsave prompt: ${error.message}`)
  }
}

/**
 * Check if a prompt is saved by a user
 * @param userId - Clerk user ID
 * @param promptId - Prompt ID to check
 */
export async function isPromptSaved(userId: string, promptId: string): Promise<boolean> {
  if (!isSupabaseReady()) return false
  if (!userId || !promptId) return false

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('user_id', userId)
    .eq('prompt_id', promptId)
    .maybeSingle()

  if (error) {
    console.error('Error checking if prompt is saved:', error)
    return false
  }

  return !!data
}

/**
 * Get all saved prompt IDs for a user
 * @param userId - Clerk user ID
 */
export async function getSavedPromptIds(userId: string): Promise<string[]> {
  if (!isSupabaseReady()) return []
  if (!userId) return []

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('prompt_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching saved prompt IDs:', error)
    return []
  }

  return (data || []).map(item => item.prompt_id)
}

/**
 * Get all saved prompts with full prompt details for a user
 * @param userId - Clerk user ID
 */
export async function getSavedPrompts(userId: string): Promise<SavedPromptWithDetails[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  if (!userId) {
    throw new Error('User ID is required')
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      *,
      prompts (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved prompts:', error)
    throw new Error(`Failed to fetch saved prompts: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Transform the data to match our type
  // Handle case where prompts might be an array or single object
  return data.map(item => {
    const prompt = Array.isArray(item.prompts) 
      ? item.prompts[0] 
      : item.prompts
    
    if (!prompt) {
      console.warn('Saved prompt missing prompt data:', item)
      return null
    }

    return {
      ...item,
      prompts: prompt as PromptRecord
    }
  }).filter(Boolean) as SavedPromptWithDetails[]
}

/**
 * Get saved prompts count for a user
 * @param userId - Clerk user ID
 */
export async function getSavedPromptsCount(userId: string): Promise<number> {
  if (!isSupabaseReady()) return 0
  if (!userId) return 0

  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting saved prompts:', error)
    return 0
  }

  return count || 0
}

