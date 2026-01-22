// Supabase Edge Function for Google Analytics Data API
// Uses service account credentials to fetch GA4 data server-side
// Requires environment variables: GA_CLIENT_EMAIL, GA_PRIVATE_KEY, GA_PROPERTY_ID

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0"

// Admin email whitelist - matches frontend auth logic
const ADMIN_EMAIL_WHITELIST = (Deno.env.get('ADMIN_EMAIL_WHITELIST') || 'admin@example.com')
  .split(',')
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean)

// GA4 configuration from environment variables
const GA_CLIENT_EMAIL = Deno.env.get('GA_CLIENT_EMAIL') || ''
const GA_PRIVATE_KEY = (Deno.env.get('GA_PRIVATE_KEY') || '').replace(/\\n/g, '\n')
const GA_PROPERTY_ID = Deno.env.get('GA_PROPERTY_ID') || ''

// Response types
interface GAOverviewResponse {
  totalUsers: number
  sessions: number
  screenPageViews: number
  bounceRate: number
}

interface GATrafficSource {
  source: string
  medium: string
  sessions: number
}

interface GATopPage {
  pagePath: string
  views: number
}

interface GARealtimeResponse {
  activeUsers: number
}

interface ErrorResponse {
  error: string
  details?: string
}

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper to create JSON response
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Helper to create error response
function errorResponse(error: string, details?: string, status = 500): Response {
  const body: ErrorResponse = { error }
  if (details) body.details = details
  return jsonResponse(body, status)
}

// Validate admin email
function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAIL_WHITELIST.includes(email.trim().toLowerCase())
}

// Create JWT for Google API authentication
async function createGoogleJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiry = now + 3600 // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const payload = {
    iss: GA_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  }

  // Encode header and payload
  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signatureInput = `${headerB64}.${payloadB64}`

  // Import private key and sign
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  const pemContents = GA_PRIVATE_KEY
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signatureInput}.${signatureB64}`
}

// Get Google access token using service account JWT
async function getGoogleAccessToken(): Promise<string> {
  const jwt = await createGoogleJWT()

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get access token: ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}

// Fetch overview metrics from GA4
async function fetchOverview(accessToken: string, startDate: string, endDate: string): Promise<GAOverviewResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GA API error: ${errorText}`)
  }

  const data = await response.json()
  const values = data.rows?.[0]?.metricValues || []

  return {
    totalUsers: parseInt(values[0]?.value || '0', 10),
    sessions: parseInt(values[1]?.value || '0', 10),
    screenPageViews: parseInt(values[2]?.value || '0', 10),
    bounceRate: parseFloat(values[3]?.value || '0'),
  }
}

// Fetch traffic sources from GA4
async function fetchTrafficSources(accessToken: string, startDate: string, endDate: string): Promise<GATrafficSource[]> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
        ],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GA API error: ${errorText}`)
  }

  const data = await response.json()
  const rows = data.rows || []

  return rows.map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    source: row.dimensionValues[0]?.value || '(unknown)',
    medium: row.dimensionValues[1]?.value || '(unknown)',
    sessions: parseInt(row.metricValues[0]?.value || '0', 10),
  }))
}

// Fetch top pages from GA4
async function fetchTopPages(accessToken: string, startDate: string, endDate: string): Promise<GATopPage[]> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 20,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GA API error: ${errorText}`)
  }

  const data = await response.json()
  const rows = data.rows || []

  return rows.map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    pagePath: row.dimensionValues[0]?.value || '/',
    views: parseInt(row.metricValues[0]?.value || '0', 10),
  }))
}

// Fetch realtime active users from GA4
async function fetchRealtime(accessToken: string): Promise<GARealtimeResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runRealtimeReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: [{ name: 'activeUsers' }],
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GA API error: ${errorText}`)
  }

  const data = await response.json()
  const activeUsers = parseInt(data.rows?.[0]?.metricValues?.[0]?.value || '0', 10)

  return { activeUsers }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', undefined, 405)
  }

  try {
    // Check GA configuration
    if (!GA_CLIENT_EMAIL || !GA_PRIVATE_KEY || !GA_PROPERTY_ID) {
      return errorResponse(
        'Google Analytics not configured',
        'Missing GA_CLIENT_EMAIL, GA_PRIVATE_KEY, or GA_PROPERTY_ID environment variables',
        500
      )
    }

    // Extract authorization token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 'Missing or invalid authorization header', 401)
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client to verify the user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Server configuration error', 'Missing Supabase configuration', 500)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return errorResponse('Unauthorized', 'Invalid or expired token', 401)
    }

    // Check if user is admin
    if (!isAdminEmail(user.email)) {
      return errorResponse('Forbidden', 'Admin access required', 403)
    }

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { endpoint, startDate, endDate } = body as {
      endpoint?: string
      startDate?: string
      endDate?: string
    }

    if (!endpoint) {
      return errorResponse('Bad request', 'Missing endpoint parameter', 400)
    }

    // Default date range: last 30 days
    const defaultEndDate = new Date().toISOString().split('T')[0]
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const effectiveStartDate = startDate || defaultStartDate
    const effectiveEndDate = endDate || defaultEndDate

    // Get Google access token
    const accessToken = await getGoogleAccessToken()

    // Route to appropriate handler based on endpoint
    switch (endpoint) {
      case 'overview': {
        const data = await fetchOverview(accessToken, effectiveStartDate, effectiveEndDate)
        return jsonResponse(data)
      }
      case 'traffic-sources': {
        const data = await fetchTrafficSources(accessToken, effectiveStartDate, effectiveEndDate)
        return jsonResponse(data)
      }
      case 'top-pages': {
        const data = await fetchTopPages(accessToken, effectiveStartDate, effectiveEndDate)
        return jsonResponse(data)
      }
      case 'realtime': {
        const data = await fetchRealtime(accessToken)
        return jsonResponse(data)
      }
      default:
        return errorResponse('Bad request', `Unknown endpoint: ${endpoint}`, 400)
    }
  } catch (error) {
    console.error('Google Analytics Edge Function error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse('Internal server error', message, 500)
  }
})

