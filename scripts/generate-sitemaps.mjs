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
  const [staticRoutes, blogPosts] = await Promise.all([
    readStaticPageRoutes(),
    readPublishedBlogPosts(),
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
  ]

  const index = generateSitemapIndex([
    ...sitemapFiles.map(file => ({
      loc: `${base}/${file.name}`,
      lastmod: today,
    })),
    { loc: `${base}/api/sitemap-prompts.xml`, lastmod: today },
    { loc: `${base}/api/sitemap-categories.xml`, lastmod: today },
  ])

  await Promise.all([
    writeSitemapFile('sitemap.xml', index),
    ...sitemapFiles.map(file => writeSitemapFile(file.name, file.content)),
  ])

  console.log(`[sitemap] Generated ${sitemapFiles.length + 1} static sitemap files.`)
  console.log(`[sitemap] Blog posts: ${blogPosts.length}. Prompt and category sitemaps are dynamic API endpoints.`)
}

main().catch(error => {
  console.error('[sitemap] Generation failed:', error)
  process.exit(1)
})
