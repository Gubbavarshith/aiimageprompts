export const SITE = 'https://www.aiimageprompts.xyz'

export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function generateSlug(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function nav() {
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

export function footer() {
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

export function injectIntoShell(indexHtml, { title, description, canonical, ogType = 'website', image, jsonLd, body }) {
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

  // Strip the base template's SEO tags so we never end up with duplicates
  // (e.g. two <link rel="canonical">, or homepage og:title on a prompt page).
  // The base index.html owns the homepage values; per-page values replace them.
  out = out
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')

  // Replace the <title>, then inject one clean set of per-page SEO tags.
  out = out.replace(/<title>[\s\S]*?<\/title>/i, titleTag)
  out = out.replace(
    '</head>',
    `${descTag}${canonTag}${ogTags}${twitterTags}${jsonLdTag}</head>`,
  )

  out = out.replace('<div id="root"></div>', `<div id="root">${nav()}${body}${footer()}</div>`)
  return out
}
