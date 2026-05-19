import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked, Renderer } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const distDir = join(projectRoot, 'dist')
const contentDir = join(projectRoot, 'src', 'content', 'blog')
const publicManifestPath = join(projectRoot, 'public', 'blog-manifest.json')
const distManifestPath = join(distDir, 'blog-manifest.json')

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateAnchorId(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function addAnchorIdsToContent(html) {
  return html.replace(/<h([2-4])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi, (match, level, existingId, text) => {
    if (existingId) return match
    const id = generateAnchorId(String(text))
    return id ? `<h${level} id="${id}">${text}</h${level}>` : match
  })
}

/** Mirrors src/lib/blogMarkdown.ts — keep markup in sync when changing prompt cards. */
function wrapPromptBlock(preHtml) {
  return `<div class="blog-prompt-block">
  <div class="blog-prompt-block__toolbar" role="group" aria-label="Prompt actions">
    <span class="blog-prompt-block__label">Image prompt</span>
    <button type="button" class="blog-prompt-copy-btn" aria-label="Copy image prompt to clipboard">
      <svg class="blog-prompt-copy-btn__icon blog-prompt-copy-btn__icon--copy" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path></svg>
      <svg class="blog-prompt-copy-btn__icon blog-prompt-copy-btn__icon--check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
      <span class="blog-prompt-copy-btn__text">Copy</span>
    </button>
  </div>
  <div class="blog-prompt-block__body">${preHtml}</div>
</div>`
}

function markdownToBlogHtml(content, { wrapPromptBlocks }) {
  const renderer = new Renderer()
  const defaultCode = Renderer.prototype.code
  renderer.code = function (token) {
    const innerHtml = defaultCode.call(this, token)
    const lang = (token.lang || '').trim().toLowerCase()
    if (wrapPromptBlocks && lang === 'text') {
      return wrapPromptBlock(innerHtml)
    }
    return innerHtml
  }
  const raw = marked.parse(content, { async: false, renderer })
  return typeof raw === 'string' ? raw : ''
}

function renderSiteNav() {
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

function renderSiteFooter() {
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

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function calculateReadTime(html) {
  const words = stripHtml(html).split(' ').filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

async function getMarkdownFiles() {
  const { readdir } = await import('node:fs/promises')
  const files = await readdir(contentDir)
  return files.filter((file) => file.endsWith('.md') && !file.startsWith('_'))
}

async function readPosts() {
  const files = await getMarkdownFiles()
  const posts = []

  for (const file of files) {
    const fullPath = join(contentDir, file)
    const raw = await readFile(fullPath, 'utf8')
    const { data, content } = matter(raw)
    const slug = normalizeSlug(String(data.slug || file.replace(/\.md$/, '')))
    const title = String(data.title || '').trim()
    const date = String(data.date || '').trim()
    const status = String(data.status || 'Published')

    if (!title || !slug || !date) continue

    const category = String(data.category || 'News')
    const wrapPromptBlocks = category !== 'News'
    const html = addAnchorIdsToContent(markdownToBlogHtml(content, { wrapPromptBlocks }))
    const excerpt = String(data.excerpt || '').trim()
    const post = {
      id: slug,
      slug,
      title,
      date,
      status,
      excerpt,
      content: html,
      author: String(data.author || 'Editorial'),
      category,
      imageUrl: String(data.imageUrl || ''),
      tags: Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === 'string') : [],
      metaTitle: String(data.metaTitle || '').trim(),
      metaDescription: String(data.metaDescription || '').trim(),
      showToc: Boolean(data.showToc),
      readTime: calculateReadTime(html),
    }
    posts.push(post)
  }

  return posts
    .filter((post) => post.status === 'Published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function injectHtmlShell(indexHtml, payload) {
  const titleTag = `<title>${escapeHtml(payload.title)}</title>`
  const descriptionTag = `<meta name="description" content="${escapeHtml(payload.description)}">`
  const canonicalTag = `<link rel="canonical" href="${escapeHtml(payload.canonical)}">`
  const ogTags = [
    `<meta property="og:type" content="${escapeHtml(payload.ogType || 'website')}">`,
    `<meta property="og:title" content="${escapeHtml(payload.title)}">`,
    `<meta property="og:description" content="${escapeHtml(payload.description)}">`,
    `<meta property="og:url" content="${escapeHtml(payload.canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(payload.image || 'https://www.aiimageprompts.xyz/og-image.png')}">`,
  ].join('')
  const twitterTags = [
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(payload.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(payload.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(payload.image || 'https://www.aiimageprompts.xyz/og-image.png')}">`,
  ].join('')
  const jsonLdTag = payload.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(payload.jsonLd)}</script>`
    : ''

  let output = indexHtml
  output = output.replace(/<title>[\s\S]*?<\/title>/i, titleTag)
  if (/<meta name="description"[^>]*>/i.test(output)) {
    output = output.replace(/<meta name="description"[^>]*>/i, descriptionTag)
  } else {
    output = output.replace('</head>', `${descriptionTag}${canonicalTag}${ogTags}${twitterTags}${jsonLdTag}</head>`)
  }

  if (!output.includes(canonicalTag)) {
    output = output.replace('</head>', `${canonicalTag}${ogTags}${twitterTags}${jsonLdTag}</head>`)
  }

  output = output.replace('<div id="root"></div>', `<div id="root">${renderSiteNav()}${payload.body}${renderSiteFooter()}</div>`)
  return output
}

function renderBlogList(posts) {
  const cards = posts.map((post) => `
    <article style="border:1px solid #e4e4e7;border-radius:16px;padding:24px;margin-bottom:20px;background:#fff;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${escapeHtml(post.category)} • ${escapeHtml(post.date)}</p>
      <h2 style="margin:0 0 12px;font-size:24px;line-height:1.2;font-weight:700;"><a href="/blog/${escapeHtml(post.slug)}" style="color:#111827;text-decoration:none;">${escapeHtml(post.title)}</a></h2>
      <p style="margin:0;color:#52525b;line-height:1.6;">${escapeHtml(post.excerpt)}</p>
    </article>
  `).join('')

  return `
    <main style="max-width:840px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
      <h1 style="font-size:48px;line-height:1.05;margin:0 0 8px;font-weight:900;font-family:sans-serif;">AI Image Prompts Blog</h1>
      <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Guides, techniques, and prompt formulas for Midjourney, DALL·E, Stable Diffusion, and Flux.</p>
      ${cards}
    </main>
  `
}

function renderBlogPost(post) {
  return `
    <main style="max-width:840px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${escapeHtml(post.category)} • ${escapeHtml(post.date)}</p>
      <h1 style="font-size:48px;line-height:1.05;margin:0 0 12px;font-weight:900;">${escapeHtml(post.title)}</h1>
      <p style="margin:0 0 32px;color:#52525b;font-size:15px;">By ${escapeHtml(post.author)} · ${escapeHtml(post.readTime)}</p>
      ${post.excerpt ? `<p style="font-size:20px;line-height:1.6;color:#18181b;border-left:4px solid #FFDE1A;padding-left:20px;margin:0 0 40px;">${escapeHtml(post.excerpt)}</p>` : ''}
      <article style="font-size:17px;line-height:1.8;color:#3f3f46;">${post.content}</article>
      <div style="margin-top:48px;padding:24px;background:#f4f4f5;border-radius:12px;">
        <p style="margin:0 0 8px;font-weight:700;font-size:15px;">Explore more AI image prompts</p>
        <ul style="margin:0;padding-left:20px;line-height:2;">
          <li><a href="/explore" style="color:#2563eb;">Browse 1,000+ prompts by category</a></li>
          <li><a href="/blog" style="color:#2563eb;">Read more guides and tutorials</a></li>
          <li><a href="/submit" style="color:#2563eb;">Submit your own prompts</a></li>
        </ul>
      </div>
    </main>
  `
}

async function main() {
  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8')
  const posts = await readPosts()

  const manifest = {
    generatedAt: new Date().toISOString(),
    posts: posts.map((post) => ({
      slug: post.slug,
      date: post.date,
      status: post.status,
    })),
  }

  await mkdir(join(distDir, 'blog'), { recursive: true })

  const blogListHtml = injectHtmlShell(indexHtml, {
    title: 'AI Image Prompts Blog | Photo Prompts, Guides & Ideas',
    description: 'Read AI image prompt guides, AI photo prompts, Midjourney prompt ideas, and practical text-to-image techniques for better generated art.',
    canonical: 'https://www.aiimageprompts.xyz/blog',
    ogType: 'website',
    body: renderBlogList(posts),
  })
  await writeFile(join(distDir, 'blog', 'index.html'), blogListHtml, 'utf8')

  for (const post of posts) {
    const outDir = join(distDir, 'blog', post.slug)
    await mkdir(outDir, { recursive: true })

    const seoTitle = post.metaTitle || `${post.title} | Better Prompts, Better Art`
    const seoDescription = post.metaDescription || post.excerpt || stripHtml(post.content).slice(0, 160)
    const canonical = `https://www.aiimageprompts.xyz/blog/${post.slug}`

    const html = injectHtmlShell(indexHtml, {
      title: seoTitle,
      description: seoDescription,
      canonical,
      ogType: 'article',
      image: post.imageUrl || 'https://aiimageprompts.xyz/og-image.png',
      body: renderBlogPost(post),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Person', name: post.author },
        articleSection: post.category,
        keywords: post.tags.join(', '),
        image: post.imageUrl ? [post.imageUrl] : undefined,
        description: seoDescription,
        mainEntityOfPage: canonical,
      },
    })

    await writeFile(join(outDir, 'index.html'), html, 'utf8')
  }

  await writeFile(publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  await writeFile(distManifestPath, JSON.stringify(manifest, null, 2), 'utf8')
}

main().catch((error) => {
  console.error('Blog prerender failed:', error)
  process.exit(1)
})
