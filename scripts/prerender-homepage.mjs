/**
 * Fetches the latest published prompts from Supabase and prerenders the homepage
 * into dist/index.html so Googlebot's first-wave crawl sees a full landing page
 * with rich SEO content and links instead of a blank React SPA shell.
 *
 * Run after all other prerender scripts have finished (to keep dist/index.html
 * clean as a shell template during their runs).
 */

import { createClient } from '@supabase/supabase-js'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const SITE = 'https://www.aiimageprompts.xyz'

// ---------------------------------------------------------------------------
// Load .env.local / .env (same pattern as other prerender scripts)
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
          <li><a href="/categories/portrait" style="color:#9ca3af;text-decoration:none;">Portrait Prompts</a></li>
          <li><a href="/categories/photography" style="color:#9ca3af;text-decoration:none;">Photography Prompts</a></li>
          <li><a href="/categories/fantasy-art" style="color:#9ca3af;text-decoration:none;">Fantasy Art Prompts</a></li>
          <li><a href="/submit" style="color:#9ca3af;text-decoration:none;">Submit a Prompt</a></li>
        </ul>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Blog</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/blog" style="color:#9ca3af;text-decoration:none;">All Posts</a></li>
          <li><a href="/blog/best-midjourney-prompts" style="color:#9ca3af;text-decoration:none;">Best Midjourney Prompts</a></li>
          <li><a href="/blog/ai-photo-prompts" style="color:#9ca3af;text-decoration:none;">AI Photo Prompts</a></li>
          <li><a href="/blog/text-to-image-prompt-formulas" style="color:#9ca3af;text-decoration:none;">Prompt Formulas</a></li>
          <li><a href="/blog/image-prompts-guide" style="color:#9ca3af;text-decoration:none;">Image Prompts Guide</a></li>
        </ul>
      </div>
      <div>
        <p style="color:#fff;font-weight:600;margin:0 0 10px;">Company</p>
        <ul style="list-style:none;padding:0;margin:0;line-height:2.2;">
          <li><a href="/about" style="color:#9ca3af;text-decoration:none;">About</a></li>
          <li><a href="/faq" style="color:#9ca3af;text-decoration:none;">FAQ</a></li>
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

function injectIntoShell(indexHtml, { title, description, canonical, ogType = 'website', image, jsonLd, body }) {
  const titleTag = `<title>${esc(title)}</title>`
  const descTag = `<meta name="description" content="${esc(description)}">`
  const canonTag = `<link rel="canonical" href="${esc(canonical)}">`
  const ogTags = [
    `<meta property="og:type" content="${esc(ogType)}">`,
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
// Fetch prompts from Supabase (matches fetchFeaturedPrompts from service)
// ---------------------------------------------------------------------------

async function fetchFeaturedPrompts(limit = 10) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[prerender-homepage] Supabase env vars not found — rendering fallback prompts.')
    return []
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('prompts')
      .select('id, title, prompt, category, tags, preview_image_url, image_ratio')
      .eq('status', 'Published')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn(`[prerender-homepage] Supabase error: ${error.message}`)
      return []
    }

    return data || []
  } catch (err) {
    console.warn(`[prerender-homepage] Supabase query failed: ${err.message}`)
    return []
  }
}

// ---------------------------------------------------------------------------
// HTML render functions
// ---------------------------------------------------------------------------

function renderHero() {
  const categories = [
    { label: 'Portraits', slug: 'portrait' },
    { label: 'Anime', slug: 'anime' },
    { label: 'Logos', slug: 'logos' },
    { label: 'UI/UX', slug: 'uiux-design' },
    { label: 'Cinematic', slug: 'cinematic' }
  ]

  const categoryTags = categories.map(cat => 
    `<a href="/categories/${cat.slug}" style="display:inline-block;margin:6px 4px;padding:6px 14px;border:1px solid #e4e4e7;border-radius:9999px;font-size:14px;color:#71717a;text-decoration:none;font-weight:500;background:#fff;transition:border-color .15s,color .15s;" onmouseover="this.style.borderColor='#111';this.style.color='#111'" onmouseout="this.style.borderColor='#e4e4e7';this.style.color='#71717a'">${esc(cat.label)}</a>`
  ).join('')

  return `<section style="max-width:900px;margin:0 auto;padding:96px 24px 64px;text-align:center;font-family:sans-serif;">
  <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:#f4f4f5;border-radius:9999px;font-size:13px;font-weight:600;color:#18181b;margin-bottom:32px;">
    <span style="display:inline-block;width:6px;height:6px;background:#10b981;border-radius:50%;"></span>
    Loved by 15,000+ creators
  </div>

  <h1 style="font-size:72px;font-weight:900;line-height:0.95;margin:0 0 24px;text-transform:uppercase;letter-spacing:-1px;color:#111827;">
    Better Prompts<br><span style="background:linear-gradient(to right,#FFDE1A,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Better Art</span>
  </h1>

  <p style="font-size:20px;color:#52525b;max-width:600px;margin:0 auto 40px;line-height:1.6;">
    Master the art of AI generation. Thousands of pro-level prompts ready for your next masterpiece.
  </p>

  <div style="max-width:600px;margin:0 auto 24px;position:relative;display:flex;align-items:center;border:2px solid #111;border-radius:9999px;background:#fff;padding:8px 8px 8px 24px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);">
    <span style="color:#9ca3af;font-size:16px;flex-grow:1;text-align:left;user-select:none;">Search for 'cyberpunk city' or 'watercolor cat'...</span>
    <a href="/explore" style="display:inline-block;padding:12px 28px;background:#FFDE1A;color:#111;font-weight:700;text-decoration:none;border-radius:9999px;border:2px solid #111;font-size:15px;box-shadow:2px 2px 0 0 rgba(0,0,0,1);">Explore</a>
  </div>

  <div style="margin-top:16px;">
    ${categoryTags}
  </div>
</section>`
}

