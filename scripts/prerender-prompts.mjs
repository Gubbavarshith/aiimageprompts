/**
 * Fetches all published prompts from Supabase and prerenders each prompt page
 * into dist/prompt/{slug}/index.html so Googlebot's first-wave crawl sees
 * real content instead of an empty React SPA shell.
 *
 * Run after `vite build` and `prerender-blog.mjs`.
 */

import { createClient } from '@supabase/supabase-js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const SITE = 'https://www.aiimageprompts.xyz'

// ---------------------------------------------------------------------------
// Load .env.local (same pattern as generate-sitemaps.mjs)
// ---------------------------------------------------------------------------
function loadEnv(fileName) {
  const path = join(projectRoot, fileName)
  if (!existsSync(path)) return
  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const sep = trimmed.indexOf('=')
    if (sep <= 0) continue
    const key = trimmed.slice(0, sep).trim()
    const val = trimmed.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

loadEnv('.env.local')
loadEnv('.env')

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function generateSlug(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function nav() {
  return `<header style="background:#fff;border-bottom:1px solid #e4e4e7;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;font-family:sans-serif;">
  <a href="/" style="font-weight:900;font-size:18px;color:#111827;text-decoration:none;letter-spacing:-0.5px;">AI Image Prompts</a>
  <nav style="display:flex;gap:20px;align-items:center;">
    <a href="/explore" style="color:#52525b;text-decoration:none;font-size:14px;font-weight:500;">Explore</a>
    <a href="/blog" style="color:#52525b;text-decoration:none;font-size:14px;font-weight:500;">Blog</a>
    <a href="/submit" style="color:#52525b;text-decoration:none;font-size:14px;font-weight:500;">Submit a Prompt</a>
    <a href="/about" style="color:#52525b;text-decoration:none;font-size:14px;font-weight:500;">About</a>
  </nav>
</header>`
}

function footer() {
  return `<footer style="background:#111827;color:#9ca3af;padding:40px 24px;font-family:sans-serif;font-size:14px;margin-top:80px;">
  <div style="max-width:1200px;margin:0 auto;">
    <div style="display:flex;flex-wrap:wrap;gap:40px;margin-bottom:32px;">
      <div style="min-width:200px;">
        <p style="color:#fff;font-weight:900;font-size:16px;margin:0 0 10px;">AI Image Prompts</p>
        <p style="margin:0;max-width:260px;line-height:1.6;">A curated library of AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.</p>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Explore</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/explore" style="color:#9ca3af;text-decoration:none;">Browse All Prompts</a></li>
          <li><a href="/explore?category=Portrait" style="color:#9ca3af;text-decoration:none;">Portrait Prompts</a></li>
          <li><a href="/explore?category=Photography" style="color:#9ca3af;text-decoration:none;">Photography Prompts</a></li>
          <li><a href="/explore?category=Fantasy+Art" style="color:#9ca3af;text-decoration:none;">Fantasy Art Prompts</a></li>
          <li><a href="/submit" style="color:#9ca3af;text-decoration:none;">Submit a Prompt</a></li>
        </ul>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Learn</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/blog" style="color:#9ca3af;text-decoration:none;">All Blog Posts</a></li>
          <li><a href="/blog/best-midjourney-prompts" style="color:#9ca3af;text-decoration:none;">Best Midjourney Prompts</a></li>
          <li><a href="/blog/ai-photo-prompts" style="color:#9ca3af;text-decoration:none;">AI Photo Prompts</a></li>
          <li><a href="/faq" style="color:#9ca3af;text-decoration:none;">FAQ</a></li>
        </ul>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Company</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/about" style="color:#9ca3af;text-decoration:none;">About</a></li>
          <li><a href="/contact" style="color:#9ca3af;text-decoration:none;">Contact</a></li>
          <li><a href="/terms" style="color:#9ca3af;text-decoration:none;">Terms</a></li>
          <li><a href="/privacy" style="color:#9ca3af;text-decoration:none;">Privacy</a></li>
        </ul>
      </div>
    </div>
    <p style="margin:0;border-top:1px solid #374151;padding-top:24px;">© ${new Date().getFullYear()} AI Image Prompts · <a href="/terms" style="color:#9ca3af;text-decoration:none;">Terms</a> · <a href="/privacy" style="color:#9ca3af;text-decoration:none;">Privacy</a></p>
  </div>
</footer>`
}

function renderPromptBody(prompt) {
  const catParam = encodeURIComponent(prompt.category || '')
  const tags = Array.isArray(prompt.tags) ? prompt.tags : []
  const tagHtml = tags.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;">
        ${tags.map(t => `<span style="padding:4px 12px;background:#f4f4f5;border-radius:9999px;font-size:13px;color:#52525b;">${esc(t)}</span>`).join('\n        ')}
      </div>`
    : ''

  const imageHtml = prompt.preview_image_url
    ? `<div style="margin-bottom:32px;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <img src="${esc(prompt.preview_image_url)}" alt="${esc(prompt.title)} — AI generated image" style="width:100%;display:block;max-height:600px;object-fit:contain;background:#f4f4f5;" loading="eager" />
      </div>`
    : ''

  return `<main style="max-width:900px;margin:0 auto;padding:40px 24px 64px;font-family:sans-serif;">
  <p style="margin:0 0 12px;font-size:13px;">
    <a href="/explore" style="color:#2563eb;text-decoration:none;">Explore</a>
    ${prompt.category ? ` › <a href="/explore?category=${catParam}" style="color:#2563eb;text-decoration:none;">${esc(prompt.category)}</a>` : ''}
  </p>

  <h1 style="font-size:36px;font-weight:900;margin:0 0 16px;line-height:1.15;letter-spacing:-0.5px;">${esc(prompt.title)}</h1>

  ${prompt.category ? `<span style="display:inline-block;padding:4px 14px;background:#FFDE1A;border:2px solid #111;color:#111;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-radius:4px;margin-bottom:24px;">${esc(prompt.category)}</span>` : ''}

  ${imageHtml}

  ${tagHtml}

  <section style="margin-bottom:40px;">
    <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;">Prompt</h2>
    <div style="background:#f8f8f8;border:1px solid #e4e4e7;border-radius:12px;padding:20px;font-size:16px;line-height:1.7;color:#3f3f46;white-space:pre-wrap;font-family:monospace;">${esc(prompt.prompt)}</div>
  </section>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;">How to Use This Prompt</h2>
    <ol style="font-size:16px;color:#52525b;line-height:2;padding-left:20px;margin:0;">
      <li>Copy the prompt text above</li>
      <li>Open your preferred AI image generator (Midjourney, DALL·E, Stable Diffusion, or Flux)</li>
      <li>Paste the prompt and generate</li>
      <li>Adjust one element at a time to customize for your project</li>
    </ol>
  </section>

  <div style="padding:24px;background:#f4f4f5;border-radius:12px;margin-bottom:40px;">
    <p style="font-size:16px;font-weight:700;margin:0 0 8px;">Explore more ${esc(prompt.category || 'AI image')} prompts</p>
    <ul style="margin:0;padding-left:20px;line-height:2;font-size:15px;">
      <li><a href="/explore${prompt.category ? `?category=${catParam}` : ''}" style="color:#2563eb;">Browse all ${esc(prompt.category || '')} prompts</a></li>
      <li><a href="/blog/best-midjourney-prompts" style="color:#2563eb;">Best Midjourney prompt templates</a></li>
      <li><a href="/blog/text-to-image-prompt-formulas" style="color:#2563eb;">Text-to-image prompt formulas</a></li>
      <li><a href="/submit" style="color:#2563eb;">Submit your own prompt</a></li>
    </ul>
  </div>
</main>`
}

function injectIntoShell(indexHtml, { title, description, canonical, image, jsonLd, body }) {
  const titleTag = `<title>${esc(title)}</title>`
  const descTag = `<meta name="description" content="${esc(description)}">`
  const canonTag = `<link rel="canonical" href="${esc(canonical)}">`
  const ogTags = [
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${esc(image || `${SITE}/og-image.png`)}">`,
    `<meta property="og:site_name" content="AI Image Prompts">`,
  ].join('')
  const twitterTags = [
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${esc(image || `${SITE}/og-image.png`)}">`,
  ].join('')
  const jsonLdTag = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : ''

  let out = indexHtml
  out = out.replace(/<title>[\s\S]*?<\/title>/i, titleTag)
  if (/<meta name="description"[^>]*>/i.test(out)) {
    out = out.replace(/<meta name="description"[^>]*>/i, descTag)
  } else {
    out = out.replace('</head>', `${descTag}${canonTag}${ogTags}${twitterTags}${jsonLdTag}</head>`)
  }
  if (!out.includes(canonTag)) {
    out = out.replace('</head>', `${canonTag}${ogTags}${twitterTags}${jsonLdTag}</head>`)
  }
  out = out.replace('<div id="root"></div>', `<div id="root">${nav()}${body}${footer()}</div>`)
  return out
}

// ---------------------------------------------------------------------------
// Fetch prompts from Supabase
// ---------------------------------------------------------------------------

async function fetchPrompts() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender-prompts] Supabase env vars not found — skipping prompt prerender.')
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const pageSize = 500
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, prompt, category, tags, preview_image_url, updated_at, created_at')
      .eq('status', 'Published')
      .order('updated_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn(`[prerender-prompts] Supabase error: ${error.message}`)
      return rows
    }

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  return rows
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')
  const prompts = await fetchPrompts()

  if (prompts.length === 0) {
    console.log('[prerender-prompts] No prompts fetched — skipping.')
    return
  }

  await mkdir(join(distDir, 'prompt'), { recursive: true })

  let count = 0
  const seenSlugs = new Set()

  for (const p of prompts) {
    if (!p.title || !p.prompt) continue
    const slug = generateSlug(p.title)
    if (!slug || seenSlugs.has(slug)) continue
    seenSlugs.add(slug)

    const canonical = `${SITE}/prompt/${slug}`
    const title = `${p.title} | AI Image Prompts`
    const promptSnippet = String(p.prompt).slice(0, 155)
    const description = `${promptSnippet}${p.prompt.length > 155 ? '…' : ''}`

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: p.title,
      description: String(p.prompt).slice(0, 500),
      url: canonical,
      image: p.preview_image_url || undefined,
      keywords: Array.isArray(p.tags) ? p.tags.join(', ') : undefined,
      genre: p.category || undefined,
      dateModified: p.updated_at || p.created_at || undefined,
      provider: { '@type': 'Organization', name: 'AI Image Prompts', url: SITE },
    }

    const html = injectIntoShell(indexHtml, {
      title,
      description,
      canonical,
      image: p.preview_image_url || undefined,
      jsonLd,
      body: renderPromptBody(p),
    })

    const outDir = join(distDir, 'prompt', slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), html, 'utf8')
    count++
  }

  console.log(`[prerender-prompts] ${count} prompt pages written.`)
}

main().catch((err) => {
  console.error('[prerender-prompts] Failed:', err)
  process.exit(1)
})
