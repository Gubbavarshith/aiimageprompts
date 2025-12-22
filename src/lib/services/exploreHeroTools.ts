import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

const TABLE_NAME = 'explore_hero_tools'
// Dedicated bucket for explore hero logos
const STORAGE_BUCKET = 'explore-hero-tools'
const HERO_FOLDER = 'logos'

export type ExploreHeroTool = {
  id: string
  name: string
  slug: string | null
  logo_url: string
  affiliate_link: string
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CreateExploreHeroToolPayload = {
  name: string
  logo_url: string
  affiliate_link: string
  color?: string
  sort_order?: number
  is_active?: boolean
}

export type UpdateExploreHeroToolPayload = Partial<CreateExploreHeroToolPayload> & {
  id: string
}

export async function fetchActiveExploreHeroTools(): Promise<ExploreHeroTool[]> {
  if (!isSupabaseReady()) {
    return []
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching active explore hero tools:', error)
    return []
  }

  return (data || []) as ExploreHeroTool[]
}

export async function fetchAllExploreHeroTools(): Promise<ExploreHeroTool[]> {
  if (!isSupabaseReady()) {
    return []
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching explore hero tools:', error)
    throw new Error('Failed to fetch hero tools')
  }

  return (data || []) as ExploreHeroTool[]
}

export async function createExploreHeroTool(payload: CreateExploreHeroToolPayload): Promise<ExploreHeroTool> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const insertPayload = {
    ...payload,
    color: payload.color || '#000000',
    sort_order: payload.sort_order ?? 0,
    is_active: payload.is_active ?? true,
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([insertPayload])
    .select('*')
    .single()

  if (error) {
    console.error('Error creating explore hero tool:', error)
    throw new Error('Failed to create hero card')
  }

  if (!data) {
    throw new Error('Failed to create hero card: no data returned')
  }

  return data as ExploreHeroTool
}

export async function updateExploreHeroTool(payload: UpdateExploreHeroToolPayload): Promise<ExploreHeroTool> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const { id, ...updates } = payload

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating explore hero tool:', error)
    throw new Error('Failed to update hero card')
  }

  if (!data) {
    throw new Error('Failed to update hero card: no data returned')
  }

  return data as ExploreHeroTool
}

export async function deleteExploreHeroTool(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  // Fetch logo URL first so we can clean up storage if applicable
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('id, logo_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error loading hero tool before delete:', fetchError)
    throw new Error('Failed to delete hero card')
  }

  const { error: deleteError } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (deleteError) {
    console.error('Error deleting explore hero tool:', deleteError)
    throw new Error('Failed to delete hero card')
  }

  // Best-effort cleanup of uploaded logo if it lives in our bucket
  try {
    const logoUrl = existing?.logo_url
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    if (logoUrl && logoUrl.includes(prefix)) {
      const path = logoUrl.split(prefix)[1]
      if (path) {
        const { error: removeError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([path])
        if (removeError) {
          console.warn('Failed to remove hero logo from storage:', removeError)
        }
      }
    }
  } catch (cleanupError) {
    console.warn('Error during hero logo cleanup:', cleanupError)
  }
}

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * Uses the existing public `prompt-images` bucket under the `explore-hero` folder.
 */
export async function uploadExploreHeroImage(file: File): Promise<string> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const fileExt = file.name.split('.').pop() || 'png'
  const fileName = `${crypto.randomUUID?.() || Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = `${HERO_FOLDER}/${fileName}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || `image/${fileExt}`,
    })

  if (uploadError) {
    console.error('Error uploading explore hero image:', {
      message: uploadError.message,
      statusCode: (uploadError as any).statusCode,
      name: uploadError.name,
    })
    throw new Error(uploadError.message || 'Failed to upload image')
  }

  if (!uploadData?.path) {
    throw new Error('Upload succeeded but no file path returned')
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(uploadData.path)

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to get public URL for uploaded image')
  }

  return publicUrlData.publicUrl
}