function renderFeaturedPrompts(prompts) {
  if (prompts.length === 0) return ''

  const cards = prompts.map(p => {
    const slug = generateSlug(p.title)
    const previewUrl = p.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'
    const cleanCategory = p.category || 'AI Prompt'

    return `<div style="display:flex;flex-direction:column;border:2px solid #111;border-radius:12px;overflow:hidden;background:#fff;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);transition:transform .2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="position:relative;background:#f4f4f5;aspect-ratio:4/3;overflow:hidden;border-bottom:2px solid #111;">
        <img src="${esc(previewUrl)}" alt="AI ${esc(cleanCategory)} Prompt: ${esc(p.title)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
        <span style="position:absolute;top:12px;left:12px;background:#FFDE1A;border:2px solid #111;color:#111;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 8px;border-radius:4px;box-shadow:1.5px 1.5px 0 0 rgba(0,0,0,1);">${esc(cleanCategory)}</span>
      </div>
      <div style="padding:16px;flex-grow:1;display:flex;flex-direction:column;">
        <h3 style="margin:0 0 10px;font-size:18px;font-weight:700;line-height:1.3;color:#111827;">${esc(p.title)}</h3>
        <div style="border-left:3px solid #FFDE1A;padding-left:12px;margin-bottom:16px;flex-grow:1;">
          <p style="margin:0;font-size:13px;font-family:monospace;color:#52525b;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6;word-break:break-all;">${esc(p.prompt)}</p>
        </div>
        <div style="display:flex;gap:10px;border-top:1px solid #e4e4e7;padding-top:14px;margin-top:auto;">
          <a href="/prompt/${slug}" style="flex-grow:1;display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;background:#fff;border:2px solid #111;color:#111;font-weight:700;font-size:13px;text-decoration:none;border-radius:6px;box-shadow:2px 2px 0 0 rgba(0,0,0,1);">Copy Prompt</a>
          <a href="/prompt/${slug}" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:38px;background:#fff;border:2px solid #111;border-radius:6px;text-decoration:none;box-shadow:2px 2px 0 0 rgba(0,0,0,1);color:#111;">➔</a>
        </div>
      </div>
    </div>`
  }).join('\n    ')

  return `<section style="max-width:1200px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <div style="margin-bottom:48px;">
    <span style="color:#f59e0b;font-family:monospace;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">// Recently added</span>
    <h2 style="font-size:40px;font-weight:900;margin:10px 0 12px;letter-spacing:-0.5px;">Latest Prompt Creations</h2>
    <p style="margin:0;font-size:18px;color:#52525b;">New publishes from our community catalog — copy and run immediately.</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:32px;">
    ${cards}
  </div>

  <div style="text-align:center;margin-top:48px;">
    <a href="/explore" style="display:inline-block;padding:14px 32px;border:2px solid #111;border-radius:9999px;font-weight:700;color:#111;text-decoration:none;box-shadow:3px 3px 0 0 rgba(0,0,0,1);background:#fff;transition:background-color .15s;" onmouseover="this.style.backgroundColor='#f4f4f5'" onmouseout="this.style.backgroundColor='#fff'">View All Prompt Templates</a>
  </div>
</section>`
}

