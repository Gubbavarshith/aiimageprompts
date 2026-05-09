import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const publicDir = join(projectRoot, 'public')
const distDir = join(projectRoot, 'dist')
const blogDir = join(projectRoot, 'src', 'content', 'blog')
const publicRoutesPath = join(projectRoot, 'src', 'config', 'publicRoutes.json')

const SITE_ORIGIN = 'https://www.aiimageprompts.xyz'
const VALID_CHANGEFREQ = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])

function loadLocalEnvFile(fileName) {
  const path = join(projectRoot, fileName)
  if (!existsSync(path)) return

  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function siteBase() {
  const fromEnv = process.env.SITE_URL || process.env.VITE_SITE_URL
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }
  return SITE_ORIGIN
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value, fallback) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toISOString().split('T')[0]
}

function generateUrlset(entries) {
  const urls = dedupeAndSortUrls(entries)
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
</urlset>
`
}

function generateSitemapIndex(entries) {
  const items = entries
    .map(({ loc, lastmod }) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`
}

function dedupeAndSortUrls(entries) {
  const byUrl = new Map()
  for (const entry of entries) {
    if (!entry?.url) continue
    byUrl.set(entry.url, entry)
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
}

async function readStaticPageRoutes() {
  const raw = await readFile(publicRoutesPath, 'utf8')
  const routes = JSON.parse(raw)

  if (!Array.isArray(routes)) {
    throw new Error('publicRoutes.json must contain an array of routes')
  }

  return routes
    .map(route => ({
      path: typeof route.path === 'string' ? route.path.trim() : '',
      priority: typeof route.priority === 'string' ? route.priority.trim() : '',
      changefreq: typeof route.changefreq === 'string' ? route.changefreq.trim() : '',
    }))
    .filter(route => route.path.startsWith('/') && route.priority && VALID_CHANGEFREQ.has(route.changefreq))
}

function buildStaticPageEntries(routes, today) {
  const base = siteBase()
  return routes.map(route => ({
    url: `${base}${route.path}`,
    lastmod: today,
    changefreq: route.changefreq,
    priority: route.priority,
  }))
}

async function fetchPublishedPrompts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] Supabase env vars not found; generated prompt/category sitemaps will be empty.')
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, category, updated_at, created_at')
      .eq('status', 'Published')
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn(`[sitemap] Could not fetch prompts: ${error.message}`)
      return rows
    }

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return rows
}

async function readPublishedBlogPosts() {
  const files = await readdir(blogDir)
  const posts = []

  for (const file of files.filter(name => name.endsWith('.md') && !name.startsWith('_'))) {
    const raw = await readFile(join(blogDir, file), 'utf8')
    const { data } = matter(raw)
    const title = String(data.title || '').trim()
    const slug = normalizeSlug(data.slug || file.replace(/\.md$/, ''))
    const date = String(data.date || '').trim()
    const status = String(data.status || 'Published')

    if (!title || !slug || !date || status !== 'Published') continue
    posts.push({ slug, date })
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function buildBlogEntries(posts, today) {
  const base = siteBase()
  return posts.map(post => ({
    url: `${base}/blog/${post.slug}`,
    lastmod: formatDate(post.date, today),
    changefreq: 'monthly',
    priority: '0.7',
  }))
}

function buildPromptEntries(prompts, today) {
  const base = siteBase()
  return prompts.flatMap(prompt => {
    const title = typeof prompt.title === 'string' ? prompt.title.trim() : ''
    if (!title) return []
    return [{
      url: `${base}/prompt/${normalizeSlug(title)}`,
      lastmod: formatDate(prompt.updated_at || prompt.created_at, today),
      changefreq: 'weekly',
      priority: '0.8',
    }]
  })
}

function buildCategoryEntries(prompts, today) {
  const base = siteBase()
  const categories = new Set()

  for (const prompt of prompts) {
    if (typeof prompt.category !== 'string') continue
    const category = prompt.category.trim()
    if (category) categories.add(category)
  }

  return [...categories].sort((a, b) => a.localeCompare(b)).map(category => {
    const query = new URLSearchParams({ category })
    return {
      url: `${base}/explore?${query.toString()}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.65',
    }
  })
}

async function writeSitemapFile(fileName, content) {
  const targets = [publicDir]
  if (existsSync(distDir)) targets.push(distDir)

  for (const targetDir of targets) {
    await mkdir(targetDir, { recursive: true })
    await writeFile(join(targetDir, fileName), content, 'utf8')
  }
}

async function main() {
  loadLocalEnvFile('.env')
  loadLocalEnvFile('.env.local')

  const base = siteBase()
  const today = new Date().toISOString().split('T')[0]
  const [staticRoutes, blogPosts, prompts] = await Promise.all([
    readStaticPageRoutes(),
    readPublishedBlogPosts(),
    fetchPublishedPrompts(),
  ])

  const sitemapFiles = [
    {
      name: 'sitemap-pages.xml',
      content: generateUrlset(buildStaticPageEntries(staticRoutes, today)),
    },
    {
      name: 'sitemap-blog.xml',
      content: generateUrlset(buildBlogEntries(blogPosts, today)),
    },
    {
      name: 'sitemap-prompts.xml',
      content: generateUrlset(buildPromptEntries(prompts, today)),
    },
    {
      name: 'sitemap-categories.xml',
      content: generateUrlset(buildCategoryEntries(prompts, today)),
    },
  ]

  const index = generateSitemapIndex(
    sitemapFiles.map(file => ({
      loc: `${base}/${file.name}`,
      lastmod: today,
    }))
  )

  await Promise.all([
    writeSitemapFile('sitemap.xml', index),
    ...sitemapFiles.map(file => writeSitemapFile(file.name, file.content)),
  ])

  console.log(`[sitemap] Generated ${sitemapFiles.length + 1} static sitemap files.`)
  console.log(`[sitemap] Prompts: ${prompts.length}, blog posts: ${blogPosts.length}.`)
}

main().catch(error => {
  console.error('[sitemap] Generation failed:', error)
  process.exit(1)
})