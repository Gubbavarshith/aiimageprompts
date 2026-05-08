import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  dedupeAndSortUrls,
  fetchPublishedBlogPostsFromManifest,
  formatDate,
  generateUrlset,
  setXmlHeaders,
  siteBase,
  type SitemapUrlEntry,
} from './lib/sitemapShared'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    setXmlHeaders(res)
    const base = siteBase()
    const today = new Date().toISOString().split('T')[0]
    const entries: SitemapUrlEntry[] = []

    const blogPosts = fetchPublishedBlogPostsFromManifest()
    blogPosts.forEach((post) => {
      const lastmod = post.date ? formatDate(post.date) : today
      entries.push({
        url: `${base}/blog/${post.slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.7',
      })
    })

    return res.status(200).send(generateUrlset(dedupeAndSortUrls(entries)))
  } catch (error) {
    console.error('Sitemap blog error:', error)
    setXmlHeaders(res)
    return res.status(200).send(
      generateUrlset([
        {
          url: `${siteBase()}/blog`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.8',
        },
      ]),
    )
  }
}
