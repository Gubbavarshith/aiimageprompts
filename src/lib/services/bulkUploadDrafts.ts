import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

export type BulkUploadDraft = {
  id: string
  data: any
  normalized: any | null
  validation_errors: string[]
  image_ratio: string
  is_detecting_ratio: boolean
  created_at: string
  updated_at: string
}

export type BulkUploadDraftPayload = {
  data: any
  normalized?: any | null
  validation_errors?: string[]
  image_ratio?: string
  is_detecting_ratio?: boolean
}

/**
 * Save bulk upload drafts to temporary table
 */
export async function saveBulkUploadDrafts(drafts: BulkUploadDraftPayload[]): Promise<void> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  if (!drafts || drafts.length === 0) {
    return
  }

  // First, clear existing drafts
  await clearBulkUploadDrafts()

  // Then insert new drafts
  const payloads = drafts.map(draft => ({
    data: draft.data,
    normalized: draft.normalized || null,
    validation_errors: draft.validation_errors || [],
    image_ratio: draft.image_ratio || '4:3',
    is_detecting_ratio: draft.is_detecting_ratio || false,
  }))

  const { error } = await supabase
    .from('bulk_upload_drafts')
    .insert(payloads)

  if (error) {
    throw new Error(`Failed to save drafts: ${error.message}`)
  }
}

/**
 * Load bulk upload drafts from temporary table
 */
export async function loadBulkUploadDrafts(): Promise<BulkUploadDraft[]> {
  if (!isSupabaseReady()) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('bulk_upload_drafts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading drafts:', error)
      return []
    }

    return (data || []) as BulkUploadDraft[]
  } catch (err) {
    console.error('Error loading drafts:', err)
    return []
  }
}

/**
 * Clear all bulk upload drafts
 */
export async function clearBulkUploadDrafts(): Promise<void> {
  if (!isSupabaseReady()) {
    return
  }

  try {
    const { error } = await supabase
      .from('bulk_upload_drafts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (error) {
      throw new Error(`Failed to clear drafts: ${error.message}`)
    }
  } catch (err) {
    console.error('Error clearing drafts:', err)
    throw err
  }
}

/**
 * Delete specific draft by ID
 */
export async function deleteBulkUploadDraft(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    return
  }

  const { error } = await supabase
    .from('bulk_upload_drafts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete draft: ${error.message}`)
  }
}

