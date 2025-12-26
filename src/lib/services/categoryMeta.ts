import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

export type CategoryMeta = {
  id: string
  category_name: string
  icon: string | null
  accent_color: string | null
  description: string | null
  is_featured: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type CategoryMetaPayload = {
  category_name: string
  icon?: string | null
  accent_color?: string | null
  description?: string | null
  is_featured?: boolean
  display_order?: number
}

export type TagAlias = {
  id: string
  alias: string
  canonical_tag: string
  created_at: string
}

/**
 * Fetch category meta for a specific category
 */
export async function fetchCategoryMeta(categoryName: string): Promise<CategoryMeta | null> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { data, error } = await supabase
      .from('category_meta')
      .select('*')
      .eq('category_name', categoryName)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }
    
    return data as CategoryMeta
  } catch (error) {
    console.error('Error fetching category meta:', error)
    throw new Error(`Failed to fetch category meta: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Fetch all category meta
 */
export async function fetchAllCategoryMeta(): Promise<CategoryMeta[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { data, error } = await supabase
      .from('category_meta')
      .select('*')
      .order('display_order', { ascending: true })
      .order('category_name', { ascending: true })
    
    if (error) throw error
    return (data || []) as CategoryMeta[]
  } catch (error) {
    console.error('Error fetching all category meta:', error)
    throw new Error(`Failed to fetch category meta: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create or update category meta
 */
export async function upsertCategoryMeta(payload: CategoryMetaPayload): Promise<CategoryMeta> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const upsertData = {
    category_name: payload.category_name,
    icon: payload.icon || null,
    accent_color: payload.accent_color || null,
    description: payload.description || null,
    is_featured: payload.is_featured ?? false,
    display_order: payload.display_order ?? 0,
    updated_at: new Date().toISOString(),
  }
  
  try {
    const { data, error } = await supabase
      .from('category_meta')
      .upsert(upsertData, {
        onConflict: 'category_name',
      })
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Failed to upsert category meta: No data returned')
    
    return data as CategoryMeta
  } catch (error) {
    console.error('Error upserting category meta:', error)
    throw new Error(`Failed to upsert category meta: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete category meta
 */
export async function deleteCategoryMeta(categoryName: string): Promise<void> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { error } = await supabase
      .from('category_meta')
      .delete()
      .eq('category_name', categoryName)
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting category meta:', error)
    throw new Error(`Failed to delete category meta: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Fetch all tag aliases
 */
export async function fetchTagAliases(): Promise<TagAlias[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { data, error } = await supabase
      .from('tag_aliases')
      .select('*')
      .order('canonical_tag', { ascending: true })
      .order('alias', { ascending: true })
    
    if (error) throw error
    return (data || []) as TagAlias[]
  } catch (error) {
    console.error('Error fetching tag aliases:', error)
    throw new Error(`Failed to fetch tag aliases: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Resolve a tag alias to its canonical tag
 * Returns the canonical tag if alias exists, otherwise returns the original tag
 */
export async function resolveCanonicalTag(tag: string): Promise<string> {
  if (!isSupabaseReady()) return tag.trim().toLowerCase()
  
  const normalizedTag = tag.trim().toLowerCase()
  
  try {
    const { data, error } = await supabase
      .from('tag_aliases')
      .select('canonical_tag')
      .eq('alias', normalizedTag)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return normalizedTag
      }
      // On error, return original normalized tag
      console.warn('Error resolving canonical tag:', error)
      return normalizedTag
    }
    
    return data?.canonical_tag || normalizedTag
  } catch (error) {
    console.error('Error resolving canonical tag:', error)
    // On error, return original normalized tag
    return normalizedTag
  }
}

/**
 * Create a tag alias mapping
 */
export async function createTagAlias(alias: string, canonicalTag: string): Promise<TagAlias> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { data, error } = await supabase
      .from('tag_aliases')
      .insert({
        alias: alias.trim().toLowerCase(),
        canonical_tag: canonicalTag.trim().toLowerCase(),
      })
      .select()
      .single()
    
    if (error) throw error
    if (!data) throw new Error('Failed to create tag alias: No data returned')
    
    return data as TagAlias
  } catch (error) {
    console.error('Error creating tag alias:', error)
    throw new Error(`Failed to create tag alias: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete a tag alias
 */
export async function deleteTagAlias(alias: string): Promise<void> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  try {
    const { error } = await supabase
      .from('tag_aliases')
      .delete()
      .eq('alias', alias.trim().toLowerCase())
    
    if (error) throw error
  } catch (error) {
    console.error('Error deleting tag alias:', error)
    throw new Error(`Failed to delete tag alias: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Merge tags: replace sourceTag with targetTag in all prompts
 * This updates the tags array in the prompts table
 */
export async function mergeTags(sourceTag: string, targetTag: string): Promise<number> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const normalizedSource = sourceTag.trim().toLowerCase()
  const normalizedTarget = targetTag.trim().toLowerCase()
  
  if (normalizedSource === normalizedTarget) {
    throw new Error('Source and target tags cannot be the same')
  }
  
  try {
    // Fetch all prompts that contain the source tag
    const { data: prompts, error: fetchError } = await supabase
      .from('prompts')
      .select('id, tags')
      .contains('tags', [normalizedSource])
    
    if (fetchError) throw fetchError
    
    if (!prompts || prompts.length === 0) {
      return 0
    }
    
    // Update each prompt's tags array
    let updatedCount = 0
    for (const prompt of prompts) {
      if (!prompt.tags || !Array.isArray(prompt.tags)) continue
      
      const updatedTags = prompt.tags.map((tag: string) => 
        tag.toLowerCase() === normalizedSource ? normalizedTarget : tag
      )
      // Remove duplicates
      const uniqueTags = Array.from(new Set(updatedTags))
      
      const { error: updateError } = await supabase
        .from('prompts')
        .update({ tags: uniqueTags })
        .eq('id', prompt.id)
      
      if (updateError) {
        console.error(`Error updating prompt ${prompt.id}:`, updateError)
        continue
      }
      
      updatedCount++
    }
    
    // Also create an alias mapping for future reference
    try {
      await createTagAlias(normalizedSource, normalizedTarget)
    } catch (aliasError) {
      // If alias already exists, that's fine - continue
      console.warn('Could not create alias mapping (may already exist):', aliasError)
    }
    
    return updatedCount
  } catch (error) {
    console.error('Error merging tags:', error)
    throw new Error(`Failed to merge tags: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

