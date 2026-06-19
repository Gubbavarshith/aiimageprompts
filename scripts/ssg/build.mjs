/**
 * Unified SSG build entry point.
 *
 * Replaces: prerender-homepage.mjs, prerender-blog.mjs, prerender-static.mjs,
 *           prerender-prompts.mjs, prerender-categories.mjs, generate-sitemaps.mjs
 *
 * Data is fetched once from Supabase and shared across all renderers.
 * Prompt pages are written in parallel batches of 20.
 * Old scripts are preserved — this is a new consolidated runner.
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadEnv } from './core/env.mjs'
import { fetchAllPublishedPrompts, fetchFeaturedPrompts } from './core/supabase.mjs'
import { renderHomepage } from './renderers/homepage.mjs'
import { readBlogPosts, renderBlog, writeBlogManifest } from './renderers/blog.mjs'
import { renderStaticPages } from './renderers/static.mjs'
import { renderPrompts } from './renderers/prompts.mjs'
import { renderCategories } from './renderers/categories.mjs'
import { generateSitemaps } from './sitemap.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')
const distDir = join(projectRoot, 'dist')
const publicDir = join(projectRoot, 'public')
const contentDir = join(projectRoot, 'src', 'content', 'blog')

async function main() {
  const startTime = Date.now()

  // 1. Load environment variables
  loadEnv(projectRoot)

  // 2. Read the Vite-built index.html shell
  let indexHtml
  try {
    indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')
  } catch {
    console.error('[ssg] Could not read dist/index.html — make sure Vite build completed first.')
    process.exit(1)
  }

  if (!indexHtml.includes('<div id="root"></div>')) {
    console.error('[ssg] dist/index.html is missing <div id="root"></div> — Vite build may be corrupted.')
    process.exit(1)
  }

  console.log('[ssg] Starting unified SSG build...')

  // 3. Fetch all data in parallel (single Supabase connection, shared across renderers)
  console.log('[ssg] Fetching data...')
  const [allPrompts, featuredPrompts, blogPosts] = await Promise.all([
    fetchAllPublishedPrompts(),
    fetchFeaturedPrompts(10),
    readBlogPosts(contentDir),
  ])

  console.log(
    `[ssg] Data ready: ${allPrompts.length} prompts, ${featuredPrompts.length} featured, ${blogPosts.length} blog posts.`
  )

  // 4. Render all pages — static pages and blog can run in parallel
  //    Homepage needs indexHtml, categories/prompts need the allPrompts data
  //    All share the same indexHtml and allPrompts without re-fetching
  const ctx = { distDir, publicDir, projectRoot, indexHtml }

  await Promise.all([
    renderHomepage({ ...ctx, featuredPrompts }),
    renderBlog({ ...ctx, posts: blogPosts }),
    renderStaticPages(ctx),
  ])

  // 5. Prompt pages and category pages (both need allPrompts — run after fetch completes)
  await Promise.all([
    renderPrompts({ ...ctx, prompts: allPrompts }),
    renderCategories({ ...ctx, prompts: allPrompts }),
  ])

  // 6. Write blog manifest
  await writeBlogManifest({ distDir, publicDir, posts: blogPosts })

  // 7. Generate all sitemaps
  await generateSitemaps({
    projectRoot,
    publicDir,
    distDir,
    prompts: allPrompts,
    blogPosts,
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n[ssg] Build complete in ${elapsed}s.`)
}

main().catch((err) => {
  console.error('[ssg] Build failed:', err)
  process.exit(1)
})
