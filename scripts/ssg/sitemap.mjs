import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SITE } from './core/html.mjs'

const VALID_CHANGEFREQ = new Set([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
])

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

function dedupeAndSortUrls(entries) {
  const byUrl = new Map()
  for (const entry of entries) {
    if (!entry?.url) continue
    byUrl.set(entry.url, entry)
  }
  return [...byUrl.values()].sort((a, b) => a.url.localeCompare(b.url))
}

function generateUrlset(entries) {
  const urls = dedupeAndSortUrls(entries)
    .map(
      ({ url, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`
    )
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
    .map(
      ({ loc, lastmod }) => `  <sitemap>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>
`
}

async function readStaticPageRoutes(projectRoot) {
  const publicRoutesPath = join(projectRoot, 'src', 'config', 'publicRoutes.json')
  const raw = await readFile(publicRoutesPath, 'utf8')
  const routes = JSON.parse(raw)

  if (!Array.isArray(routes)) {
    throw new Error('publicRoutes.json must contain an array of routes')
  }

  return routes
    .map((route) => ({
      path: typeof route.path === 'string' ? route.path.trim() : '',
      priority: typeof route.priority === 'string' ? route.priority.trim() : '',
      changefreq: typeof route.changefreq === 'string' ? route.changefreq.trim() : '',
    }))
    .filter(
      (route) =>
        route.path.startsWith('/') && route.priority && VALID_CHANGEFREQ.has(route.changefreq)
    )
}

async function writeSitemapFile(publicDir, distDir, fileName, content) {
  const targets = [publicDir]
  if (existsSync(distDir)) targets.push(distDir)
  for (const targetDir of targets) {
    await mkdir(targetDir, { recursive: true })
    await writeFile(join(targetDir, fileName), content, 'utf8')
  }
}

export async function generateSitemaps({ projectRoot, publicDir, distDir, prompts, blogPosts }) {
  const today = new Date().toISOString().split('T')[0]
  const base = SITE

  const staticRoutes = await readStaticPageRoutes(projectRoot)

  const sitemapFiles = [
    {
      name: 'sitemap-pages.xml',
      content: generateUrlset(
        staticRoutes.map((route) => ({
          url: `${base}${route.path}`,
          lastmod: today,
          changefreq: route.changefreq,
          priority: route.priority,
        }))
      ),
    },
    {
      name: 'sitemap-blog.xml',
      content: generateUrlset(
        blogPosts.map((post) => ({
          url: `${base}/blog/${post.slug}`,
          lastmod: formatDate(post.date, today),
          changefreq: 'monthly',
          priority: '0.7',
        }))
      ),
    },
    {
      name: 'sitemap-prompts.xml',
      content: generateUrlset(
        prompts.flatMap((prompt) => {
          const title = typeof prompt.title === 'string' ? prompt.title.trim() : ''
          if (!title) return []
          return [
            {
              url: `${base}/prompt/${normalizeSlug(title)}`,
              lastmod: formatDate(prompt.updated_at || prompt.created_at, today),
              changefreq: 'weekly',
              priority: '0.8',
            },
          ]
        })
      ),
    },
    {
      name: 'sitemap-categories.xml',
      content: generateUrlset(
        (() => {
          const categories = new Set()
          for (const prompt of prompts) {
            if (typeof prompt.category !== 'string') continue
            const category = prompt.category.trim()
            if (category) categories.add(category)
          }
          return [...categories].sort((a, b) => a.localeCompare(b)).map((category) => ({
            url: `${base}/categories/${normalizeSlug(category)}`,
            lastmod: today,
            changefreq: 'weekly',
            priority: '0.7',
          }))
        })()
      ),
    },
  ]

  const index = generateSitemapIndex(
    sitemapFiles.map((file) => ({
      loc: `${base}/${file.name}`,
      lastmod: today,
    }))
  )

  await Promise.all([
    writeSitemapFile(publicDir, distDir, 'sitemap.xml', index),
    ...sitemapFiles.map((file) =>
      writeSitemapFile(publicDir, distDir, file.name, file.content)
    ),
  ])

  console.log(`[ssg] Sitemaps written — ${sitemapFiles.length + 1} files.`)
  console.log(`[ssg] Sitemap stats: ${prompts.length} prompts, ${blogPosts.length} blog posts.`)
}
