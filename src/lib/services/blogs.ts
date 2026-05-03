import { marked } from 'marked'

export type BlogPostStatus = 'Published' | 'Draft' | 'Scheduled'

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
  status: BlogPostStatus
  slug: string
  metaTitle?: string
  metaDescription?: string
  scheduledAt?: string
  showToc?: boolean
}

type BlogFrontmatter = {
  title?: unknown
  excerpt?: unknown
  author?: unknown
  date?: unknown
  category?: unknown
  imageUrl?: unknown
  tags?: unknown
  status?: unknown
  slug?: unknown
  metaTitle?: unknown
  metaDescription?: unknown
  scheduledAt?: unknown
  showToc?: unknown
}

const BLOG_FILES = import.meta.glob('/src/content/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function isValidStatus(value: unknown): value is BlogPostStatus {
  return value === 'Published' || value === 'Draft' || value === 'Scheduled'
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function addAnchorIdsToContent(html: string): string {
  return html.replace(/<h([2-4])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi, (match, level, existingId, text) => {
    if (existingId) return match
    const id = generateAnchorId(String(text))
    return id ? `<h${level} id="${id}">${text}</h${level}>` : match
  })
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
}

function parseFrontmatterValue(rawValue: string): unknown {
  const value = rawValue.trim()
  if (!value) return ''

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }

  if (value === 'true') return true
  if (value === 'false') return false

  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    return inner
      .split(',')
      .map((item) => item.trim())
      .map((item) => item.replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }

  return value
}

function parseMarkdownWithFrontmatter(raw: string): { frontmatter: BlogFrontmatter; content: string } {
  if (!raw.startsWith('---')) {
    return { frontmatter: {}, content: raw }
  }

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, content: raw }
  }

  const frontmatterRaw = match[1]
  const content = match[2]
  const frontmatter: BlogFrontmatter = {}

  for (const line of frontmatterRaw.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) continue

    const separatorIndex = trimmedLine.indexOf(':')
    if (separatorIndex <= 0) continue

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim()
    ;(frontmatter as Record<string, unknown>)[key] = parseFrontmatterValue(value)
  }

  return { frontmatter, content }
}

function parseBlogFile(path: string, raw: string): BlogPost | null {
  const { frontmatter, content } = parseMarkdownWithFrontmatter(raw)

  const title = asString(frontmatter.title)
  const slugFromFrontmatter = asString(frontmatter.slug)
  const slugFromFile = path.split('/').pop()?.replace(/\.md$/, '') || ''
  const slug = normalizeSlug(slugFromFrontmatter || slugFromFile)
  const date = asString(frontmatter.date)

  if (!title || !slug || !date) {
    console.error(`Skipping invalid blog markdown file: ${path}`)
    return null
  }

  const rawHtml = marked.parse(content, { async: false })
  const htmlContent = typeof rawHtml === 'string' ? rawHtml : ''
  const contentWithAnchors = addAnchorIdsToContent(htmlContent)

  const status = isValidStatus(frontmatter.status) ? frontmatter.status : 'Published'

  return {
    id: slug,
    title,
    excerpt: asString(frontmatter.excerpt),
    content: contentWithAnchors,
    author: asString(frontmatter.author, 'Editorial'),
    date,
    readTime: calculateReadTime(contentWithAnchors),
    category: asString(frontmatter.category, 'News'),
    imageUrl: asString(frontmatter.imageUrl),
    tags: asStringArray(frontmatter.tags),
    status,
    slug,
    metaTitle: asString(frontmatter.metaTitle) || undefined,
    metaDescription: asString(frontmatter.metaDescription) || undefined,
    scheduledAt: asString(frontmatter.scheduledAt) || undefined,
    showToc: typeof frontmatter.showToc === 'boolean' ? frontmatter.showToc : false,
  }
}

function getAllBlogPosts(): BlogPost[] {
  return Object.entries(BLOG_FILES)
    .map(([path, raw]) => parseBlogFile(path, raw))
    .filter((post): post is BlogPost => post !== null)
}

export function getPublishedBlogPosts(): BlogPost[] {
  return getAllBlogPosts()
    .filter((post) => post.status === 'Published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPublishedBlogPostBySlug(slug: string): BlogPost | null {
  const normalizedSlug = normalizeSlug(slug)
  return getPublishedBlogPosts().find((post) => post.slug === normalizedSlug) || null
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  return getPublishedBlogPosts()
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return getPublishedBlogPostBySlug(slug)
}

export function getBlogCategories(posts: BlogPost[]): string[] {
  const categories = new Set(posts.map((post) => post.category))
  return Array.from(categories).sort()
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200
  const textContent = content.replace(/<[^>]*>/g, ' ')
  const wordCount = textContent.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
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
