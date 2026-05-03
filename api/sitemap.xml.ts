// Vercel serverless function for dynamic sitemap generation

// Import Supabase client for server-side use
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { VercelRequest, VercelResponse } from '@vercel/node'
// Import route configuration to automatically include all static routes
import { PUBLIC_ROUTES } from '../src/config/routes'

const SITE_URL = 'https://aiimageprompts.xyz'

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Generate slug from title (same logic as in prompts.ts)
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

// Format date for sitemap (YYYY-MM-DD)
function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0]
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle)
  }
}

// Fetch all published prompts from Supabase
async function fetchPublishedPrompts() {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, updated_at, created_at')
      .eq('status', 'Published')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching prompts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    return []
  }
}

type BlogManifestEntry = {
  slug: string
  date: string
  status: 'Published' | 'Draft' | 'Scheduled'
}

// Fetch all published blog posts from generated manifest
function fetchPublishedBlogPostsFromManifest(): BlogManifestEntry[] {
  try {
    const manifestPath = join(process.cwd(), 'public', 'blog-manifest.json')
    const raw = readFileSync(manifestPath, 'utf-8')
    const parsed = JSON.parse(raw) as { posts?: BlogManifestEntry[] }
    return (parsed.posts || []).filter((post) => post.status === 'Published')
  } catch (error) {
    console.error('Failed to read blog manifest for sitemap:', error)
    return []
  }
}

// Generate XML sitemap
function generateSitemap(staticUrls: Array<{ url: string; lastmod: string; changefreq: string; priority: string }>) {
  const urls = staticUrls.map(({ url, lastmod, changefreq, priority }) => {
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`
}

function dedupeAndSortUrls(urls: Array<{ url: string; lastmod: string; changefreq: string; priority: string }>) {
  const byUrl = new Map<string, { url: string; lastmod: string; changefreq: string; priority: string }>()
  urls.forEach((entry) => {
    if (!entry?.url) return
    byUrl.set(entry.url, entry)
  })
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Set proper headers for XML content
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

    const today = new Date().toISOString().split('T')[0]

    // Automatically generate static URLs from route configuration
    // This ensures all routes defined in routes.ts are automatically included
    const staticUrls: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = PUBLIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    }))

    // Fetch published prompts with strict timeout to keep sitemap endpoint responsive.
    const prompts = await withTimeout(fetchPublishedPrompts(), 2500, [])
    prompts.forEach((prompt) => {
      const slug = generateSlug(prompt.title)
      const lastmod = prompt.updated_at ? formatDate(prompt.updated_at) : (prompt.created_at ? formatDate(prompt.created_at) : today)
      staticUrls.push({
        url: `${SITE_URL}/prompt/${slug}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      })
    })

    const blogPosts = fetchPublishedBlogPostsFromManifest()
    blogPosts.forEach((post) => {
      const slug = post.slug
      const lastmod = post.date ? formatDate(post.date) : today
      staticUrls.push({
        url: `${SITE_URL}/blog/${slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.7',
      })
    })

    // Generate and return sitemap XML
    const sitemap = generateSitemap(dedupeAndSortUrls(staticUrls))
    return res.status(200).send(sitemap)
  } catch (error) {
    console.error('Sitemap generation error:', error)
    // Return a basic sitemap with static URLs only if dynamic generation fails
    const fallbackSitemap = generateSitemap([
      {
        url: `${SITE_URL}/`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: '1.0',
      },
    ])
    return res.status(200).send(fallbackSitemap)
  }
}

