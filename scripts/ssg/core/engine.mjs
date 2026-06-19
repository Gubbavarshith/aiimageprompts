import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function writePage(distDir, routePath, html) {
  const outDir = join(distDir, ...routePath.split('/').filter(Boolean))
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'index.html'), html, 'utf8')
}

export async function writeRootPage(distDir, html) {
  await writeFile(join(distDir, 'index.html'), html, 'utf8')
}

export async function writeBatch(items, batchSize, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await Promise.all(batch.map(fn))
  }
}