function renderSEOContent() {
  return `<section style="background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:96px 24px;font-family:sans-serif;">
  <div style="max-width:800px;margin:0 auto;line-height:1.75;color:#374151;">
    
    <article style="margin-bottom:48px;">
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">What Are AI Image Prompts?</h2>
      <p style="font-size:17px;margin-bottom:16px;">
        AI image prompts are detailed text instructions that guide artificial intelligence models to generate specific visual outputs. Whether you need <a href="/explore?category=Photography" style="color:#f59e0b;font-weight:700;text-decoration:none;">photorealistic portrait prompts</a>, design-focused logo briefs, or custom UI/UX mockups, the prompt is how you direct the model's canvas.
      </p>
      <p style="font-size:17px;">
        The difference between amateur output and professional generated art is prompt engineering. Curated, high-quality prompt formulas save hours of trial and error, enabling creators to build consistent, production-ready visuals for blogs, social campaigns, and websites.
      </p>
    </article>

    <article style="margin-bottom:48px;">
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">How to Write Better Prompts</h2>
      <p style="font-size:17px;margin-bottom:16px;">
        Great prompt templates use a structured formula combining subject, environment, lighting, medium, and aesthetic modifiers. Here are four foundational prompt rules:
      </p>
      <ul style="font-size:17px;padding-left:24px;margin-bottom:20px;line-height:2;">
        <li><strong>Be descriptive:</strong> Instead of "a car," describe the make, environment, and era: "a vintage 1969 muscle car parked in a neon-lit cyberpunk street."</li>
        <li><strong>Incorporate lighting:</strong> Lighting dictates visual quality. Include descriptors like <em>cinematic backlight</em>, <em>golden hour glare</em>, or <em>soft volumetric fog</em>.</li>
        <li><strong>Specify the medium:</strong> Tell the AI if you want a 3D render, watercolor painting, vector illustration, or a high-shutter photo.</li>
        <li><strong>Apply negative prompts:</strong> Use negative keywords to filter out artifacts, deformed faces, text overlays, and noise.</li>
      </ul>
    </article>

    <article>
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">Best AI Generators for Prompting</h2>
      <p style="font-size:17px;margin-bottom:24px;">
        Each image generation model excels at different visual disciplines. Pick the right generator for your prompt style:
      </p>
      
      <div style="margin-bottom:16px;">
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">Midjourney</h3>
        <p style="font-size:16px;margin:0;">The industry standard for cinematic art, photorealism, and style transfer. Responds well to detailed artistic references and camera commands.</p>
      </div>
      
      <div style="margin-bottom:16px;">
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">DALL·E 3</h3>
        <p style="font-size:16px;margin:0;">Ideal for high-fidelity prompt compliance. If your prompt includes complex positional setups or exact text inside the image, DALL-E (via ChatGPT) is the best choice.</p>
      </div>
      
      <div>
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">Stable Diffusion / Flux</h3>
        <p style="font-size:16px;margin:0;">Perfect for open-source customization, control nets, and photorealistic skin rendering. SD XL and Flux offer extreme flexibility for developers and custom models.</p>
      </div>
    </article>

  </div>
</section>`
}

function renderSubmitCTA() {
  return `<section style="max-width:900px;margin:80px auto;padding:64px 24px;text-align:center;font-family:sans-serif;">
  <div style="background:#fff;border:3px solid #111;border-radius:24px;padding:48px 32px;box-shadow:8px 8px 0 0 rgba(0,0,0,1);">
    <h2 style="font-size:36px;font-weight:900;margin:0 0 16px;letter-spacing:-0.5px;">Have an amazing prompt formula?</h2>
    <p style="font-size:18px;color:#52525b;max-width:550px;margin:0 auto 32px;line-height:1.6;">
      Share your best image prompt designs with the community. Approved prompts get featured in our catalog with proper creator attribution.
    </p>
    <a href="/submit" style="display:inline-block;padding:14px 36px;background:#FFDE1A;color:#111;border:2px solid #111;font-weight:700;text-decoration:none;border-radius:9999px;font-size:16px;box-shadow:3px 3px 0 0 rgba(0,0,0,1);">Submit a Prompt</a>
  </div>
</section>`
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

async function main() {
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')
  
  // Verify if indexHtml is indeed a clean template (has <div id="root"></div>)
  if (!indexHtml.includes('<div id="root"></div>')) {
    console.error('[prerender-homepage] Template index.html is missing <div id="root"></div>. Make sure prerender-homepage runs after clean build but before other files overwrite it, OR restore clean index.html.')
    process.exit(1)
  }

  const prompts = await fetchFeaturedPrompts(10)
  console.log(`[prerender-homepage] Fetched ${prompts.length} prompts to display on homepage.`)

  const body = [
    renderHero(),
    renderFeaturedPrompts(prompts),
    renderSEOContent(),
    renderSubmitCTA()
  ].join('\n')

  const title = 'AI Image Prompts Library | Better Prompts, Better Art'
  const description = 'Explore AI image prompts, AI photo prompts, and prompt ideas for Midjourney, DALL-E, and Stable Diffusion. Browse free prompts for better generated art.'

  const page = {
    title,
    description,
    canonical: SITE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Image Prompts',
      url: SITE,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/explore?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    body
  }

  const html = injectIntoShell(indexHtml, page)
  await writeFile(join(distDir, 'index.html'), html, 'utf8')
  console.log('[prerender-homepage] Homepage pre-rendering successfully wrote to dist/index.html')
}

main().catch((err) => {
  console.error('[prerender-homepage] Failed to prerender homepage:', err)
  process.exit(1)
})
