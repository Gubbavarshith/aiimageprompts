# Sitemap Management Guide

## Overview

The sitemap.xml is **fully automatic** and **never requires manual updates**. All routes are automatically discovered and included.

## How It Works

1. **Static Routes**: Defined in `src/config/routes.ts` - automatically included in sitemap
2. **Dynamic Routes**: Fetched from Supabase automatically:
   - **Prompts**: All published prompts from `prompts` table
   - **Blog Posts**: All published blog posts from `blog_posts` table (with JSON fallback)

## Adding a New Static Page

When you create a new hardcoded page (like `/new-page`), simply add it to `src/config/routes.ts`:

```typescript
export const PUBLIC_ROUTES: RouteConfig[] = [
  // ... existing routes ...
  {
    path: '/new-page',
    priority: '0.6',  // 0.0 to 1.0 (higher = more important)
    changefreq: 'monthly',  // always | hourly | daily | weekly | monthly | yearly | never
  },
]
```

That's it! The sitemap will automatically include it on the next deployment.

## Blog Posts (Supabase)

When you migrate blog posts to Supabase:

1. Create a `blog_posts` table with these columns:
   - `id` (string)
   - `title` (string)
   - `slug` (string)
   - `date` (date/timestamp)
   - `updated_at` (timestamp, optional)
   - `status` (string) - must be 'Published' for inclusion

2. The sitemap will automatically:
   - Fetch all published blog posts from Supabase
   - Include them in the sitemap with proper dates
   - Fallback to JSON file if Supabase table doesn't exist yet

## Current Static Routes

All routes in `src/config/routes.ts` are automatically included:
- `/` (Homepage)
- `/explore`
- `/blog`
- `/submit`
- `/about`
- `/contact`
- `/faq`
- `/guidelines`
- `/terms`
- `/privacy`

## Excluded Routes

These routes are automatically excluded from the sitemap:
- `/auth/*` (authentication pages)
- `/admin/*` (admin dashboard)
- `/profile` (user-specific)
- `/saved` (user-specific)
- `/maintenance` (maintenance page)

## Testing

After deployment, test your sitemap at:
```
https://aiimageprompts.xyz/sitemap.xml
```

## Google Search Console

1. Deploy your changes
2. Go to Google Search Console → Sitemaps
3. Submit: `https://aiimageprompts.xyz/sitemap.xml`
4. Google will automatically discover all new pages on the next crawl

## Important Notes

- ✅ **Never manually edit** `public/sitemap.xml` - it's generated dynamically
- ✅ **Always add new static routes** to `src/config/routes.ts`
- ✅ **Blog posts** are automatically included when published in Supabase
- ✅ **Prompts** are automatically included when published
- ✅ The sitemap updates automatically on every deployment

