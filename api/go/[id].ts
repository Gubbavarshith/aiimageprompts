// Vercel serverless function for link redirect with analytics
import { createClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'
import crypto from 'crypto'

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Hash visitor identifier (privacy-safe)
function hashVisitorId(ip: string, userAgent: string, date: string): string {
  const input = `${ip.substring(0, ip.lastIndexOf('.'))}-${userAgent}-${date}`
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16)
}

// Detect device type from user agent
function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  
  if (device.type === 'mobile') return 'mobile'
  if (device.type === 'tablet') return 'tablet'
  return 'desktop'
}

// Get country from Vercel headers or IP
function getCountry(req: any): string | null {
  // Vercel provides geolocation headers
  const country = req.headers['x-vercel-ip-country'] || 
                  req.headers['cf-ipcountry'] || 
                  req.headers['x-country-code']
  
  return country || null
}

// Get client IP address
function getClientIP(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.connection?.remoteAddress ||
         '0.0.0.0'
}

export default async function handler(req: any, res: any) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get ID from query params (Vercel dynamic routes populate req.query.id)
    // Also check URL path as fallback for rewrites
    let id: string | undefined = req.query?.id
    
    // If not in query, try to extract from URL path
    if (!id) {
      const url = req.url || ''
      const match = url.match(/\/go\/([^/?]+)/) || url.match(/\/api\/go\/([^/?]+)/)
      if (match && match[1]) {
        id = match[1]
      }
    }

    // If still no ID, try getting from the path directly
    if (!id && req.query) {
      // Check if id is nested in query
      id = req.query.id || (typeof req.query === 'object' ? Object.values(req.query)[0] as string : undefined)
    }

    if (!id || typeof id !== 'string' || id.length === 0) {
      console.error('No ID found in request:', { query: req.query, url: req.url })
      return res.status(404).json({ error: 'Link not found - invalid ID' })
    }

    const supabase = getSupabaseClient()

    // Fetch the tracked link
    const { data: link, error: linkError } = await supabase
      .from('tracked_links')
      .select('*')
      .eq('unique_id', id)
      .single()

    if (linkError || !link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Check if link is active
    if (link.status !== 'active') {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Extract analytics data
    const userAgent = req.headers['user-agent'] || ''
    const referrer = req.headers['referer'] || req.headers['referrer'] || null
    const ip = getClientIP(req)
    const country = getCountry(req)
    
    // Parse user agent
    const parser = new UAParser(userAgent)
    const deviceType = detectDeviceType(userAgent)
    const os = parser.getOS().name || null
    const browser = parser.getBrowser().name || null

    // Generate visitor ID (hash-based, privacy-safe)
    const today = new Date().toISOString().split('T')[0]
    const visitorId = hashVisitorId(ip, userAgent, today)

    // Check for existing visitor cookie
    const cookieName = `link_visitor_${id}`
    const cookieHeader = req.headers.cookie || ''
    const cookies: Record<string, string> = {}
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = decodeURIComponent(value)
      }
    })
    const existingVisitorId = cookies[cookieName] || visitorId

    // Log analytics (async - don't block redirect)
    const logAnalytics = async () => {
      try {
        await supabase
          .from('link_analytics')
          .insert({
            link_id: link.id,
            referrer: referrer,
            device_type: deviceType,
            operating_system: os,
            browser: browser,
            country: country,
            visitor_id: existingVisitorId,
          })
      } catch (err) {
        // Silently fail - analytics logging should not break redirects
        console.error('Failed to log analytics:', err)
      }
    }

    // Start analytics logging (don't await - fire and forget)
    logAnalytics()

    // Set visitor cookie (1 year expiry)
    const cookieValue = existingVisitorId
    const cookieOptions = [
      `${cookieName}=${cookieValue}`,
      'Path=/',
      'Max-Age=31536000', // 1 year
      'SameSite=Lax',
      'HttpOnly',
    ]

    // Redirect immediately (302 Temporary Redirect)
    res.setHeader('Location', link.destination_url)
    res.setHeader('Set-Cookie', cookieOptions.join('; '))
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    return res.status(302).end()
  } catch (error) {
    console.error('Redirect handler error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

