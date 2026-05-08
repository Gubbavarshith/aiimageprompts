/**
 * Single canonical host for SEO (sitemap, canonical, JSON-LD, OG absolute URLs).
 * Override in Vercel with SITE_URL or VITE_SITE_URL if needed.
 */
export const SITE_ORIGIN = 'https://www.aiimageprompts.xyz' as const

/** Apex hostname only — used for redirect rules documentation / matching. */
export const APEX_HOST = 'aiimageprompts.xyz' as const

export function resolveSiteOrigin(): string {
  const fromEnv = process.env.SITE_URL || process.env.VITE_SITE_URL
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '')
  }
  return SITE_ORIGIN
}

/** Browser bundle: VITE_SITE_URL when set, else production www. */
export function getPublicSiteOrigin(): string {
  const env = import.meta.env.VITE_SITE_URL as string | undefined
  if (env && /^https?:\/\//i.test(env)) {
    return env.replace(/\/$/, '')
  }
  return SITE_ORIGIN
}
