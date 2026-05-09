import {
  fallbackExploreEntry,
  fetchPublishedPrompts,
  formatDate,
  generateSlug,
  generateUrlset,
  setXmlHeaders,
  siteBase,
  todayIsoDate,
  type SitemapUrlEntry,
  type XmlResponse,
} from './lib/sitemapApi.ts'

export default async function handler(_req: unknown, res: XmlResponse) {
  setXmlHeaders(res)

  try {
    const base = siteBase()
    const today = todayIsoDate()
    const prompts = await fetchPublishedPrompts()
    const entries: SitemapUrlEntry[] = prompts.flatMap((prompt) => {
      const title = prompt.title?.trim()
      if (!title) return []
      return [{
        url: `${base}/prompt/${generateSlug(title)}`,
        lastmod: formatDate(prompt.updated_at || prompt.created_at, today),
        changefreq: 'weekly',
        priority: '0.8',
      }]
    })

    return res.status(200).send(generateUrlset(entries))
  } catch (error) {
    console.error('Dynamic prompt sitemap error:', error)
    return res.status(200).send(generateUrlset([fallbackExploreEntry()]))
  }
}
