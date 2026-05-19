/**
 * Prerender static pages into dist/ so Googlebot's first-wave crawl sees real
 * HTML content instead of an empty React SPA shell.
 *
 * Covers: /explore, /about, /faq, /contact, /submit, /guidelines,
 *         /terms, /privacy, /cookies, /refund, /donate
 *
 * Run after `vite build` and before `generate-sitemaps.mjs`.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const SITE = 'https://www.aiimageprompts.xyz'

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
// Page body renderers
// ---------------------------------------------------------------------------

const CATEGORIES = [
  ['Portrait', 'portrait'],
  ['Photography', 'photography'],
  ['Fantasy Art', 'fantasy-art'],
  ['Product Photography', 'product-photography'],
  ['Product Marketing', 'product-marketing'],
  ['Lifestyle', 'lifestyle'],
  ['Fashion Portrait', 'fashion-portrait'],
  ['Interior Design', 'interior-design'],
  ['Poster', 'poster'],
  ['3D Graphics', '3d-graphics'],
  ['Gaming', 'gaming'],
  ['Pixel Art', 'pixel-art'],
  ['Conceptual Portrait', 'conceptual-portrait'],
  ['Chibi', 'chibi'],
  ['Coloring Page', 'coloring-page'],
  ['Graphics', 'graphics'],
  ['Home Decor', 'home-decor'],
  ['Animals Portrait', 'animals-portrait'],
  ['Ad', 'ad'],
  ['Crafts', 'crafts'],
  ['Capsule', 'capsule'],
  ['Accidental Selfie', 'accidental-selfie'],
  ['UI/UX Design', 'uiux-design'],
  ['Web Development', 'web-development'],
]

function explorePage() {
  const catLinks = CATEGORIES.map(([label, slug]) =>
    `<li style="display:contents;"><a href="/categories/${slug}" style="display:block;padding:14px 18px;border:1px solid #e4e4e7;border-radius:10px;text-decoration:none;color:#111827;font-weight:500;font-size:15px;transition:border-color .15s;" onmouseover="this.style.borderColor='#FFDE1A'" onmouseout="this.style.borderColor='#e4e4e7'">${esc(label)}</a></li>`
  ).join('\n    ')

  return `<main style="max-width:1200px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:52px;font-weight:900;margin:0 0 16px;line-height:1.1;letter-spacing:-1px;">Explore AI Image Prompts</h1>
  <p style="font-size:20px;color:#52525b;margin:0 0 48px;max-width:640px;line-height:1.6;">Browse 1,000+ curated prompts for Midjourney, DALL·E, Stable Diffusion, and Flux. Copy any prompt and paste it directly into your AI image generator.</p>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 20px;">Browse by Category</h2>
    <ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin:0;">
    ${catLinks}
    </ul>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">What are AI Image Prompts?</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">AI image prompts are structured text descriptions that guide AI generators to create specific images. A well-crafted prompt describes the subject, style, lighting, composition, and mood of the desired image — instead of relying on vague instructions that produce generic results.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">Our library contains professionally crafted prompts tuned for creative control. Each prompt has been tested across models so it produces strong, consistent results you can build on.</p>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">How to Use These Prompts</h2>
    <ol style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Browse by category or search for a specific style or subject</li>
      <li>Click any prompt card to see the full prompt and details</li>
      <li>Copy the prompt with one click</li>
      <li>Paste into Midjourney, DALL·E, Stable Diffusion, or Flux</li>
      <li>Iterate: swap one variable at a time (subject, lighting, style) to explore variations</li>
    </ol>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">Supported AI Image Generators</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Midjourney</strong> — Industry-leading artistic quality; our prompts include aspect ratio flags</li>
      <li><strong>DALL·E 3</strong> — Strong instruction-following; ideal for product and commercial imagery</li>
      <li><strong>Stable Diffusion</strong> — Open-source with maximum control; prompts include negative prompt guidance</li>
      <li><strong>Flux</strong> — Fast, photorealistic results with excellent text rendering</li>
    </ul>
  </section>

  <section>
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">From the Blog</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><a href="/blog/best-midjourney-prompts" style="color:#2563eb;">Best Midjourney Prompts: 25 Copy-Paste Templates</a></li>
      <li><a href="/blog/text-to-image-prompt-formulas" style="color:#2563eb;">Text-to-Image Prompt Formulas That Always Work</a></li>
      <li><a href="/blog/ai-photo-prompts" style="color:#2563eb;">AI Photo Prompts for Realistic Images</a></li>
      <li><a href="/blog/image-prompts-guide" style="color:#2563eb;">The Complete AI Image Prompts Guide</a></li>
    </ul>
  </section>
</main>`
}

function aboutPage() {
  return `<main style="max-width:900px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:52px;font-weight:900;margin:0 0 20px;line-height:1.1;">Better Prompts, Better Art</h1>
  <p style="font-size:20px;color:#52525b;line-height:1.6;margin:0 0 48px;">A curated playground for AI image model prompts — built for people who care about craft, not copy-pasted boilerplate.</p>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">Our Story</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">AI Image Prompts started as a personal collection of prompts from late-night creative experiments, client work, and visual explorations. Over time it became clear that most people weren't struggling with the AI models — they were struggling with language.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">The same vague, generic prompts produced the same vague, generic images. This library exists to fix that: an evolving collection of prompts that feel intentional, directional, and actually fun to build on.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">We'd rather have 100 sharp, reusable prompts than 10,000 noisy ones that all look the same.</p>
  </section>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">What We Care About</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Quality over volume</strong> — every prompt is edited, not generated in bulk</li>
      <li><strong>Accessible craft</strong> — you shouldn't need a design degree to make great images</li>
      <li><strong>Ethical use</strong> — no harmful, hateful, or exploitative content</li>
      <li><strong>Community-first</strong> — real feedback from designers, artists, and founders shapes the library</li>
      <li><strong>Future-friendly</strong> — as models evolve, we update prompts to keep them working</li>
    </ul>
  </section>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">The Numbers</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>10,000+</strong> curated prompt variations tested across AI models</li>
      <li><strong>50K+</strong> monthly prompt runs across tools</li>
      <li><strong>15+</strong> image models tested and tuned against</li>
      <li><strong>24/7</strong> global experimentation from the community</li>
    </ul>
  </section>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">Frequently Asked Questions</h2>
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:20px;margin-bottom:20px;">
      <h3 style="font-size:18px;font-weight:600;margin:0 0 8px;">Can I use these prompts for client work?</h3>
      <p style="font-size:16px;color:#52525b;margin:0;line-height:1.6;">Yes. You're free to adapt these prompts for client projects, brand work, and commercial use — just make sure your usage aligns with the terms of the AI models you're using.</p>
    </div>
    <div style="border-bottom:1px solid #e4e4e7;padding-bottom:20px;margin-bottom:20px;">
      <h3 style="font-size:18px;font-weight:600;margin:0 0 8px;">Will prompts become obsolete as models improve?</h3>
      <p style="font-size:16px;color:#52525b;margin:0;line-height:1.6;">Models change, but direction, taste, and language always matter. We treat prompts as creative scaffolding, not fragile hacks — and we update the library as models evolve.</p>
    </div>
    <div>
      <h3 style="font-size:18px;font-weight:600;margin:0 0 8px;">How can I suggest improvements?</h3>
      <p style="font-size:16px;color:#52525b;margin:0;line-height:1.6;">Use the <a href="/contact" style="color:#2563eb;">Contact page</a> to share your edits or feedback on any prompt in the library.</p>
    </div>
  </section>

  <div style="text-align:center;padding:32px;background:#f4f4f5;border-radius:16px;">
    <h2 style="font-size:28px;font-weight:900;margin:0 0 12px;">Ready to explore the library?</h2>
    <p style="font-size:17px;color:#52525b;margin:0 0 24px;">Browse 1,000+ curated prompts and start making better images today.</p>
    <a href="/explore" style="display:inline-block;padding:14px 32px;background:#FFDE1A;color:#111827;font-weight:700;font-size:16px;border-radius:9999px;text-decoration:none;">Explore Prompts</a>
  </div>
</main>`
}

function faqPage(faqContent) {
  // Parse the markdown FAQ content into sections
  const lines = faqContent.split('\n')
  const sections = []
  let currentCategory = ''
  let currentQ = ''
  let currentA = []

  const flush = () => {
    if (currentQ && currentA.length) {
      sections.push({ cat: currentCategory, q: currentQ, a: currentA.join('\n').trim() })
      currentQ = ''
      currentA = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('# ')) {
      flush()
      currentCategory = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      flush()
      currentQ = line.slice(3).trim()
    } else if (currentQ) {
      currentA.push(line)
    }
  }
  flush()

  // Group by category
  const catMap = new Map()
  for (const item of sections) {
    if (!catMap.has(item.cat)) catMap.set(item.cat, [])
    catMap.get(item.cat).push(item)
  }

  const faqHtml = Array.from(catMap.entries()).map(([cat, items]) => {
    const qs = items.map(({ q, a }) => `
    <div style="border-bottom:1px solid #e4e4e7;padding:20px 0;">
      <h3 style="font-size:17px;font-weight:600;margin:0 0 8px;color:#111827;">${esc(q)}</h3>
      <p style="font-size:15px;color:#52525b;margin:0;line-height:1.7;">${esc(a).replace(/\n/g, '<br>')}</p>
    </div>`).join('')
    return `
  <section style="margin-bottom:48px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid #FFDE1A;">${esc(cat)}</h2>
    ${qs}
  </section>`
  }).join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return { body: `<main style="max-width:900px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Frequently Asked Questions</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 48px;line-height:1.6;">Everything you need to know about using AI image prompts — from getting started to advanced techniques.</p>
  ${faqHtml}
  <div style="margin-top:48px;padding:28px;background:#f4f4f5;border-radius:12px;">
    <p style="font-size:17px;font-weight:700;margin:0 0 8px;">Still have questions?</p>
    <p style="font-size:15px;color:#52525b;margin:0;line-height:1.6;">Reach out via the <a href="/contact" style="color:#2563eb;">Contact page</a> or explore the <a href="/blog" style="color:#2563eb;">blog</a> for in-depth guides.</p>
  </div>
</main>`, jsonLd }
}

function contactPage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Contact Us</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Have feedback on a prompt, a suggestion for the library, or a question about the platform? We'd love to hear from you.</p>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">What you can contact us about</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Prompt quality issues or improvement suggestions</li>
      <li>Feature requests for the prompt library</li>
      <li>Partnership or collaboration inquiries</li>
      <li>Press and media inquiries</li>
      <li>General feedback about the platform</li>
    </ul>
  </section>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Before reaching out</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 12px;">Check the <a href="/faq" style="color:#2563eb;">FAQ</a> — most common questions are answered there.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">If you want to contribute prompts, use the <a href="/submit" style="color:#2563eb;">Submit page</a> instead.</p>
  </section>
</main>`
}

function submitPage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Submit a Prompt</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Share your best AI image prompts with the community. The strongest submissions get curated into the public library.</p>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">What makes a great submission?</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Original</strong> — not a copy-paste from another source</li>
      <li><strong>Specific</strong> — clear subject, style, lighting, and composition direction</li>
      <li><strong>Reusable</strong> — works as a template that others can adapt</li>
      <li><strong>Tested</strong> — you've actually run this in at least one AI image generator</li>
    </ul>
  </section>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Which models should prompts work with?</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">Prompts that work across multiple generators (Midjourney, DALL·E, Stable Diffusion, Flux) are preferred. Single-model prompts can still be submitted — just note which model you tested on.</p>
  </section>

  <section>
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Prompt guidelines</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 12px;">Read the <a href="/guidelines" style="color:#2563eb;">community guidelines</a> before submitting. Prompts that generate harmful, hateful, or deceptive content will not be accepted.</p>
  </section>
</main>`
}

function guidelinesPage() {
  return `<main style="max-width:800px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Community Guidelines</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Rules and standards for contributing to and using the AI Image Prompts library.</p>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Content standards</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 12px;">All prompts submitted to the library must meet these standards:</p>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>No prompts designed to generate real people without consent</li>
      <li>No NSFW, adult, violent, or hateful content</li>
      <li>No prompts that infringe on known copyrights or trademarks</li>
      <li>No misleading or deceptive imagery prompts (e.g., fake news visuals)</li>
    </ul>
  </section>

  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Usage terms</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Prompts can be used freely for personal and commercial projects</li>
      <li>Credit is appreciated but not required</li>
      <li>Do not redistribute the entire library as your own product</li>
    </ul>
  </section>

  <section>
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Moderation</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">All submitted prompts are reviewed before being added to the public library. We reserve the right to reject or remove any submission at our discretion. See the full <a href="/terms" style="color:#2563eb;">Terms of Service</a> for details.</p>
  </section>
</main>`
}

function legalPage(title, description, content) {
  return `<main style="max-width:800px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:40px;font-weight:900;margin:0 0 16px;line-height:1.1;">${esc(title)}</h1>
  <p style="font-size:17px;color:#52525b;margin:0 0 32px;line-height:1.6;">${esc(description)}</p>
  <div style="font-size:16px;color:#52525b;line-height:1.75;">${content}</div>
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid #e4e4e7;font-size:14px;color:#71717a;">
    <p>Questions? <a href="/contact" style="color:#2563eb;">Contact us</a>.</p>
  </div>
</main>`
}

function donatePage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Support AI Image Prompts</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">If the library has helped your creative work, consider supporting it so we can keep adding and improving prompts.</p>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Why support?</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Keeps the core library free for everyone</li>
      <li>Funds testing prompts across new models as they launch</li>
      <li>Supports content creation for the <a href="/blog" style="color:#2563eb;">blog</a></li>
    </ul>
  </section>
  <p style="font-size:17px;color:#52525b;line-height:1.75;">Alternatively, the best way to support is to <a href="/submit" style="color:#2563eb;">submit a great prompt</a> or share the library with someone who'd find it useful.</p>
</main>`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')
  const faqRaw = await readFile(join(projectRoot, 'src', 'content', 'FAQ-content.md'), 'utf8')
  const { body: faqBody, jsonLd: faqJsonLd } = faqPage(faqRaw)

  const pages = [
    {
      route: 'explore',
      title: 'Explore AI Image Prompts — Browse 1,000+ Prompts by Category',
      description: 'Browse 1,000+ curated AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux. Filter by category, style, and mood to find the perfect prompt.',
      canonical: `${SITE}/explore`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'AI Image Prompts Library',
        description: 'Curated AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.',
        url: `${SITE}/explore`,
        provider: { '@type': 'Organization', name: 'AI Image Prompts', url: SITE },
      },
      body: explorePage(),
    },
    {
      route: 'about',
      title: 'About AI Image Prompts | Better Prompts, Better Art',
      description: 'Learn about AI Image Prompts — a curated library of AI image prompts for designers, marketers, and creators who care about craft over boilerplate.',
      canonical: `${SITE}/about`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About AI Image Prompts',
        url: `${SITE}/about`,
        description: 'Our story and mission',
      },
      body: aboutPage(),
    },
    {
      route: 'faq',
      title: 'AI Image Prompts FAQ | Frequently Asked Questions',
      description: 'Answers to common questions about AI image prompts — which models they work with, how to write better prompts, troubleshooting, and commercial usage.',
      canonical: `${SITE}/faq`,
      jsonLd: faqJsonLd,
      body: faqBody,
    },
    {
      route: 'contact',
      title: 'Contact AI Image Prompts | Get in Touch',
      description: 'Contact AI Image Prompts with feedback, suggestions, partnership inquiries, or general questions about the prompt library.',
      canonical: `${SITE}/contact`,
      body: contactPage(),
    },
    {
      route: 'submit',
      title: 'Submit an AI Image Prompt | Contribute to the Library',
      description: 'Submit your best AI image prompts to the community library. Share original, tested prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.',
      canonical: `${SITE}/submit`,
      body: submitPage(),
    },
    {
      route: 'guidelines',
      title: 'Community Guidelines | AI Image Prompts',
      description: 'Content standards and usage rules for the AI Image Prompts library. What you can submit, what is not allowed, and how moderation works.',
      canonical: `${SITE}/guidelines`,
      body: guidelinesPage(),
    },
    {
      route: 'terms',
      title: 'Terms of Service | AI Image Prompts',
      description: 'Terms of service for using the AI Image Prompts library and website.',
      canonical: `${SITE}/terms`,
      body: legalPage('Terms of Service', 'By using AI Image Prompts you agree to these terms.', '<p>Full terms are available on this page. Visit <a href="/about" style="color:#2563eb;">About</a> to learn more about our platform, or <a href="/contact" style="color:#2563eb;">Contact us</a> with questions.</p>'),
    },
    {
      route: 'privacy',
      title: 'Privacy Policy | AI Image Prompts',
      description: 'Privacy policy for AI Image Prompts — how we collect, use, and protect your data.',
      canonical: `${SITE}/privacy`,
      body: legalPage('Privacy Policy', 'We respect your privacy. This policy explains how AI Image Prompts handles your data.', '<p>We collect minimal data necessary to operate the service. We do not sell your personal information. For questions, <a href="/contact" style="color:#2563eb;">contact us</a>.</p>'),
    },
    {
      route: 'cookies',
      title: 'Cookie Policy | AI Image Prompts',
      description: 'Cookie policy for AI Image Prompts — what cookies we use and how to manage them.',
      canonical: `${SITE}/cookies`,
      body: legalPage('Cookie Policy', 'We use cookies to improve your experience on AI Image Prompts.', '<p>We use essential cookies for site functionality and optional analytics cookies to understand usage. You can manage cookie preferences in your browser settings.</p>'),
    },
    {
      route: 'refund',
      title: 'Refund Policy | AI Image Prompts',
      description: 'Refund policy for AI Image Prompts — our approach to refunds for any paid features.',
      canonical: `${SITE}/refund`,
      body: legalPage('Refund Policy', 'Our refund policy for AI Image Prompts paid features.', '<p>The core prompt library is free. For any paid features or subscriptions, contact us within 14 days of purchase for a refund. See <a href="/terms" style="color:#2563eb;">Terms of Service</a> for full details.</p>'),
    },
    {
      route: 'donate',
      title: 'Support AI Image Prompts | Donate',
      description: 'Support the AI Image Prompts library and help keep it free for everyone.',
      canonical: `${SITE}/donate`,
      body: donatePage(),
    },
  ]

  for (const page of pages) {
    const outDir = join(distDir, page.route)
    await mkdir(outDir, { recursive: true })
    const html = injectIntoShell(indexHtml, page)
    await writeFile(join(outDir, 'index.html'), html, 'utf8')
    console.log(`  ✓ /${page.route}`)
  }

  console.log(`Static prerender complete — ${pages.length} pages written.`)
}

main().catch((err) => {
  console.error('Static prerender failed:', err)
  process.exit(1)
})
