import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateSlug, SITE } from '../core/html.mjs'

/**
 * Generate llms.txt from live data so AI search engines (ChatGPT, Perplexity,
 * Google AI Overviews, etc.) get an accurate, always-fresh map of the site that
 * points to the canonical /categories/:slug and /blog/:slug pages — not the
 * non-canonical /explore?category= query URLs, and not stale hardcoded categories.
 */
export async function generateLlmsTxt({ publicDir, distDir, prompts = [], blogPosts = [] }) {
  // Real categories with counts, most-populated first.
  const catCounts = new Map()
  for (const p of prompts) {
    const c = String(p.category || '').trim()
    if (!c) continue
    catCounts.set(c, (catCounts.get(c) || 0) + 1)
  }
  const categories = [...catCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )

  const catLines = categories
    .map(([name, count]) => `- ${name} (${count} prompts): ${SITE}/categories/${generateSlug(name)}`)
    .join('\n')

  const blogLines = (blogPosts || [])
    .slice(0, 30)
    .map((p) => `- ${p.title}: ${SITE}/blog/${p.slug}`)
    .join('\n')

  const txt = `# AI Image Prompts — llms.txt
# ${SITE}

> AI Image Prompts is a curated library of high-quality AI image generation prompts for tools like Midjourney, DALL-E, Stable Diffusion, and Flux. Better Prompts, Better Art.

## About

AI Image Prompts helps creators discover, copy, and remix ${prompts.length}+ pro-level prompts across ${categories.length} categories. Each prompt includes a preview image, tags, a category label, and aspect-ratio metadata.

## Explore Prompts

Browse all prompts: ${SITE}/explore

## Categories
${catLines ? `\n${catLines}` : ''}

## Blog

Guides on AI art techniques, prompt engineering, and creative workflows: ${SITE}/blog
${blogLines ? `\n${blogLines}` : ''}

## Submit Prompts

Share your own prompts with the community: ${SITE}/submit

## Contact

Get in touch: ${SITE}/contact

## Sitemap

${SITE}/sitemap.xml
`

  await writeFile(join(publicDir, 'llms.txt'), txt, 'utf8')
  await writeFile(join(distDir, 'llms.txt'), txt, 'utf8')
  console.log(
    `[ssg] llms.txt written — ${categories.length} categories, ${Math.min((blogPosts || []).length, 30)} blog posts.`,
  )
}
