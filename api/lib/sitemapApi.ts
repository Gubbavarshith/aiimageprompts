import { createClient } from '@supabase/supabase-js'

export type XmlResponse = {
  setHeader(name: string, value: string): void
  status(code: number): { send(body: string): unknown }
}

export type SitemapUrlEntry = {
  url: string
  lastmod: string
  changefreq: string
  priority: string
}

export type PublishedPromptRow = {
  id: string
  title: string | null
  category: string | null
  updated_at: string | null
  created_at: string | null
}

const SITE_ORIGIN = 'https://www.aiimageprompts.xyz'
const PAGE_SIZE = 1000

export function siteBase(): string {
  const fromEnv = process.env.SITE_URL || process.env.VITE_SITE_URL
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }
  return SITE_ORIGIN
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString().split('T')[0]
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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateUrlset(entries: SitemapUrlEntry[]): string {
  const byUrl = new Map<string, SitemapUrlEntry>()
  entries.forEach((entry) => {
    if (!entry?.url) return
    byUrl.set(entry.url, entry)
  })

  const urls = [...byUrl.values()]
    .sort((a, b) => a.url.localeCompare(b.url))
    .map(({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`
}

export function setXmlHeaders(res: XmlResponse): void {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
}

export function fallbackExploreEntry(): SitemapUrlEntry {
  return {
    url: `${siteBase()}/explore`,
    lastmod: todayIsoDate(),
    changefreq: 'daily',
    priority: '0.9',
  }
}

export async function fetchPublishedPrompts(): Promise<PublishedPromptRow[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const rows: PublishedPromptRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, category, updated_at, created_at')
      .eq('status', 'Published')
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch published prompts: ${error.message}`)
    }

    rows.push(...((data || []) as PublishedPromptRow[]))
    if (!data || data.length < PAGE_SIZE) break
  }

  return rows
}
