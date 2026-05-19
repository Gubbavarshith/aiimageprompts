# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Image Prompts is a React + TypeScript web application for discovering, sharing, and managing AI image generation prompts. It features a public-facing landing and exploration interface, user prompt submission, admin dashboard, blog, and SEO-optimized content pages. The app is deployed on Vercel with a Supabase backend.

## Build, Dev, and Lint Commands

**Development**
```bash
npm run dev          # Start Vite dev server with sitemap generation (http://localhost:5173)
```

**Production**
```bash
npm run build        # Compile TypeScript, build with Vite, prerender blog posts, generate sitemaps
npm run preview      # Preview the production build locally
```

**Utilities**
```bash
npm run lint         # Run ESLint on all .ts/.tsx files
npm run sitemap      # Generate sitemaps (runs automatically during dev/build)
npm run new:blog     # Create a new blog post template via interactive script
```

**Key Build Details**
- TypeScript is strict mode with path aliases (`@/*` → `./src/*`)
- ESLint has warnings for `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` to allow incremental migration
- Vite chunks are handled automatically; manual chunking was removed due to initialization issues
- Blog posts are prerendered and indexed; sitemap generation happens at dev/build time

## Architecture Overview

### High-Level Structure

The application has three main layers:

1. **Public Interface**: Landing page, blog, prompt exploration, and informational pages (terms, privacy, about, FAQ, etc.)
2. **User Features**: Prompt submission, saved prompts, user authentication via Clerk
3. **Admin Dashboard**: Protected pages for managing prompts, categories, tags, links, analytics, and contact messages

### Routing & Layout System

Routes are defined in `src/App.tsx` with three layout patterns:

- **No Layout** (`/`): Landing page loaded eagerly (critical for LCP)
- **AuthLayout** (`/admin/login`): Centered card layout for authentication
- **AdminLayout**: Sidebar + header layout wrapping all `/admin/*` routes (except login)

Public routes are configured in `src/config/publicRoutes.json` and used by:
- Sitemap generation (`scripts/generate-sitemaps.mjs`)
- Route configuration validation
- SEO metadata

### Frontend Stack

- **Framework**: React 18 with React Router DOM v7
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style) + class-variance-authority
- **State Management**: React Context (AdminContext for modal state, ToastContext for notifications)
- **Animation**: Framer Motion, GSAP with React plugin
- **Rich Text**: TipTap editor (with extensions for color, highlight, link, image, alignment, etc.)
- **3D Graphics**: React Three Fiber + Three.js (used in hero sections)
- **UI Components**: shadcn/ui (alert, button, card, checkbox, input, label, switch, textarea)
- **Icons**: Lucide React, Heroicons
- **Analytics**: Vercel Analytics and Speed Insights (lazy-loaded after interaction)

### Backend Integration (Supabase)

**Client Setup**: `src/lib/supabaseClient.ts` initializes the Supabase client with:
- Session persistence and auto-refresh
- Timeout handling (12s default for queries)
- Validation of environment variables

**Services Layer**: `src/lib/services/` contains modular query functions:
- `prompts.ts`: CRUD operations, filtering, real-time subscriptions for published prompts
- `categories.ts`: Category data with caching
- `tags.ts`: Tag management
- `savedPrompts.ts`: User's saved/bookmarked prompts
- `ratings.ts`: Prompt rating/review system
- `contactMessages.ts`: Contact form submissions
- `emailSubscriptions.ts`: Newsletter subscriptions
- `discoveryEvents.ts`: User interaction tracking
- `exploreHeroTools.ts`: Featured tools on explore page
- `bulkUpload.ts` / `bulkUploadDrafts.ts`: Batch prompt upload with draft support
- `blogs.ts`: Blog post metadata and queries
- `googleAnalytics.ts`: GA data retrieval
- `promptAnalytics.ts`: Prompt-specific analytics

**Query Patterns**:
- Most queries include timeout handling via `executeWithTimeout()`
- Published prompts exclude certain fields (negative_prompt, rating details) for public API
- Real-time subscriptions use Postgres Change notifications for admin updates
- Storage paths are extracted/validated from Supabase public URLs

### Authentication & Authorization

- **User Auth**: Clerk (`@clerk/clerk-react`) for public signup/login; redirects to `/auth/*`
- **Admin Auth**: Supabase Auth with email whitelist validation in `src/lib/authHelpers.ts`
- **Protected Routes**: ProtectedRoute component checks admin status before rendering admin layouts
- **Environment Validation**: Clerk key validation in `src/main.tsx` ensures publishable key (pk_*) not secret (sk_*)

### Key Pages & Features

**Public Pages**:
- `/` - Landing page (LandingPage.tsx) with hero, featured prompts, testimonials, badges
- `/explore` - Full prompt catalog with filtering by category, tags, sorting
- `/prompt/:slug` - Individual prompt detail with rating, sharing, related prompts
- `/blog` - Blog index; `/blog/:slug` - Blog post with prerendered markdown
- `/submit` - User prompt submission form
- `/saved` - User's bookmarked prompts
- Legal/Info: `/terms`, `/privacy`, `/refund`, `/cookies`, `/contact`, `/about`, `/faq`, `/guidelines`, `/donate`

