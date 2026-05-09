import publicRoutes from './publicRoutes.json'

/**
 * Centralized route configuration for the application.
 *
 * When adding a new static public route, add it to publicRoutes.json.
 * The sitemap generator and app config both read from that same source.
 *
 * Routes with parameters (like /blog/:slug, /prompt/:slug) are handled dynamically.
 */

export type RouteConfig = {
  path: string
  priority: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  excludeFromSitemap?: boolean // Set to true for routes that shouldn't be in sitemap (e.g., auth, admin)
}

export const PUBLIC_ROUTES = publicRoutes as RouteConfig[]

/**
 * Routes that should NOT be included in the sitemap
 * (auth, admin, user-specific pages, etc.)
 */
export const EXCLUDED_ROUTES: string[] = [
  '/auth',
  '/admin',
  '/profile',
  '/saved',
  '/maintenance',
]

/**
 * Check if a route should be excluded from the sitemap
 */
export function shouldExcludeFromSitemap(path: string): boolean {
  return EXCLUDED_ROUTES.some(excluded => path.startsWith(excluded))
}

