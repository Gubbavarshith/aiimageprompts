import { copyFile, mkdir, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const contentDir = join(projectRoot, 'src', 'content', 'blog')
const templatePath = join(contentDir, '_template.md')

function toSlug(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function main() {
  const rawTitle = process.argv.slice(2).join(' ').trim()
  if (!rawTitle) {
    console.error('Usage: npm run new:blog -- "Your Blog Title"')
    process.exit(1)
  }

  const slug = toSlug(rawTitle)
  if (!slug) {
    console.error('Could not generate a valid slug from the title.')
    process.exit(1)
  }

  await mkdir(contentDir, { recursive: true })

  const targetPath = join(contentDir, `${slug}.md`)
  if (await pathExists(targetPath)) {
    console.error(`Blog file already exists: src/content/blog/${slug}.md`)
    process.exit(1)
  }

  if (!(await pathExists(templatePath))) {
    console.error('Template file not found: src/content/blog/_template.md')
    process.exit(1)
  }

  await copyFile(templatePath, targetPath)
  console.log(`Created: src/content/blog/${slug}.md`)
}

main().catch((error) => {
  console.error('Failed to create blog file:', error)
  process.exit(1)
})
