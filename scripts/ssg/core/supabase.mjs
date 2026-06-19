import { createClient } from '@supabase/supabase-js'
import { getSupabaseCredentials } from './env.mjs'

let _client = null

function getClient() {
  if (_client) return _client
  const { url, key } = getSupabaseCredentials()
  if (!url || !key) return null
  _client = createClient(url, key)
  return _client
}

export async function fetchAllPublishedPrompts() {
  const supabase = getClient()
  if (!supabase) {
    console.warn('[ssg/supabase] Supabase env vars not found — skipping Supabase queries.')
    return []
  }

  const pageSize = 500
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, prompt, category, tags, preview_image_url, updated_at, created_at')
      .eq('status', 'Published')
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn(`[ssg/supabase] Error fetching prompts: ${error.message}`)
      return rows
    }

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return rows
}

export async function fetchFeaturedPrompts(limit = 10) {
  const supabase = getClient()
  if (!supabase) {
    console.warn('[ssg/supabase] Supabase env vars not found — returning empty featured prompts.')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, prompt, category, tags, preview_image_url, image_ratio')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn(`[ssg/supabase] Error fetching featured prompts: ${error.message}`)
      return []
    }

    return data || []
  } catch (err) {
    console.warn(`[ssg/supabase] Featured prompts query failed: ${err.message}`)
    return []
  }
}
