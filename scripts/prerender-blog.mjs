import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { marked } from 'marked'

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

    const html = addAnchorIdsToContent(marked.parse(content, { async: false }))
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
      category: String(data.category || 'News'),
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

  output = output.replace('<div id="root"></div>', `<div id="root">${payload.body}</div>`)
  return output
}

function renderBlogList(posts) {
  const cards = posts.map((post) => `
    <article style="border:1px solid #e4e4e7;border-radius:16px;padding:20px;margin-bottom:20px;background:#fff;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${escapeHtml(post.category)} • ${escapeHtml(post.date)}</p>
      <h2 style="margin:0 0 12px;font-size:28px;line-height:1.2;"><a href="/blog/${escapeHtml(post.slug)}" style="color:#111827;text-decoration:none;">${escapeHtml(post.title)}</a></h2>
      <p style="margin:0;color:#52525b;line-height:1.6;">${escapeHtml(post.excerpt)}</p>
    </article>
  `).join('')

  return `
    <main style="max-width:840px;margin:0 auto;padding:64px 24px;background:#fdfdfd;">
      <h1 style="font-size:48px;line-height:1.05;margin:0 0 24px;">Insights & Techniques</h1>
      ${cards}
    </main>
  `
}

function renderBlogPost(post) {
  return `
    <main style="max-width:840px;margin:0 auto;padding:64px 24px;background:#fdfdfd;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${escapeHtml(post.category)} • ${escapeHtml(post.date)}</p>
      <h1 style="font-size:52px;line-height:1.05;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
      <p style="margin:0 0 32px;color:#52525b;">By ${escapeHtml(post.author)} • ${escapeHtml(post.readTime)}</p>
      ${post.excerpt ? `<p style="font-size:22px;line-height:1.5;color:#18181b;border-left:4px solid #FFDE1A;padding-left:16px;margin:0 0 32px;">${escapeHtml(post.excerpt)}</p>` : ''}
      <article style="font-size:18px;line-height:1.8;color:#3f3f46;">${post.content}</article>
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
