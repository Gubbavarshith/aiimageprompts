import { supabase } from '../supabaseClient'

export type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  readTime: string
  category: string
  imageUrl: string
  tags: string[]
  status: 'Published' | 'Draft' | 'Scheduled'
  slug: string
  metaTitle?: string
  metaDescription?: string
  scheduledAt?: string
}

// Helper function to map database row to BlogPost type
const mapRowToBlogPost = (row: any): BlogPost => ({
  id: row.id,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  author: row.author,
  date: row.date,
  readTime: row.read_time,
  category: row.category,
  imageUrl: row.image_url || '',
  tags: row.tags || [],
  status: row.status,
  slug: row.slug,
  metaTitle: row.meta_title || undefined,
  metaDescription: row.meta_description || undefined,
  scheduledAt: row.scheduled_at || undefined,
})

// Helper function to map BlogPost to database row
const mapBlogPostToRow = (post: Partial<BlogPost>): any => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  date: post.date,
  read_time: post.readTime,
  category: post.category,
  image_url: post.imageUrl || null,
  tags: post.tags || [],
  status: post.status,
  meta_title: post.metaTitle || null,
  meta_description: post.metaDescription || null,
  scheduled_at: post.scheduledAt || null,
})

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'Published')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
      throw new Error('Failed to fetch blog posts')
    }

    return (data || []).map(mapRowToBlogPost)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw new Error('Failed to fetch blog posts')
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'Published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching blog post:', error)
      throw new Error('Failed to fetch blog post')
    }

    return data ? mapRowToBlogPost(data) : null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .eq('status', 'Published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching blog post:', error)
      throw new Error('Failed to fetch blog post')
    }

    return data ? mapRowToBlogPost(data) : null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

export function getBlogCategories(posts: BlogPost[]): string[] {
  const categories = new Set(posts.map(post => post.category))
  return Array.from(categories).sort()
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200
  // Strip HTML tags for accurate word count
  const textContent = content.replace(/<[^>]*>/g, ' ')
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

// Admin functions - fetch all posts including drafts
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching all blog posts:', error)
      throw new Error('Failed to fetch blog posts')
    }

    return (data || []).map(mapRowToBlogPost)
  } catch (error) {
    console.error('Error fetching all blog posts:', error)
    throw new Error('Failed to fetch blog posts')
  }
}

export async function fetchBlogPostByIdForAdmin(id: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching blog post:', error)
      throw new Error('Failed to fetch blog post')
    }

    return data ? mapRowToBlogPost(data) : null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Check if slug exists (excluding a specific post ID)
async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .limit(1)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error checking slug:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Error checking slug:', error)
    return false
  }
}

// Generate unique slug
async function generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let finalSlug = baseSlug
  let counter = 1

  while (await slugExists(finalSlug, excludeId)) {
    finalSlug = `${baseSlug}-${counter}`
    counter++
  }

  return finalSlug
}

// Create new blog post
export type CreateBlogPostPayload = Omit<BlogPost, 'id' | 'date' | 'readTime' | 'slug'> & {
  slug?: string
}

export async function createBlogPost(payload: CreateBlogPostPayload): Promise<BlogPost> {
  try {
    const slug = payload.slug || generateSlug(payload.title)
    const readTime = calculateReadTime(payload.content)
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Generate unique slug
    const finalSlug = await generateUniqueSlug(slug)

    const rowData = mapBlogPostToRow({
      ...payload,
      slug: finalSlug,
      readTime,
      date,
    })

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(rowData)
      .select()
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      throw new Error('Failed to create blog post')
    }

    return mapRowToBlogPost(data)
  } catch (error) {
    console.error('Error creating blog post:', error)
    throw new Error('Failed to create blog post')
  }
}

// Update existing blog post
export type UpdateBlogPostPayload = Partial<Omit<BlogPost, 'id' | 'date' | 'readTime'>> & {
  id: string
}

export async function updateBlogPost(payload: UpdateBlogPostPayload): Promise<BlogPost> {
  try {
    // Fetch existing post to get current values
    const { data: existingData, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', payload.id)
      .single()

    if (fetchError || !existingData) {
      throw new Error('Blog post not found')
    }

    const existingPost = mapRowToBlogPost(existingData)
    const updatedContent = payload.content !== undefined ? payload.content : existingPost.content
    const readTime = calculateReadTime(updatedContent)
    
    // Generate new slug if title changed
    let slug = existingPost.slug
    if (payload.title && payload.title !== existingPost.title) {
      const baseSlug = generateSlug(payload.title)
      slug = await generateUniqueSlug(baseSlug, payload.id)
    }

    const updateData: any = {}
    if (payload.title !== undefined) updateData.title = payload.title
    if (payload.excerpt !== undefined) updateData.excerpt = payload.excerpt
    if (payload.content !== undefined) updateData.content = payload.content
    if (payload.author !== undefined) updateData.author = payload.author
    if (payload.category !== undefined) updateData.category = payload.category
    if (payload.imageUrl !== undefined) updateData.image_url = payload.imageUrl || null
    if (payload.tags !== undefined) updateData.tags = payload.tags || []
    if (payload.status !== undefined) updateData.status = payload.status
    if (payload.metaTitle !== undefined) updateData.meta_title = payload.metaTitle || null
    if (payload.metaDescription !== undefined) updateData.meta_description = payload.metaDescription || null
    if (payload.scheduledAt !== undefined) updateData.scheduled_at = payload.scheduledAt || null
    if (slug !== existingPost.slug) updateData.slug = slug
    updateData.read_time = readTime

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', payload.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating blog post:', error)
      throw new Error('Failed to update blog post')
    }

    return mapRowToBlogPost(data)
  } catch (error) {
    console.error('Error updating blog post:', error)
    throw new Error('Failed to update blog post')
  }
}

// Delete blog post
export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting blog post:', error)
      throw new Error('Failed to delete blog post')
    }
  } catch (error) {
    console.error('Error deleting blog post:', error)
    throw new Error('Failed to delete blog post')
  }
}

// Get available categories
export const BLOG_CATEGORIES = [
  'Technology',
  'Tutorials',
  'Ethics',
  'Resources',
  'Workflows',
  'Deep Dive',
  'News',
  'Updates',
] as const

export type BlogCategory = typeof BLOG_CATEGORIES[number]
