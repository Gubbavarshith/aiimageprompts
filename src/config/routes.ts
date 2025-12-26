/**
 * Centralized route configuration for the application
 * This file ensures all static routes are automatically included in the sitemap
 * 
 * When adding a new public route:
 * 1. Add it to the PUBLIC_ROUTES array below
 * 2. It will automatically appear in the sitemap.xml
 * 
 * Routes with parameters (like /blog/:slug, /prompt/:slug) are handled dynamically
 * and don't need to be added here - they're fetched from the database.
 */

export type RouteConfig = {
  path: string
  priority: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  excludeFromSitemap?: boolean // Set to true for routes that shouldn't be in sitemap (e.g., auth, admin)
}

/**
 * All public routes that should be included in the sitemap
 * Routes are ordered by importance/priority
 */
export const PUBLIC_ROUTES: RouteConfig[] = [
  // High priority - main pages
  {
    path: '/',
    priority: '1.0',
    changefreq: 'daily',
  },
  {
    path: '/explore',
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    path: '/blog',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/submit',
    priority: '0.7',
    changefreq: 'monthly',
  },
  
  // Medium priority - informational pages
  {
    path: '/about',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/faq',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/guidelines',
    priority: '0.5',
    changefreq: 'monthly',
  },
  
  // Low priority - legal pages
  {
    path: '/terms',
    priority: '0.4',
    changefreq: 'yearly',
  },
  {
    path: '/privacy',
    priority: '0.4',
    changefreq: 'yearly',
  },
  {
    path: '/refund',
    priority: '0.4',
    changefreq: 'yearly',
  },
]

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

