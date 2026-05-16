import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function loadLocalEnvFile(fileName) {
  const path = join(process.cwd(), fileName)
  if (!existsSync(path)) return

  const raw = readFileSync(path, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator <= 0) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadLocalEnvFile('.env.local')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fetchPhotoPrompts() {
  const { data, error } = await supabase
    .from('prompts')
    .select('id, title, category, tags, prompt')
    .eq('status', 'Published')
    .or('category.ilike.%photography%,category.ilike.%portrait%,category.ilike.%realistic%,category.ilike.%cinematic%')
    .limit(100)

  if (error) {
    console.error('Error fetching prompts:', error)
    return
  }

  const filtered = data.filter(p => 
    p.prompt.toLowerCase().includes('realistic') || 
    p.prompt.toLowerCase().includes('photo') || 
    p.prompt.toLowerCase().includes('photography') ||
    p.category.toLowerCase().includes('photography')
  )

  console.log(JSON.stringify(filtered.slice(0, 60), null, 2))
}

fetchPhotoPrompts()
