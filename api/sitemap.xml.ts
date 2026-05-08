import type { VercelRequest, VercelResponse } from '@vercel/node'

import {
  generateSitemapIndex,
  setXmlHeaders,
  siteBase,
} from './lib/sitemapShared'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    setXmlHeaders(res)
    const base = siteBase()
    const today = new Date().toISOString().split('T')[0]
    const xml = generateSitemapIndex([
      { loc: `${base}/sitemap-pages.xml`, lastmod: today },
      { loc: `${base}/sitemap-prompts.xml`, lastmod: today },
      { loc: `${base}/sitemap-blog.xml`, lastmod: today },
      { loc: `${base}/sitemap-categories.xml`, lastmod: today },
    ])
    return res.status(200).send(xml)
  } catch (error) {
    console.error('Sitemap index error:', error)
    setXmlHeaders(res)
    const base = siteBase()
    const today = new Date().toISOString().split('T')[0]
    return res
      .status(200)
      .send(
        generateSitemapIndex([{ loc: `${base}/sitemap-pages.xml`, lastmod: today }]),
      )
  }
}
