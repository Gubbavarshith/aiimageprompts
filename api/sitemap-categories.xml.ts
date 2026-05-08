import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  dedupeAndSortUrls,
  fetchDistinctCategories,
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

    const categories = await withTimeout(fetchDistinctCategories(), 8000, [])
    categories.forEach((category) => {
      const q = new URLSearchParams({ category })
      entries.push({
        url: `${base}/explore?${q.toString()}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.65',
      })
    })

    return res.status(200).send(generateUrlset(dedupeAndSortUrls(entries)))
  } catch (error) {
    console.error('Sitemap categories error:', error)
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
