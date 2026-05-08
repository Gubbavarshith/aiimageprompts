import type { VercelRequest, VercelResponse } from '@vercel/node'

import { buildStaticPageEntries, generateUrlset, setXmlHeaders } from './lib/sitemapShared'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    setXmlHeaders(res)
    const today = new Date().toISOString().split('T')[0]
    const entries = buildStaticPageEntries(today)
    return res.status(200).send(generateUrlset(entries))
  } catch (error) {
    console.error('Sitemap pages error:', error)
    setXmlHeaders(res)
    return res.status(200).send(generateUrlset(buildStaticPageEntries(new Date().toISOString().split('T')[0])))
  }
}
