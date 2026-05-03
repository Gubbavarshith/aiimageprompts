import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const SOURCE_README = path.resolve('awesome-gpt-image-2/README.md')
const OUTPUT_DIR = path.resolve('awesome-gpt-image-2/export')
const OUTPUT_CSV = path.join(OUTPUT_DIR, 'bulk-upload-prompts.csv')
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'bulk-upload-prompts.json')
const OUTPUT_STATS = path.join(OUTPUT_DIR, 'bulk-upload-stats.json')

const CSV_HEADERS = [
  'title',
  'prompt',
  'category',
  'negative_prompt',
  'tags',
  'preview_image',
  'status',
  'attribution',
  'attribution_link',
]

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function escapeCsvCell(value) {
  const normalized = value == null ? '' : String(value)
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

function parseCategoryCatalog(markdown) {
  const categories = []
  const start = markdown.indexOf('### 🏷️ Browse by Category')
  if (start < 0) return categories

  const end = markdown.indexOf('\n---', start)
  const catalogBlock = end > start ? markdown.slice(start, end) : markdown.slice(start)

  const categoryRegex = /-\s\[(.+?)\]\(https?:\/\/[^)\s]+categories=([^)]+)\)/g
  let match
  while ((match = categoryRegex.exec(catalogBlock)) !== null) {
    const name = match[1].trim()
    categories.push(name)
  }

  return categories
}

function getPromptBlocks(markdown) {
  const blockRegex = /^### No\.\s+\d+:\s+(.+)$/gm
  const matches = [...markdown.matchAll(blockRegex)]
  const blocks = []

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    const title = match[1].trim()
    const start = match.index + match[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length
    const body = markdown.slice(start, end).trim()
    blocks.push({ title, body })
  }

  return blocks
}

function extractLanguage(blockBody) {
  const languageMatch = blockBody.match(/!\[Language-([A-Z-]+)\]/)
  return languageMatch ? languageMatch[1].toLowerCase() : 'en'
}

function extractDescription(blockBody) {
  const descriptionMatch = blockBody.match(/#### 📖 Description\s+([\s\S]*?)\s+#### 📝 Prompt/)
  return descriptionMatch ? descriptionMatch[1].trim() : ''
}

function extractPrompt(blockBody) {
  const promptMatch = blockBody.match(/#### 📝 Prompt\s+```[\w-]*\s*([\s\S]*?)\s*```/)
  return promptMatch ? promptMatch[1].trim() : ''
}

function extractPreviewImage(blockBody) {
  const imageMatch = blockBody.match(/<img src="([^"]+)"/)
  return imageMatch ? imageMatch[1].trim() : ''
}

function extractAttribution(blockBody) {
  const authorMatch = blockBody.match(/\*\*Author:\*\*\s+\[([^\]]+)\]\(([^)]+)\)/)
  if (!authorMatch) {
    return { attribution: '', attributionLink: '' }
  }

  return {
    attribution: authorMatch[1].trim(),
    attributionLink: authorMatch[2].trim(),
  }
}

function inferCategory(rawTitle, knownCategories) {
  const titleParts = rawTitle.split(' - ')
  if (titleParts.length < 2) {
    return { category: 'Featured', normalizedTitle: rawTitle }
  }

  const maybeCategory = titleParts[0].trim()
  const normalizedTitle = titleParts.slice(1).join(' - ').trim()
  const isKnown = knownCategories.includes(maybeCategory)

  if (!isKnown) {
    return { category: 'Featured', normalizedTitle: rawTitle }
  }

  return {
    category: maybeCategory,
    normalizedTitle: normalizedTitle || rawTitle,
  }
}

function buildTags({ category, language, featured, raycast }) {
  const tags = new Set(['gpt-image-2', `language-${language}`])
  if (category) tags.add(slugify(category))
  if (featured) tags.add('featured')
  if (raycast) tags.add('raycast-friendly')
  return Array.from(tags)
}

function buildPromptApiUrl({ page, limit, locale = 'en-US' }) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  params.set('depth', '2')
  params.set('locale', locale)
  params.set('sort', '-sourcePublishedAt')
  params.set('where[model][equals]', 'gpt-image-2')
  return `${process.env.CMS_HOST}/api/prompts?${params.toString()}`
}

function normalizeCategoryFromCms(prompt) {
  const useCaseCategory = prompt?.imageCategories?.useCases?.[0]?.title
  const styleCategory = prompt?.imageCategories?.styles?.[0]?.title
  const subjectCategory = prompt?.imageCategories?.subjects?.[0]?.title
  return useCaseCategory || styleCategory || subjectCategory || 'Featured'
}

