/**
 * Prerenders all category pages into dist/categories/{slug}/index.html.
 * Each page includes real prompt data fetched from Supabase, full site nav,
 * structured data (BreadcrumbList + CollectionPage), and category-specific
 * meta tags — so Googlebot's first-wave crawl indexes real content.
 *
 * Run after vite build and prerender-prompts.mjs.
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
// Load .env.local
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
        <p style="margin:0;max-width:260px;line-height:1.6;">Curated AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.</p>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Categories</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/categories/portrait" style="color:#9ca3af;text-decoration:none;">Portrait Prompts</a></li>
          <li><a href="/categories/photography" style="color:#9ca3af;text-decoration:none;">Photography Prompts</a></li>
          <li><a href="/categories/fantasy-art" style="color:#9ca3af;text-decoration:none;">Fantasy Art Prompts</a></li>
          <li><a href="/categories/product-photography" style="color:#9ca3af;text-decoration:none;">Product Photography</a></li>
          <li><a href="/explore" style="color:#9ca3af;text-decoration:none;">All Categories →</a></li>
        </ul>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Learn</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/blog" style="color:#9ca3af;text-decoration:none;">Blog</a></li>
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

function renderCategoryBody(category, prompts, allCategories) {
  const promptCards = prompts.slice(0, 60).map((p) => {
    const promptSlug = generateSlug(p.title)
    const imgSrc = p.preview_image_url || 'https://placehold.co/400x400/1a1a1a/FFDE1A?text=AI+Prompt'
    return `<article style="border:2px solid #111;border-radius:12px;overflow:hidden;background:#fff;box-shadow:3px 3px 0 #111;">
    <a href="/prompt/${esc(promptSlug)}" style="text-decoration:none;display:block;">
      <div style="aspect-ratio:1;overflow:hidden;background:#f4f4f5;">
        <img src="${esc(imgSrc)}" alt="${esc(p.title)} — ${esc(category.name)} AI image prompt" loading="lazy" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div style="padding:10px 12px;">
        <h2 style="margin:0;font-size:13px;font-weight:700;color:#111;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(p.title)}</h2>
      </div>
    </a>
  </article>`
  }).join('\n  ')

  const otherCatLinks = allCategories
    .filter((c) => c.slug !== category.slug)
    .slice(0, 12)
    .map((c) => `<li style="display:contents;"><a href="/categories/${esc(c.slug)}" style="display:block;padding:10px 16px;border:2px solid #e4e4e7;border-radius:10px;text-decoration:none;color:#111827;font-size:14px;font-weight:500;text-align:center;">${esc(c.name)}</a></li>`)
    .join('\n    ')

  const promptCountNote = prompts.length > 60
    ? `<p style="font-size:14px;color:#71717a;margin:16px 0 0;">Showing 60 of ${prompts.length} prompts. <a href="/explore?category=${encodeURIComponent(category.name)}" style="color:#2563eb;">See all in the explorer.</a></p>`
    : ''

  return `<main style="max-width:1280px;margin:0 auto;padding:0 24px 64px;font-family:sans-serif;">

  <!-- Breadcrumb -->
  <nav style="padding:20px 0 12px;font-size:14px;color:#71717a;">
    <a href="/" style="color:#71717a;text-decoration:none;">Home</a>
    <span style="margin:0 8px;">›</span>
    <a href="/explore" style="color:#71717a;text-decoration:none;">Explore</a>
    <span style="margin:0 8px;">›</span>
    <span style="color:#111827;font-weight:600;">${esc(category.name)}</span>
  </nav>

  <!-- Hero -->
  <div style="padding:32px 0 40px;border-bottom:1px solid #e4e4e7;margin-bottom:40px;">
    <div style="display:inline-block;padding:4px 14px;background:#FFDE1A;border:2px solid #111;color:#111;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;border-radius:4px;margin-bottom:16px;">${esc(category.name)}</div>
    <h1 style="font-size:44px;font-weight:900;margin:0 0 12px;line-height:1.1;letter-spacing:-1px;">${esc(category.name)} AI Image Prompts</h1>
    <p style="font-size:18px;color:#52525b;margin:0 0 16px;max-width:640px;line-height:1.6;">${esc(category.description)}</p>
    <p style="font-size:14px;color:#71717a;margin:0;">${prompts.length} prompts for Midjourney, DALL·E, Stable Diffusion, and Flux</p>
  </div>

  <!-- Prompt grid -->
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;margin-bottom:48px;">
  ${promptCards}
  </div>
  ${promptCountNote}

  <!-- What are these prompts -->
  <section style="margin:48px 0;">
    <h2 style="font-size:26px;font-weight:700;margin:0 0 14px;">What are ${esc(category.name)} AI prompts?</h2>
    <p style="font-size:16px;color:#52525b;line-height:1.75;margin:0 0 14px;">${esc(category.description)} Each prompt in this collection has been tested across AI image generators to produce strong, consistent results.</p>
    <p style="font-size:16px;color:#52525b;line-height:1.75;margin:0;">Use these prompts in Midjourney by pasting directly into the prompt field. For DALL·E, use via ChatGPT or the API. For Stable Diffusion or Flux, paste into the positive prompt field and add your negative prompts separately.</p>
  </section>

  <!-- How to use -->
  <section style="margin:0 0 48px;padding:28px;background:#f8f8f8;border-radius:16px;">
    <h2 style="font-size:22px;font-weight:700;margin:0 0 14px;">How to use these prompts</h2>
    <ol style="font-size:15px;color:#52525b;line-height:2.2;padding-left:22px;margin:0;">
      <li>Click any prompt card to open the full prompt details</li>
      <li>Copy the prompt text with one click</li>
      <li>Paste into Midjourney, DALL·E, Stable Diffusion, or Flux</li>
      <li>Swap one variable at a time — subject, lighting, or style — to explore variations</li>
    </ol>
  </section>

  <!-- Other categories -->
  <section style="margin:0 0 48px;">
    <h2 style="font-size:22px;font-weight:700;margin:0 0 16px;">Explore other categories</h2>
    <ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">
    ${otherCatLinks}
      <li style="display:contents;"><a href="/explore" style="display:block;padding:10px 16px;border:2px solid #FFDE1A;background:#FFDE1A1A;border-radius:10px;text-decoration:none;color:#111827;font-size:14px;font-weight:700;text-align:center;">All Prompts →</a></li>
    </ul>
  </section>

  <!-- Blog links -->
  <section>
    <h2 style="font-size:22px;font-weight:700;margin:0 0 14px;">From the blog</h2>
    <ul style="font-size:15px;color:#52525b;line-height:2.2;padding-left:22px;margin:0;">
      <li><a href="/blog/best-midjourney-prompts" style="color:#2563eb;">Best Midjourney Prompts: 25 Copy-Paste Templates</a></li>
      <li><a href="/blog/text-to-image-prompt-formulas" style="color:#2563eb;">Text-to-Image Prompt Formulas That Always Work</a></li>
      <li><a href="/blog/ai-photo-prompts" style="color:#2563eb;">AI Photo Prompts for Realistic Images</a></li>
      <li><a href="/blog/image-prompts-guide" style="color:#2563eb;">The Complete AI Image Prompts Guide</a></li>
    </ul>
  </section>
</main>`
}

function injectIntoShell(indexHtml, { title, description, canonical, jsonLd, body }) {
  const titleTag = `<title>${esc(title)}</title>`
  const descTag = `<meta name="description" content="${esc(description)}">`
  const canonTag = `<link rel="canonical" href="${esc(canonical)}">`
  const ogTags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(canonical)}">`,
    `<meta property="og:image" content="${SITE}/og-image.png">`,
    `<meta property="og:site_name" content="AI Image Prompts">`,
  ].join('')
  const twitterTags = [
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
    `<meta name="twitter:image" content="${SITE}/og-image.png">`,
  ].join('')
  const jsonLdTag = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`

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
// Fetch prompts per category from Supabase
// ---------------------------------------------------------------------------

async function fetchPromptsByCategory(supabase) {
  const pageSize = 1000
  const rows = []

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('prompts')
      .select('id,title,category,preview_image_url,updated_at,created_at')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.warn(`[prerender-categories] Supabase error: ${error.message}`)
      return rows
    }

    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
  }

  const byCategory = new Map()
  for (const row of rows) {
    const cat = row.category
    if (!cat) continue
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat).push(row)
  }
  return byCategory
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender-categories] Supabase env vars not found — skipping.')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')

  // Load categories from the shared JSON config
  const categoriesRaw = await readFile(join(projectRoot, 'src', 'config', 'categories.json'), 'utf8')
  const categories = JSON.parse(categoriesRaw)

  const promptsByCategory = await fetchPromptsByCategory(supabase)
  await mkdir(join(distDir, 'categories'), { recursive: true })

  let count = 0
  for (const category of categories) {
    const prompts = promptsByCategory.get(category.name) || []
    const canonical = `${SITE}/categories/${category.slug}`
    const title = `${category.name} AI Image Prompts | Better Prompts, Better Art`

    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Explore', item: `${SITE}/explore` },
          { '@type': 'ListItem', position: 3, name: category.name, item: canonical },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${category.name} AI Image Prompts`,
        description: category.description,
        url: canonical,
        numberOfItems: prompts.length,
        provider: { '@type': 'Organization', name: 'AI Image Prompts', url: SITE },
      },
    ]

    const body = renderCategoryBody(category, prompts, categories)
    const html = injectIntoShell(indexHtml, {
      title,
      description: category.description,
      canonical,
      jsonLd,
      body,
    })

    const outDir = join(distDir, 'categories', category.slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), html, 'utf8')
    count++
    console.log(`  ✓ /categories/${category.slug} (${prompts.length} prompts)`)
  }

  console.log(`[prerender-categories] ${count} category pages written.`)
}

main().catch((err) => {
  console.error('[prerender-categories] Failed:', err)
  process.exit(1)
})
