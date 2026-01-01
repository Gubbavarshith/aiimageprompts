import { supabase } from '@/lib/supabaseClient'
import { isSupabaseReady } from '@/lib/supabaseClient'
import type { PromptPayload } from './prompts'
import { invalidateCategoryCache, fetchUniqueCategories } from './categories'
import { upsertCategoryMeta } from './categoryMeta'

export type BulkUploadResult = {
  success: boolean
  index: number
  title: string
  error?: string
}

/**
 * Create multiple prompts in bulk
 * @param prompts - Array of PromptPayload objects
 * @returns Array of results indicating success/failure for each prompt
 */
export async function bulkCreatePrompts(prompts: PromptPayload[]): Promise<BulkUploadResult[]> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  if (!prompts || prompts.length === 0) {
    return []
  }

  // Get existing categories to identify new ones
  const existingCategories = new Set(await fetchUniqueCategories())
  
  // Collect unique new categories from prompts
  const newCategories = new Set<string>()
  prompts.forEach(prompt => {
    if (prompt.category && !existingCategories.has(prompt.category)) {
      newCategories.add(prompt.category)
    }
  })

  // Create category_meta entries for new categories (optional metadata)
  if (newCategories.size > 0) {
    try {
      await Promise.allSettled(
        Array.from(newCategories).map(categoryName =>
          upsertCategoryMeta({
            category_name: categoryName,
            is_featured: false,
            display_order: 0,
          }).catch(err => {
            // Log but don't fail - category_meta is optional
            console.warn(`Failed to create category_meta for "${categoryName}":`, err)
          })
        )
      )
    } catch (err) {
      // Non-critical - categories will still work without meta
      console.warn('Some category_meta entries could not be created:', err)
    }
  }

  const results: BulkUploadResult[] = []

  // Process prompts in batches to avoid overwhelming the database
  const BATCH_SIZE = 10
  for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
    const batch = prompts.slice(i, i + BATCH_SIZE)
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (prompt, batchIndex) => {
        const globalIndex = i + batchIndex
        try {
          const { data, error } = await supabase
            .from('prompts')
            .insert([prompt])
            .select('id, title')
            .single()

          if (error) throw error
          if (!data) throw new Error('No data returned')

          return {
            success: true,
            index: globalIndex,
            title: prompt.title,
          } as BulkUploadResult
        } catch (err: any) {
          return {
            success: false,
            index: globalIndex,
            title: prompt.title,
            error: err?.message || 'Unknown error',
          } as BulkUploadResult
        }
      })
    )

    // Extract results from Promise.allSettled
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        // This shouldn't happen with Promise.allSettled, but handle it anyway
        results.push({
          success: false,
          index: results.length,
          title: 'Unknown',
          error: result.reason?.message || 'Failed to process',
        })
      }
    })
  }

  // Invalidate category cache if any prompts were successfully created
  const hasSuccess = results.some(r => r.success)
  if (hasSuccess) {
    invalidateCategoryCache()
  }

  return results
}

