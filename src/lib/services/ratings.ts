import { supabase, isSupabaseReady } from '@/lib/supabaseClient'

const SETTINGS_TABLE = 'app_settings'
const RATINGS_TABLE = 'prompt_ratings'
const PROMPTS_TABLE = 'prompts'

export async function getRatingSettings() {
  if (!isSupabaseReady()) {
    return { requireLoginForRatings: true }
  }

  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('key', 'requireLoginForRatings')
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error loading rating settings:', error)
  }

  return {
    requireLoginForRatings: data?.value === 'false' ? false : true,
  }
}

export async function setRatingSettings(requireLoginForRatings: boolean) {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const { error } = await supabase
    .from(SETTINGS_TABLE)
    .upsert({
      key: 'requireLoginForRatings',
      value: requireLoginForRatings ? 'true' : 'false',
    })

  if (error) {
    console.error('Error saving rating settings:', error)
    throw new Error('Failed to save rating settings')
  }
}

type UpsertPromptRatingOptions = {
  promptId: string
  rating: number
  userId?: string | null
  ipHash?: string | null
}

type RemovePromptRatingOptions = {
  promptId: string
  userId?: string | null
  ipHash?: string | null
}

export async function upsertPromptRating({
  promptId,
  rating,
  userId,
  ipHash,
}: UpsertPromptRatingOptions) {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Invalid rating value')
  }

  // Decide how to identify the rater
  const match: Record<string, string> = { prompt_id: promptId }
  if (userId) {
    match.user_id = userId
  } else if (ipHash) {
    match.ip_hash = ipHash
  } else {
    throw new Error('Missing user identifier for rating')
  }

  // Check if a rating already exists for this prompt + user / anon id
  const { data: existingRows, error: fetchExistingError } = await supabase
    .from(RATINGS_TABLE)
    .select('id')
    .match(match)

  if (fetchExistingError) {
    console.error('Error checking existing rating:', fetchExistingError)
    throw new Error('Failed to save rating')
  }

  if (existingRows && existingRows.length > 0) {
    // Update existing rating
    const existingId = existingRows[0].id
    const { error: updateError } = await supabase
      .from(RATINGS_TABLE)
      .update({ rating })
      .eq('id', existingId)

    if (updateError) {
      console.error('Error updating rating:', updateError)
      throw new Error('Failed to save rating')
    }
  } else {
    // Insert new rating
    const insertPayload: any = {
      prompt_id: promptId,
      rating,
    }
    if (userId) insertPayload.user_id = userId
    if (ipHash) insertPayload.ip_hash = ipHash

    const { error: insertError } = await supabase
      .from(RATINGS_TABLE)
      .insert(insertPayload)

    if (insertError) {
      console.error('Error creating rating:', insertError)
      throw new Error('Failed to save rating')
    }
  }

  // Recalculate aggregates
  const { data: ratingRows, error: fetchError } = await supabase
    .from(RATINGS_TABLE)
    .select('rating')
    .eq('prompt_id', promptId)

  if (fetchError) {
    console.error('Error recalculating rating aggregates:', fetchError)
    throw new Error('Failed to recalculate rating')
  }

  const ratings = (ratingRows || []).map(row => row.rating as number)
  const count = ratings.length
  const avg = count ? ratings.reduce((sum, r) => sum += r, 0) / count : null

  const { error: updateError } = await supabase
    .from(PROMPTS_TABLE)
    .update({
      rating_avg: avg,
      rating_count: count,
    })
    .eq('id', promptId)

  if (updateError) {
    console.error('Error updating prompt rating aggregates:', updateError)
    throw new Error('Failed to update rating aggregates')
  }

  return {
    rating_avg: avg,
    rating_count: count,
  }
}

export async function removePromptRating({
  promptId,
  userId,
  ipHash,
}: RemovePromptRatingOptions) {
  if (!isSupabaseReady()) {
    throw new Error('Supabase not configured')
  }

  const match: Record<string, string> = { prompt_id: promptId }
  if (userId) {
    match.user_id = userId
  } else if (ipHash) {
    match.ip_hash = ipHash
  } else {
    throw new Error('Missing user identifier for rating removal')
  }

  const { error: deleteError } = await supabase
    .from(RATINGS_TABLE)
    .delete()
    .match(match)

  if (deleteError) {
    console.error('Error removing rating:', deleteError)
    throw new Error('Failed to remove rating')
  }

  // Recalculate aggregates after deletion
  const { data: ratingRows, error: fetchError } = await supabase
    .from(RATINGS_TABLE)
    .select('rating')
    .eq('prompt_id', promptId)

  if (fetchError) {
    console.error('Error recalculating rating aggregates:', fetchError)
    throw new Error('Failed to recalculate rating')
  }

  const ratings = (ratingRows || []).map(row => row.rating as number)
  const count = ratings.length
  const avg = count ? ratings.reduce((sum, r) => sum += r, 0) / count : null

  const { error: updateError } = await supabase
    .from(PROMPTS_TABLE)
    .update({
      rating_avg: avg,
      rating_count: count,
    })
    .eq('id', promptId)

  if (updateError) {
    console.error('Error updating prompt rating aggregates:', updateError)
    throw new Error('Failed to update rating aggregates')
  }

  return {
    rating_avg: avg,
    rating_count: count,
  }
}