function normalizeImageFromCms(prompt) {
  const mediaImage = Array.isArray(prompt?.media)
    ? prompt.media.find((item) => typeof item?.url === 'string' && item.url.trim().length > 0)?.url
    : ''

  const sourceImage = Array.isArray(prompt?.sourceMedia)
    ? prompt.sourceMedia.find((url) => typeof url === 'string' && url.trim().length > 0)
    : ''

  return mediaImage || sourceImage || ''
}

async function fetchAllFromCms() {
  if (!process.env.CMS_HOST || !process.env.CMS_API_KEY) {
    return null
  }

  const docs = []
  const limit = 100
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const url = buildPromptApiUrl({ page, limit })
    const response = await fetch(url, {
      headers: {
        Authorization: `users API-Key ${process.env.CMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CMS API request failed (page ${page}): ${response.status} ${response.statusText}`)
    }

    const payload = await response.json()
    if (!Array.isArray(payload.docs)) {
      throw new Error('Invalid CMS response: docs is not an array')
    }

    docs.push(...payload.docs)
    totalPages = Number(payload.totalPages || 1)
    page += 1
  }

  const records = docs
    .map((prompt) => {
      const category = normalizeCategoryFromCms(prompt)
      const language = (prompt.language || 'en').toLowerCase()
      const featured = Boolean(prompt.featured)
      const tags = buildTags({
        category,
        language,
        featured,
        raycast: String(prompt.content || '').includes('{argument'),
      })

      return {
        title: String(prompt.title || '').trim(),
        prompt: String(prompt.content || '').trim(),
        category,
        negative_prompt: '',
        tags: tags.join(';'),
        preview_image: normalizeImageFromCms(prompt),
        status: 'Published',
        attribution: String(prompt?.author?.name || '').trim(),
        attribution_link: String(prompt?.author?.link || '').trim(),
      }
    })
    .filter((item) => item.title && item.prompt)

  return {
    source: 'cms',
    records,
    totalDocsFetched: docs.length,
  }
}

async function main() {
  const cmsResult = await fetchAllFromCms()
  let source = 'readme'
  let totalPromptBlocks = 0
  let totalDocsFetched = 0
  let records = []

  if (cmsResult) {
    source = cmsResult.source
    totalDocsFetched = cmsResult.totalDocsFetched
    records = cmsResult.records
  } else {
    const markdown = await readFile(SOURCE_README, 'utf8')
    const knownCategories = parseCategoryCatalog(markdown)
    const blocks = getPromptBlocks(markdown)
    totalPromptBlocks = blocks.length

    for (const block of blocks) {
      const language = extractLanguage(block.body)
      const description = extractDescription(block.body)
      const prompt = extractPrompt(block.body)
      const previewImage = extractPreviewImage(block.body)
      const { attribution, attributionLink } = extractAttribution(block.body)
      const featured = block.body.includes('![Featured]')
      const raycast = block.body.includes('![Raycast]')
      const { category, normalizedTitle } = inferCategory(block.title, knownCategories)
      const tags = buildTags({ category, language, featured, raycast })

      if (!prompt) {
        continue
      }

      const finalPrompt = description
        ? `${description}\n\n${prompt}`
        : prompt

      records.push({
        title: normalizedTitle,
        prompt: finalPrompt,
        category,
        negative_prompt: '',
        tags: tags.join(';'),
        preview_image: previewImage,
        status: 'Published',
        attribution,
        attribution_link: attributionLink,
      })
    }
  }

  const csvRows = [CSV_HEADERS.join(',')]
  for (const record of records) {
    const row = CSV_HEADERS.map((header) => escapeCsvCell(record[header] ?? '')).join(',')
    csvRows.push(row)
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(OUTPUT_CSV, `${csvRows.join('\n')}\n`, 'utf8')
  await writeFile(OUTPUT_JSON, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  await writeFile(
    OUTPUT_STATS,
    `${JSON.stringify(
      {
        source,
        totalPromptBlocks,
        totalDocsFetched,
        exportedRecords: records.length,
        outputCsv: OUTPUT_CSV,
        outputJson: OUTPUT_JSON,
      },
      null,
      2
    )}\n`,
    'utf8'
  )

  const stats = {
    source,
    totalPromptBlocks,
    totalDocsFetched,
    exportedRecords: records.length,
    outputCsv: OUTPUT_CSV,
    outputJson: OUTPUT_JSON,
    outputStats: OUTPUT_STATS,
  }
  console.log(JSON.stringify(stats, null, 2))
}

main().catch((error) => {
  console.error('Failed to generate bulk upload export:', error)
  process.exit(1)
})
