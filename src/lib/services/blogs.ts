import blogPostsData from '../data/blogPosts.json'

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
}

const STORAGE_KEY = 'blog_posts_data'
const STORAGE_BACKUP_KEY = 'blog_posts_backup'

const readFromStorage = (): BlogPost[] | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_BACKUP_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BlogPost[]
    return Array.isArray(parsed) ? parsed : null
  } catch (err) {
    console.error('Failed to read blog posts from storage:', err)
    return null
  }
}

const persistPosts = (posts: BlogPost[]) => {
  if (typeof window === 'undefined') return
  try {
    const serialized = JSON.stringify(posts)
    localStorage.setItem(STORAGE_KEY, serialized)
    localStorage.setItem(STORAGE_BACKUP_KEY, serialized)
  } catch (err) {
    console.error('Failed to persist blog posts:', err)
  }
}

// Simulate async JSON reading (acts like a tiny JSON DB in the browser)
const loadBlogPosts = async (): Promise<BlogPost[]> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  const storedPosts = readFromStorage()
  if (storedPosts) return storedPosts
  return blogPostsData as BlogPost[]
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await loadBlogPosts()
    return posts.filter(post => post.status === 'Published')
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    throw new Error('Failed to fetch blog posts')
  }
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const posts = await loadBlogPosts()
    const post = posts.find(p => p.slug === slug && p.status === 'Published')
    return post || null
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
  try {
    const posts = await loadBlogPosts()
    const post = posts.find(p => p.id === id && p.status === 'Published')
    return post || null
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
  const wordCount = content.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

// Admin functions - fetch all posts including drafts
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await loadBlogPosts()
    return posts
  } catch (error) {
    console.error('Error fetching all blog posts:', error)
    throw new Error('Failed to fetch blog posts')
  }
}

export async function fetchBlogPostByIdForAdmin(id: string): Promise<BlogPost | null> {
  try {
    const posts = await loadBlogPosts()
    const post = posts.find(p => p.id === id)
    return post || null
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

// Create new blog post
export type CreateBlogPostPayload = Omit<BlogPost, 'id' | 'date' | 'readTime' | 'slug'> & {
  slug?: string
}

export async function createBlogPost(payload: CreateBlogPostPayload): Promise<BlogPost> {
  try {
    const posts = await loadBlogPosts()
    const newId = String(Math.max(0, ...posts.map(p => parseInt(p.id) || 0)) + 1)
    const slug = payload.slug || generateSlug(payload.title)
    const readTime = calculateReadTime(payload.content)
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Check if slug already exists
    let finalSlug = slug
    let slugCounter = 1
    while (posts.some(p => p.slug === finalSlug && p.id !== newId)) {
      finalSlug = `${slug}-${slugCounter}`
      slugCounter++
    }

    const newPost: BlogPost = {
      id: newId,
      ...payload,
      slug: finalSlug,
      readTime,
      date,
    }

    const updatedPosts = [...posts, newPost]
    persistPosts(updatedPosts)

    return newPost
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
    const posts = await loadBlogPosts()
    const postIndex = posts.findIndex(p => p.id === payload.id)

    if (postIndex === -1) {
      throw new Error('Blog post not found')
    }

    const existingPost = posts[postIndex]
    const updatedContent = payload.content !== undefined ? payload.content : existingPost.content
    const readTime = calculateReadTime(updatedContent)
    
    // Generate new slug if title changed
    let slug = existingPost.slug
    if (payload.title && payload.title !== existingPost.title) {
      slug = generateSlug(payload.title)
      // Check if slug already exists (excluding current post)
      let finalSlug = slug
      let slugCounter = 1
      while (posts.some(p => p.slug === finalSlug && p.id !== payload.id)) {
        finalSlug = `${slug}-${slugCounter}`
        slugCounter++
      }
      slug = finalSlug
    }

    const updatedPost: BlogPost = {
      ...existingPost,
      ...payload,
      slug,
      readTime,
    }

    const updatedPosts = [...posts]
    updatedPosts[postIndex] = updatedPost
    persistPosts(updatedPosts)

    return updatedPost
  } catch (error) {
    console.error('Error updating blog post:', error)
    throw new Error('Failed to update blog post')
  }
}

// Delete blog post
export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const posts = await loadBlogPosts()
    const filteredPosts = posts.filter(p => p.id !== id)

    if (filteredPosts.length === posts.length) {
      throw new Error('Blog post not found')
    }

    persistPosts(filteredPosts)
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

