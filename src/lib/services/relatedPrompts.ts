import { supabase, isSupabaseReady } from '@/lib/supabaseClient'
import type { PromptRecord } from './prompts'

const TABLE_NAME = 'prompts'

// Scoring weights
const W_TAGS = 10
const W_RATING = 5
const W_VIEWS = 1

/**
 * Calculate shared tags count between two prompts
 */
function getSharedTagsCount(tags1: string[] | null, tags2: string[] | null): number {
  if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) {
    return 0
  }
  
  const set1 = new Set(tags1.map(t => t.toLowerCase()))
  const set2 = new Set(tags2.map(t => t.toLowerCase()))
  
  let count = 0
  set1.forEach(tag => {
    if (set2.has(tag)) {
      count++
    }
  })
  
  return count
}

/**
 * Normalize views using log10
 */
function normalizeViews(views: number): number {
  return Math.log10(views + 1)
}

/**
 * Calculate similarity score for a candidate prompt
 */
function calculateScore(
  currentPrompt: PromptRecord,
  candidate: PromptRecord
): number {
  const sharedTagsCount = getSharedTagsCount(currentPrompt.tags, candidate.tags)
  const ratingAvg = typeof candidate.rating_avg === 'number' ? candidate.rating_avg : 0
  const normalizedViews = normalizeViews(candidate.views || 0)
  
  return (
    sharedTagsCount * W_TAGS +
    ratingAvg * W_RATING +
    normalizedViews * W_VIEWS
  )
}

/**
 * Fetch related prompts with tag-aware smart ranking
 * Fetches prompts from the same category and re-ranks them by similarity
 */
export async function fetchRelatedPromptsSmart(
  currentPrompt: PromptRecord,
  limit: number = 6
): Promise<PromptRecord[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // Fetch larger pool from same category
  const poolSize = Math.max(limit * 3, 20) // Fetch at least 20, or 3x the limit
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('status', 'Published')
    .eq('category', currentPrompt.category)
    .neq('id', currentPrompt.id)
    .order('views', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(poolSize)
  
  if (error) {
    console.error('Error fetching related prompts:', error)
    throw new Error(`Failed to fetch related prompts: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  // Calculate scores and sort
  const scored = data.map(prompt => ({
    prompt: prompt as PromptRecord,
    score: calculateScore(currentPrompt, prompt as PromptRecord),
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  // Return top N
  return scored.slice(0, limit).map(item => item.prompt)
}

/**
 * Fetch related prompts with fallback to cross-category prompts
 * If same-category results are insufficient, fetches cross-category prompts with shared tags
 */
export async function fetchRelatedPromptsWithFallback(
  currentPrompt: PromptRecord,
  limit: number = 6
): Promise<PromptRecord[]> {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  // First, try same-category smart ranking
  const sameCategoryResults = await fetchRelatedPromptsSmart(currentPrompt, limit)
  
  if (sameCategoryResults.length >= limit) {
    return sameCategoryResults
  }
  
  // If we need more results, fetch cross-category prompts with shared tags
  const needed = limit - sameCategoryResults.length
  
  if (!currentPrompt.tags || currentPrompt.tags.length === 0) {
    // No tags to match, return what we have
    return sameCategoryResults
  }
  
  // Fetch prompts from other categories that share at least 2 tags
  const { data: crossCategoryData, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('status', 'Published')
    .neq('category', currentPrompt.category)
    .neq('id', currentPrompt.id)
    .limit(needed * 3) // Fetch more to filter by tag overlap
  
  if (error) {
    console.error('Error fetching cross-category prompts:', error)
    // Return what we have from same category
    return sameCategoryResults
  }
  
  if (!crossCategoryData || crossCategoryData.length === 0) {
    return sameCategoryResults
  }
  
  // Filter by shared tags (at least 2 shared tags)
  const crossCategoryFiltered = crossCategoryData.filter(prompt => {
    const sharedCount = getSharedTagsCount(currentPrompt.tags, prompt.tags as string[] | null)
    return sharedCount >= 2
  })
  
  // Score and sort cross-category prompts
  const scored = crossCategoryFiltered.map(prompt => ({
    prompt: prompt as PromptRecord,
    score: calculateScore(currentPrompt, prompt as PromptRecord),
  }))
  
  scored.sort((a, b) => b.score - a.score)
  
  // Take top needed results
  const crossCategoryResults = scored.slice(0, needed).map(item => item.prompt)
  
  // Combine and return (same-category first, then cross-category)
  return [...sameCategoryResults, ...crossCategoryResults]
}

