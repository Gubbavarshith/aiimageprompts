export interface LocationData {
  ip_address?: string
  country?: string
  region?: string
  city?: string
  timezone?: string
}

/**
 * Get user location data from IP address using ipapi.co
 * Falls back gracefully if the service is unavailable
 */
export async function getUserLocation(): Promise<LocationData> {
  try {
    // Use ipapi.co free tier (no API key required for basic usage)
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Handle rate limiting or errors from ipapi.co
    if (data.error || !data.ip) {
      console.warn('Location service returned error:', data)
      return {}
    }

    return {
      ip_address: data.ip || undefined,
      country: data.country_name || data.country_code || undefined,
      region: data.region || data.region_code || undefined,
      city: data.city || undefined,
      timezone: data.timezone || undefined,
    }
  } catch (error) {
    // Silently fail - location is optional
    console.warn('Failed to fetch user location:', error)
    return {}
  }
}

/**
 * Alternative: Get location using ip-api.com (backup option)
 */
export async function getUserLocationBackup(): Promise<LocationData> {
  try {
    const response = await fetch('http://ip-api.com/json/', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'fail') {
      console.warn('Location service returned error:', data)
      return {}
    }

    return {
      ip_address: data.query || undefined,
      country: data.country || undefined,
      region: data.regionName || data.region || undefined,
      city: data.city || undefined,
      timezone: data.timezone || undefined,
    }
  } catch (error) {
    console.warn('Failed to fetch user location (backup):', error)
    return {}
  }
}

