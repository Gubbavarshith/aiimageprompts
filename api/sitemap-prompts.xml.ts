import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  dedupeAndSortUrls,
  fetchPublishedPrompts,
  formatDate,
  generateSlug,
  generateUrlset,
  setXmlHeaders,
  siteBase,
  withTimeout,
  type SitemapUrlEntry,
} from './lib/sitemapShared'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    setXmlHeaders(res)
    const base = siteBase()
    const today = new Date().toISOString().split('T')[0]
    const entries: SitemapUrlEntry[] = []

    const prompts = await withTimeout(fetchPublishedPrompts(), 8000, [])
    prompts.forEach((prompt) => {
      const slug = generateSlug(prompt.title)
      const lastmod = prompt.updated_at
        ? formatDate(prompt.updated_at)
        : prompt.created_at
          ? formatDate(prompt.created_at)
          : today
      entries.push({
        url: `${base}/prompt/${slug}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.8',
      })
    })

    return res.status(200).send(generateUrlset(dedupeAndSortUrls(entries)))
  } catch (error) {
    console.error('Sitemap prompts error:', error)
    setXmlHeaders(res)
    return res.status(200).send(
      generateUrlset([
        {
          url: `${siteBase()}/explore`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'daily',
          priority: '0.9',
        },
      ]),
    )
  }
}
