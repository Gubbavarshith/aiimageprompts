import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import { marked, Renderer } from 'marked'
import { esc, injectIntoShell, SITE } from '../core/html.mjs'

function normalizeSlug(value) {
  return String(value || '')
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

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function calculateReadTime(html) {
  const words = stripHtml(html).split(' ').filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min read`
}

export async function readBlogPosts(contentDir) {
  const files = await readdir(contentDir)
  const posts = []

  for (const file of files.filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
    const raw = await readFile(join(contentDir, file), 'utf8')
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

    posts.push({
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
      tags: Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === 'string') : [],
      metaTitle: String(data.metaTitle || '').trim(),
      metaDescription: String(data.metaDescription || '').trim(),
      showToc: Boolean(data.showToc),
      readTime: calculateReadTime(html),
    })
  }

  return posts
    .filter((p) => p.status === 'Published')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function renderBlogList(posts) {
  const cards = posts
    .map(
      (post) => `
    <article style="border:1px solid #e4e4e7;border-radius:16px;padding:24px;margin-bottom:20px;background:#fff;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${esc(post.category)} • ${esc(post.date)}</p>
      <h2 style="margin:0 0 12px;font-size:24px;line-height:1.2;font-weight:700;"><a href="/blog/${esc(post.slug)}" style="color:#111827;text-decoration:none;">${esc(post.title)}</a></h2>
      <p style="margin:0;color:#52525b;line-height:1.6;">${esc(post.excerpt)}</p>
    </article>
  `
    )
    .join('')

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
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#71717a;">${esc(post.category)} • ${esc(post.date)}</p>
      <h1 style="font-size:48px;line-height:1.05;margin:0 0 12px;font-weight:900;">${esc(post.title)}</h1>
      <p style="margin:0 0 32px;color:#52525b;font-size:15px;">By ${esc(post.author)} · ${esc(post.readTime)}</p>
      ${post.excerpt ? `<p style="font-size:20px;line-height:1.6;color:#18181b;border-left:4px solid #FFDE1A;padding-left:20px;margin:0 0 40px;">${esc(post.excerpt)}</p>` : ''}
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

export async function renderBlog({ distDir, indexHtml, posts }) {
  await mkdir(join(distDir, 'blog'), { recursive: true })

  const blogListHtml = injectIntoShell(indexHtml, {
    title: 'AI Image Prompts Blog | Photo Prompts, Guides & Ideas',
    description:
      'Read AI image prompt guides, AI photo prompts, Midjourney prompt ideas, and practical text-to-image techniques for better generated art.',
    canonical: `${SITE}/blog`,
    ogType: 'website',
    body: renderBlogList(posts),
  })
  await writeFile(join(distDir, 'blog', 'index.html'), blogListHtml, 'utf8')

  for (const post of posts) {
    const outDir = join(distDir, 'blog', post.slug)
    await mkdir(outDir, { recursive: true })

    const seoTitle = post.metaTitle || `${post.title} | Better Prompts, Better Art`
    const seoDescription =
      post.metaDescription || post.excerpt || stripHtml(post.content).slice(0, 160)
    const canonical = `${SITE}/blog/${post.slug}`

    const html = injectIntoShell(indexHtml, {
      title: seoTitle,
      description: seoDescription,
      canonical,
      ogType: 'article',
      image: post.imageUrl || `${SITE}/og-image.png`,
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

  console.log(`[ssg] Blog written — index + ${posts.length} posts.`)
}

export async function writeBlogManifest({ distDir, publicDir, posts }) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    posts: posts.map((p) => ({ slug: p.slug, date: p.date, status: p.status })),
  }
  const content = JSON.stringify(manifest, null, 2)
  await writeFile(join(publicDir, 'blog-manifest.json'), content, 'utf8')
  await writeFile(join(distDir, 'blog-manifest.json'), content, 'utf8')
}
