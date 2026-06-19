import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function loadEnv(projectRoot) {
  for (const fileName of ['.env.local', '.env']) {
    const path = join(projectRoot, fileName)
    if (!existsSync(path)) continue
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const sep = trimmed.indexOf('=')
      if (sep <= 0) continue
      const key = trimmed.slice(0, sep).trim()
      const val = trimmed.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '')
      if (key && process.env[key] === undefined) process.env[key] = val
    }
  }
}

export function getSupabaseCredentials() {
  return {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
    key:
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '',
  }
}
