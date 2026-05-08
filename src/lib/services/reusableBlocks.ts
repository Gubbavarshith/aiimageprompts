import { supabase } from '../supabaseClient'

/**
 * Reusable Blocks Service
 * 
 * Provides CRUD operations for reusable content blocks
 * that can be saved and inserted into blog posts.
 * Uses Supabase client for all database operations.
 */

export type ReusableBlock = {
  id: string
  name: string
  content: string
  blockType: string
  createdAt: string
  updatedAt: string
}

type ReusableBlockRow = {
  id: string
  name: string
  content: string
  block_type: string | null
  created_at: string
  updated_at: string
}

type ReusableBlockWriteRow = {
  name?: string
  content?: string
  block_type?: string
}

// Helper function to map database row to ReusableBlock type
const mapRowToReusableBlock = (row: ReusableBlockRow): ReusableBlock => ({
  id: row.id,
  name: row.name,
  content: row.content,
  blockType: row.block_type || 'html',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

// Helper function to map ReusableBlock to database row
const mapReusableBlockToRow = (block: Partial<ReusableBlock>): ReusableBlockWriteRow => ({
  name: block.name,
  content: block.content,
  block_type: block.blockType || 'html',
})

/**
 * Fetch all reusable blocks
 */
export async function fetchReusableBlocks(): Promise<ReusableBlock[]> {
  try {
    const { data, error } = await supabase
      .from('reusable_blocks')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching reusable blocks:', error)
      throw new Error('Failed to fetch reusable blocks')
    }

    return (data || []).map(mapRowToReusableBlock)
  } catch (error) {
    console.error('Error fetching reusable blocks:', error)
    throw new Error('Failed to fetch reusable blocks')
  }
}

/**
 * Fetch a single reusable block by ID
 */
export async function fetchReusableBlockById(id: string): Promise<ReusableBlock | null> {
  try {
    const { data, error } = await supabase
      .from('reusable_blocks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching reusable block:', error)
      throw new Error('Failed to fetch reusable block')
    }

    return data ? mapRowToReusableBlock(data) : null
  } catch (error) {
    console.error('Error fetching reusable block:', error)
    throw new Error('Failed to fetch reusable block')
  }
}

/**
 * Create a new reusable block
 */
export type CreateReusableBlockPayload = {
  name: string
  content: string
  blockType?: string
}

export async function createReusableBlock(payload: CreateReusableBlockPayload): Promise<ReusableBlock> {
  try {
    // Check if block with same name already exists
    const { data: existingData } = await supabase
      .from('reusable_blocks')
      .select('id')
      .eq('name', payload.name)
      .limit(1)

    if (existingData && existingData.length > 0) {
      throw new Error('A block with this name already exists')
    }

    const rowData = mapReusableBlockToRow({
      name: payload.name,
      content: payload.content,
      blockType: payload.blockType || 'html',
    })

    const { data, error } = await supabase
      .from('reusable_blocks')
      .insert(rowData)
      .select()
      .single()

    if (error) {
      console.error('Error creating reusable block:', error)
      throw new Error('Failed to create reusable block')
    }

    return mapRowToReusableBlock(data)
  } catch (error) {
    console.error('Error creating reusable block:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create reusable block')
  }
}

/**
 * Update an existing reusable block
 */
export type UpdateReusableBlockPayload = {
  id: string
  name?: string
  content?: string
  blockType?: string
}

export async function updateReusableBlock(payload: UpdateReusableBlockPayload): Promise<ReusableBlock> {
  try {
    // Check if new name conflicts with another block
    if (payload.name) {
      const { data: existingData } = await supabase
        .from('reusable_blocks')
        .select('id')
        .eq('name', payload.name)
        .neq('id', payload.id)
        .limit(1)

      if (existingData && existingData.length > 0) {
        throw new Error('A block with this name already exists')
      }
    }

    const updateData: ReusableBlockWriteRow = {}
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.content !== undefined) updateData.content = payload.content
    if (payload.blockType !== undefined) updateData.block_type = payload.blockType

    const { data, error } = await supabase
      .from('reusable_blocks')
      .update(updateData)
      .eq('id', payload.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reusable block:', error)
      throw new Error('Failed to update reusable block')
    }

    return mapRowToReusableBlock(data)
  } catch (error) {
    console.error('Error updating reusable block:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update reusable block')
  }
}

/**
 * Delete a reusable block
 */
export async function deleteReusableBlock(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('reusable_blocks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reusable block:', error)
      throw new Error('Failed to delete reusable block')
    }
  } catch (error) {
    console.error('Error deleting reusable block:', error)
    throw new Error('Failed to delete reusable block')
  }
}

/**
 * Search reusable blocks by name
 */
export async function searchReusableBlocks(query: string): Promise<ReusableBlock[]> {
  try {
    const { data, error } = await supabase
      .from('reusable_blocks')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error searching reusable blocks:', error)
      throw new Error('Failed to search reusable blocks')
    }

    return (data || []).map(mapRowToReusableBlock)
  } catch (error) {
    console.error('Error searching reusable blocks:', error)
    throw new Error('Failed to search reusable blocks')
  }
}

