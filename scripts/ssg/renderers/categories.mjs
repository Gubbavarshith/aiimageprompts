import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { esc, generateSlug, injectIntoShell, SITE } from '../core/html.mjs'

function renderCategoryBody(category, prompts, allCategories) {
  const promptCards = prompts
    .slice(0, 60)
    .map((p) => {
      const promptSlug = generateSlug(p.title)
      const imgSrc =
        p.preview_image_url || 'https://placehold.co/400x400/1a1a1a/FFDE1A?text=AI+Prompt'
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
    })
    .join('\n  ')

  const otherCatLinks = allCategories
    .filter((c) => c.slug !== category.slug)
    .slice(0, 12)
    .map(
      (c) =>
        `<li style="display:contents;"><a href="/categories/${esc(c.slug)}" style="display:block;padding:10px 16px;border:2px solid #e4e4e7;border-radius:10px;text-decoration:none;color:#111827;font-size:14px;font-weight:500;text-align:center;">${esc(c.name)}</a></li>`
    )
    .join('\n    ')

  const promptCountNote =
    prompts.length > 60
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

function buildPromptsByCategory(prompts) {
  const map = new Map()
  for (const p of prompts) {
    const cat = p.category
    if (!cat) continue
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(p)
  }
  return map
}

export async function renderCategories({ distDir, projectRoot, indexHtml, prompts }) {
  const categoriesRaw = await readFile(
    join(projectRoot, 'src', 'config', 'categories.json'),
    'utf8'
  )
  const categories = JSON.parse(categoriesRaw)

  const promptsByCategory = buildPromptsByCategory(prompts)
  await mkdir(join(distDir, 'categories'), { recursive: true })

  let count = 0

  for (const category of categories) {
    const categoryPrompts = promptsByCategory.get(category.name) || []
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
        numberOfItems: categoryPrompts.length,
        provider: { '@type': 'Organization', name: 'AI Image Prompts', url: SITE },
      },
    ]

    const body = renderCategoryBody(category, categoryPrompts, categories)
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
    console.log(`  ✓ /categories/${category.slug} (${categoryPrompts.length} prompts)`)
  }

  console.log(`[ssg] Category pages written — ${count} pages.`)
}
