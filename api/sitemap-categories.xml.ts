import {
  fallbackExploreEntry,
  fetchPublishedPrompts,
  generateUrlset,
  setXmlHeaders,
  siteBase,
  todayIsoDate,
  type SitemapUrlEntry,
  type XmlResponse,
} from './lib/sitemapApi'

export default async function handler(_req: unknown, res: XmlResponse) {
  setXmlHeaders(res)

  try {
    const base = siteBase()
    const today = todayIsoDate()
    const prompts = await fetchPublishedPrompts()
    const categories = new Set<string>()

    prompts.forEach((prompt) => {
      const category = prompt.category?.trim()
      if (category) categories.add(category)
    })

    const entries: SitemapUrlEntry[] = [...categories]
      .sort((a, b) => a.localeCompare(b))
      .map((category) => {
        const query = new URLSearchParams({ category })
        return {
          url: `${base}/explore?${query.toString()}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: '0.65',
        }
      })

    return res.status(200).send(generateUrlset(entries))
  } catch (error) {
    console.error('Dynamic category sitemap error:', error)
    return res.status(200).send(generateUrlset([fallbackExploreEntry()]))
  }
}
