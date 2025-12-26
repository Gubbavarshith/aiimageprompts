import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

const TABLE_NAME = 'prompt_discovery_events'

export type DiscoveryEventPayload = {
  promptId: string
  fromPromptId?: string | null
  source: 'related' | 'category-chip' | 'tag-chip' | 'search-result' | 'featured' | 'direct'
  categoryAtClick?: string | null
  tagAtClick?: string | null
  userId?: string | null
  anonId?: string | null
}

/**
 * Log a discovery event (non-blocking)
 * This function is fire-and-forget - errors are logged but don't throw
 */
export async function logDiscoveryEvent(event: DiscoveryEventPayload): Promise<void> {
  if (!isSupabaseReady()) {
    console.warn('Supabase not configured, skipping discovery event logging')
    return
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .insert({
        prompt_id: event.promptId,
        from_prompt_id: event.fromPromptId || null,
        source: event.source,
        category_at_click: event.categoryAtClick || null,
        tag_at_click: event.tagAtClick || null,
        user_id: event.userId || null,
        anon_id: event.anonId || null,
      })

    if (error) {
      console.error('Error logging discovery event:', error)
      // Don't throw - this is non-blocking
    }
  } catch (error) {
    console.error('Exception logging discovery event:', error)
    // Don't throw - this is non-blocking
  }
}

/**
 * Get co-visitation statistics for a prompt
 * Returns a map of related prompt IDs to click counts
 */
export async function getCoVisitationStats(promptId: string): Promise<Map<string, number>> {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('from_prompt_id')
      .eq('prompt_id', promptId)
      .not('from_prompt_id', 'is', null)

    if (error) {
      console.error('Error fetching co-visitation stats:', error)
      throw new Error(`Failed to fetch co-visitation stats: ${error.message}`)
    }

    // Count occurrences
    const counts = new Map<string, number>()
    if (data) {
      data.forEach((row: { from_prompt_id: string }) => {
        const fromId = row.from_prompt_id
        counts.set(fromId, (counts.get(fromId) || 0) + 1)
      })
    }

    return counts
  } catch (error) {
    console.error('Error in getCoVisitationStats:', error)
    throw error
  }
}

