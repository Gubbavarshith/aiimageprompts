import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { VercelResponse } from '@vercel/node'

import { PUBLIC_ROUTES } from '../../src/config/routes'
import { resolveSiteOrigin } from '../../src/config/site'

export type SitemapUrlEntry = {
  url: string
  lastmod: string
  changefreq: string
  priority: string
}

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0]
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
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

export async function fetchPublishedPrompts() {
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

export async function fetchDistinctCategories(): Promise<string[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('prompts').select('category').eq('status', 'Published')

    if (error || !data) {
      console.error('Error fetching categories:', error)
      return []
    }

    const categories = new Set<string>()
    for (const row of data) {
      if (row.category && typeof row.category === 'string') {
        const c = row.category.trim()
        if (c) categories.add(c)
      }
    }
    return [...categories].sort((a, b) => a.localeCompare(b))
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return []
  }
}

type BlogManifestEntry = {
  slug: string
  date: string
  status: 'Published' | 'Draft' | 'Scheduled'
}

export function fetchPublishedBlogPostsFromManifest(): BlogManifestEntry[] {
  const candidates = [join(process.cwd(), 'public', 'blog-manifest.json'), join(process.cwd(), 'dist', 'blog-manifest.json')]
  for (const manifestPath of candidates) {
    try {
      const raw = readFileSync(manifestPath, 'utf-8')
      const parsed = JSON.parse(raw) as { posts?: BlogManifestEntry[] }
      return (parsed.posts || []).filter((post) => post.status === 'Published')
    } catch {
      // try next path
    }
  }
  console.error('Failed to read blog manifest for sitemap from:', candidates.join(', '))
  return []
}

export function generateUrlset(entries: SitemapUrlEntry[]): string {
  const urls = entries.map(({ url, lastmod, changefreq, priority }) => {
    return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
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

export function generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod: string }>): string {
  const items = sitemaps
    .map(
      ({ loc, lastmod }) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`
}

export function dedupeAndSortUrls(entries: SitemapUrlEntry[]): SitemapUrlEntry[] {
  const byUrl = new Map<string, SitemapUrlEntry>()
  entries.forEach((entry) => {
    if (!entry?.url) return
    byUrl.set(entry.url, entry)
  })
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
}

export function setXmlHeaders(res: VercelResponse): void {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
}

export function siteBase(): string {
  return resolveSiteOrigin()
}

export function buildStaticPageEntries(today: string): SitemapUrlEntry[] {
  const base = siteBase()
  return PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority,
  }))
}