**Admin Pages** (protected):
- `/admin/login` - Admin authentication
- `/admin/dashboard` - Overview with analytics
- `/admin/prompts` - Create/edit/delete prompts with rich text editor
- `/admin/review` - Queue for user-submitted prompts
- `/admin/bulk` - Bulk upload via CSV/JSON
- `/admin/categories` - Manage categories and metadata
- `/admin/tags` - Manage tags
- `/admin/links` - Create/manage short links with analytics
- `/admin/subscriptions` - Email subscription management
- `/admin/settings` - App-wide configuration
- `/admin/explore-hero` - Configure featured tools on explore page
- `/admin/google-analytics` - View GA metrics
- `/admin/contact` - View contact form messages

### Data Models (Key Supabase Tables)

**Prompts**:
- `id`, `title`, `prompt`, `negative_prompt`, `category`, `tags[]`, `preview_image_url`
- `status` (draft/published/archived), `views`, `rating_avg`, `rating_count`
- `user_id`, `created_at`, `updated_at`, `scheduled_at` (for future publishing)
- `image_ratio` (aspect ratio for preview)

**Other Tables**: Categories, Tags, Saved Prompts, Ratings, Contact Messages, Blog Posts, Link Analytics, Discovery Events, Subscriptions, etc.

### Environment Variables

Required in `.env.local`:
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication (must start with `pk_`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` - Supabase client key
- `VITE_ADMIN_EMAIL_WHITELIST` - Comma-separated admin emails
- `CONTACT_FROM` / `CONTACT_TO` - Contact form email addresses

## Notable Patterns & Conventions

### Performance & Core Web Vitals

- **LCP (Largest Contentful Paint)**: Landing page is imported eagerly, all other pages lazy-loaded
- **Code Splitting**: Routes are lazy-loaded except LandingPage; components use Suspense with PageLoader fallback
- **Analytics Deferred**: Vercel Analytics/Speed Insights loaded after first interaction via `requestIdleCallback` or 2s timeout
- **Maintenance Guard**: Wrapped in lazy Suspense and deferred to requestAnimationFrame to avoid blocking initial render

### Error Handling

- **ErrorBoundary**: Wraps routes to catch React errors; custom fallback UI
- **Query Timeouts**: All Supabase queries have 12s timeout with user-friendly error messages
- **Supabase Validation**: Client validates URL and key on initialization; fails fast in production
- **Clerk Key Validation**: main.tsx checks for publishable vs. secret key; blocks render if misconfigured

### SEO & Content

- **Route Metadata**: `src/config/publicRoutes.json` defines static routes with priority and change frequency
- **Sitemap Generation**: `scripts/generate-sitemaps.mjs` runs at dev/build time; includes dynamic blog/prompt slugs
- **Blog Prerendering**: `scripts/prerender-blog.mjs` generates static HTML for SEO
- **Markdown Parsing**: `blogMarkdown.ts` parses frontmatter and markdown via `gray-matter` and `marked`
- **Meta Tags**: Handled per-page (see PromptPage.tsx, BlogPostPage.tsx for examples)

### Styling

- **Tailwind**: v4 with custom fonts (DM Sans body, Sora display) and HSL color system
- **Theme Switching**: Dark mode via class strategy; ThemeProvider in main.tsx; ThemeSwitch component
- **Glassmorphism**: Used in landing page and admin components
- **Responsive**: Mobile-first approach; sm, md, lg, xl breakpoints

### Toast Notifications

- Custom Toast context in `src/contexts/ToastContext.tsx`
- Used for form submissions, deletions, async operations
- Hook: `useToast()` with methods like `.success()`, `.error()`, `.info()`

### Rich Text Editor

- TipTap-based editor in `RichTextEditor.tsx`
- Supports: bold, italic, underline, strikethrough, color, highlight, links, images, text alignment
- Used in admin prompt/settings forms

### Reusable Components

- **UI Components** in `src/components/ui/` are shadcn/ui-based with CVA for variants
- **Admin Components** in `src/components/admin/` handle forms, modals, analytics charts
- **Landing Components** in `src/components/landing/` are feature-specific (hero, testimonials, etc.)
- **Layouts** in `src/layouts/` wrap page content (AuthLayout, AdminLayout)

## Git & Version Control

The repo uses standard Git with GitHub. Key points:
- `.gitignore` excludes node_modules, dist, coverage, .env files
- `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` are documentation files
- No pre-commit hooks currently; eslint runs manually via `npm run lint`

## Known Issues & Notes

- Manual chunking in vite.config was removed due to initialization issues; Vite auto-chunking is used
- ESLint rules are slightly relaxed (warnings on `no-explicit-any`, `no-unused-vars`) to allow incremental codebase cleanup
- `.claude/` directory exists (likely for Claude Code session data); not part of source code
- `.cursor/` directory present (Cursor IDE rules); check if updates needed when modifying styles or patterns
