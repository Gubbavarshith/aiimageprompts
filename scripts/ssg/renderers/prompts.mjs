import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { esc, generateSlug, injectIntoShell, SITE } from '../core/html.mjs'
import { writeBatch } from '../core/engine.mjs'

function renderPromptBody(prompt) {
  const catParam = encodeURIComponent(prompt.category || '')
  const tags = Array.isArray(prompt.tags) ? prompt.tags : []
  const tagHtml = tags.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;">
        ${tags.map((t) => `<span style="padding:4px 12px;background:#f4f4f5;border-radius:9999px;font-size:13px;color:#52525b;">${esc(t)}</span>`).join('\n        ')}
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

export async function renderPrompts({ distDir, indexHtml, prompts }) {
  if (prompts.length === 0) {
    console.log('[ssg] No prompts to render — skipping.')
    return
  }

  await mkdir(join(distDir, 'prompt'), { recursive: true })

  const seenSlugs = new Set()
  const validPrompts = prompts.filter((p) => {
    if (!p.title || !p.prompt) return false
    const slug = generateSlug(p.title)
    if (!slug || seenSlugs.has(slug)) return false
    seenSlugs.add(slug)
    return true
  })

  let count = 0

  await writeBatch(validPrompts, 20, async (p) => {
    const slug = generateSlug(p.title)
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
      ogType: 'article',
      image: p.preview_image_url || undefined,
      jsonLd,
      body: renderPromptBody(p),
    })

    const outDir = join(distDir, 'prompt', slug)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, 'index.html'), html, 'utf8')
    count++
  })

  console.log(`[ssg] Prompt pages written — ${count} pages.`)
}
