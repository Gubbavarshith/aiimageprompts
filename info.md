# AI Image Prompts - Website Information

## 📌 Overview

**Website:** aiimageprompt.xyz

**Purpose:** A free, public library of AI image prompts with preview images that anyone can browse and copy instantly.

**Target Audience:** AI artists, designers, content creators, and anyone interested in AI image generation.

**Core Value Proposition:** Zero-friction access to high-quality AI prompts — no signup required to browse and copy prompts.

---

## 🎯 What This Website Does

AI Image Prompts is like a recipe book for AI art. Instead of cooking recipes, it provides text prompts — the instructions that tell AI tools like Midjourney, DALL-E, and Stable Diffusion exactly what kind of image to create.

### Key Features

1. **Browse Prompt Library** - Explore thousands of curated AI image prompts, each with:
   - Preview image showing the result
   - Descriptive title
   - Full prompt text (ready to copy)
   - Category and tags for easy discovery

2. **Search & Filter** - Find prompts by:
   - Style (cyberpunk, watercolor, minimalist, etc.)
   - Subject matter (portraits, landscapes, characters)
   - Mood or theme (dark, vibrant, peaceful)
   - Category filtering

3. **One-Click Copy** - Instantly copy any prompt to clipboard, no signup required

4. **Save Favorites** - Authenticated users can save prompts to their personal collection

5. **Submit Prompts** - Community members can submit their own prompts for review

6. **Blog** - Articles about AI art, prompt engineering tips, and updates

---

## 🗂️ Categories

The website organizes prompts into various categories including:

- **Portraits** - Human faces, character designs, portrait photography
- **Anime** - Anime-style illustrations and character art
- **Logos** - Logo designs and brand identity graphics
- **UI/UX** - User interface elements and design mockups
- **Cinematic** - Movie-like scenes with dramatic lighting
- **3D Art** - Three-dimensional renders and CGI-style images
- **Photography** - Realistic photography-style images
- **Illustrations** - Various illustration styles and artistic renderings

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.7.3 | Type-safe JavaScript |
| Vite | 6.0.5 | Build tool & dev server |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| React Router DOM | 7.1.3 | Client-side routing |
| Framer Motion | 12.23.24 | Animations |

### Backend & Services
| Service | Purpose |
|---------|---------|
| Supabase | Database, storage, authentication, edge functions |
| Clerk | User authentication & management |
| Vercel | Hosting & deployment |
| Vercel Analytics | Website analytics |
| Resend | Email service |

### UI Components & Libraries
- **Lucide React** - Icons
- **Radix UI** - Accessible UI primitives
- **Tiptap** - Rich text editor (for blog posts)
- **Recharts** - Charts and analytics visualization
- **Three.js / React Three Fiber** - 3D graphics
- **class-variance-authority** - Component variants
- **tailwind-merge** - Tailwind class merging

---

## 📄 Page Structure

### Public Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing Page | Hero section, introduction, CTA to explore |
| `/explore` | Explore Page | Main prompt library with search, filter, grid display |
| `/prompt/:slug` | Prompt Detail | Individual prompt view with copy, share, related prompts |
| `/submit` | Submit Prompt | Form to submit new prompts for review |
| `/saved` | Saved Prompts | User's saved/favorite prompts (requires auth) |
| `/blog` | Blog List | List of blog posts |
| `/blog/:slug` | Blog Post | Individual blog post |
| `/about` | About | About the website |
| `/contact` | Contact | Contact form |
| `/faq` | FAQ | Frequently asked questions |
| `/guidelines` | Guidelines | Prompt submission guidelines |
| `/donate` | Donate | Support the project |
| `/terms` | Terms of Service | Legal terms |
| `/privacy` | Privacy Policy | Privacy information |
| `/cookies` | Cookie Policy | Cookie usage information |
| `/refund` | Refund Policy | Refund information |
| `/auth/*` | Authentication | Login/signup flows |

### Admin Pages (Protected)
| Route | Page | Description |
|-------|------|-------------|
| `/admin/login` | Admin Login | Admin authentication |
| `/admin/dashboard` | Dashboard | Overview & analytics |
| `/admin/prompts` | Prompts | Manage all prompts |
| `/admin/bulk` | Bulk Upload | CSV-based prompt upload |
| `/admin/review` | Review Prompts | Review community submissions |
| `/admin/categories` | Categories | Manage category metadata |
| `/admin/tags` | Tags | Manage tag aliases |
| `/admin/blogs` | Blog List | Manage blog posts |
| `/admin/blogs/new` | Blog Editor | Create/edit blog posts |
| `/admin/blogs/:id` | Blog Editor | Edit existing post |
| `/admin/explore-hero` | Hero Tools | Manage featured AI tools |
| `/admin/subscriptions` | Subscriptions | Manage email subscribers |
| `/admin/settings` | Settings | App settings & maintenance mode |
| `/admin/links` | Link Tracking | Create tracked/short links |
| `/admin/google-analytics` | Analytics | Google Analytics integration |

---

## 💾 Database Structure

The application uses **Supabase** with the following main tables:

### Core Tables
- **prompts** - All AI image prompts with metadata
- **category_meta** - Category icons, colors, descriptions
- **prompt_ratings** - User ratings for prompts
- **saved_prompts** - User's saved/favorite prompts
- **profiles** - User profile information

### Content Tables
- **blog_posts** - Blog articles with SEO metadata
- **reusable_blocks** - Reusable HTML content blocks

### Analytics & Tracking
- **prompt_discovery_events** - How users discover prompts
- **tracked_links** - Short/trackable links with UTM params
- **link_clicks** - Click events for tracked links

### Configuration
- **app_settings** - Key-value store for app settings
- **explore_hero_tools** - Featured AI tools on explore page
- **tag_aliases** - Tag alias mappings
- **email_subscriptions** - Newsletter subscribers

---

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── admin/           # Admin-specific components
│   ├── explore/         # Explore page components
│   ├── landing/         # Landing page components
│   ├── modals/          # Modal components
│   └── ui/              # Base UI components (buttons, inputs, etc.)
├── config/              # Configuration files
├── contexts/            # React contexts (Auth, Admin)
├── hooks/               # Custom React hooks
├── layouts/             # Layout components (Auth, Admin layouts)
├── lib/                 # Utilities and services
│   ├── services/        # API service functions
│   └── utils/           # Utility functions
├── pages/               # Page components
│   └── admin/           # Admin dashboard pages
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
└── index.css            # Global styles
```

---

## 🎨 Design System

### Colors
The design uses CSS custom properties with HSL colors for theming:
- **Primary** - Main brand color
- **Secondary** - Supporting color
- **Accent** - Highlight color (Yellow: `#FFDE1A`)
- **Background/Foreground** - Content colors
- **Muted** - Subtle backgrounds
- **Destructive** - Error/danger actions

### Typography
- **Body Font:** DM Sans
- **Display Font:** Sora
- **Monospace:** System monospace

### Features
- Dark mode support (class-based toggling)
- Responsive design (mobile-first)
- Glassmorphism effects
- Smooth animations with Framer Motion
- Accessible components via Radix UI

---

## ⚡ Performance Optimizations

1. **Code Splitting** - Lazy loading for all pages except Landing
2. **Image Optimization** - WebP format for prompt previews
3. **Deferred Loading** - Maintenance guard loads after first paint
4. **Suspense Boundaries** - Loading states for async components
5. **Vercel Speed Insights** - Performance monitoring

---

## 🔐 Authentication Flow

1. **Public Users** - Can browse, search, copy prompts without signing up
2. **Authenticated Users** (via Clerk) - Can save prompts, submit new prompts
3. **Admin Users** - Email whitelist-based access to admin dashboard

---

## 📊 Analytics & Tracking

- **Vercel Analytics** - Page views and performance
- **Google Analytics** - Integration via admin panel
- **Custom Analytics** - Prompt discovery events tracking
- **Link Tracking** - Short links with click analytics

---

## 🚀 Deployment

- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Edge Functions:** Supabase Edge Functions for server-side logic

---

## 📝 Content Goals

- **Initial Launch Target:** 500-600 quality prompts
- **Ongoing:** Regular content additions
- **Blog:** AI art tips, prompt engineering guides, updates

---

## 👥 Target Users

- **AI Artists** - Find inspiration and discover new techniques
- **Designers** - Quick access to prompts for client projects
- **Content Creators** - Generate images for social media, blogs
- **Hobbyists** - Explore AI art creation
- **Students** - Learn about prompt engineering

---

## 📧 Contact & Support

Users can reach out through:
- Contact page form
- FAQ page for common questions
- Guidelines page for submission help

---

## 📜 Legal Pages

- Terms of Service
- Privacy Policy
- Cookie Policy
- Refund Policy

---

## 👨‍💻 Development Guidelines & Code Style

This section provides essential information for developers and AI agents working in this repository.

### Build/Lint/Test Commands

```bash
# Development server
npm run dev

# Production build (runs TypeScript check first)
npm run build

# Preview production build
npm run preview

# Lint all files
npm run lint
```

**Note**: There is no test framework configured. No test commands available.

### Detailed Project Structure

```
src/
  App.tsx                    # Main app with route definitions
  main.tsx                   # Entry point with providers
  components/
    ui/                      # shadcn/ui components (button, input, card, etc.)
    landing/                 # Landing page sections
    explore/                 # Explore page components
    admin/                   # Admin panel components
    modals/                  # Modal components
  pages/                     # Page components (one per route)
    admin/                   # Admin pages
  lib/
    utils.ts                 # Utility functions (cn, sanitize, etc.)
    supabaseClient.ts        # Supabase client setup
    services/                # Data access layer (prompts, categories, etc.)
    seo.ts                   # SEO utilities
  hooks/                     # Custom React hooks
  contexts/                  # React Context providers
  config/                    # App configuration (routes, etc.)
  layouts/                   # Layout components (AdminLayout, AuthLayout)
```

### Code Style Guidelines

#### Imports

Order imports in this sequence:
1. React and React libraries (`react`, `react-dom`, `react-router-dom`)
2. Third-party libraries (`framer-motion`, `lucide-react`, etc.)
3. Internal aliases using `@/` prefix
4. Relative imports (avoid when alias available)

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchPrompts } from '@/lib/services/prompts'
import { cn } from '@/lib/utils'
```

#### Path Aliases

Use the `@/` alias for all `src/` imports:
- `@/components/*` - UI components
- `@/lib/*` - Utilities and services
- `@/hooks/*` - Custom hooks
- `@/contexts/*` - Context providers
- `@/pages/*` - Page components

#### TypeScript

- **Strict mode enabled** - No implicit any, unused locals/parameters checked
- Export types alongside functions: `export type PromptRecord = {...}`
- Use `type` for object shapes, `interface` for component props
- Prefer explicit return types for service functions
- Use `as const` for constant arrays/objects

```typescript
export type PromptRecord = {
  id: string
  title: string
  prompt: string
  // ...
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}
```

#### Naming Conventions

- **Files**: PascalCase for components (`ExplorePage.tsx`), camelCase for utilities (`utils.ts`)
- **Components**: PascalCase (`PromptCard`, `FloatingNavbar`)
- **Hooks**: camelCase with `use` prefix (`useToast`, `useAuth`)
- **Services**: camelCase (`fetchPrompts`, `createPrompt`)
- **Types**: PascalCase (`PromptRecord`, `ToastType`)
- **Constants**: SCREAMING_SNAKE_CASE (`TABLE_NAME`, `IMAGE_RATIOS`)
- **CSS classes**: Tailwind utilities, kebab-case for custom classes

#### Component Patterns

Use functional components with hooks:

```typescript
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<StateType>(initialValue)
  
  useEffect(() => {
    // Effect logic
  }, [dependencies])
  
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}
```

For forwardRef components:
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => {
    return <button ref={ref} className={cn(...)} {...props} />
  }
)
Button.displayName = "Button"
```

#### Styling

- Use Tailwind CSS classes directly in JSX
- Use `cn()` utility from `@/lib/utils` to merge classes conditionally
- Follow shadcn/ui patterns for component variants using `cva`
- Dark mode: use `dark:` prefix, theme managed via class on root

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

#### Error Handling

- Wrap async operations in try/catch
- Log errors with context: `console.error('Error context:', error)`
- Throw descriptive Error objects from services
- Use toast notifications for user-facing errors

```typescript
export async function fetchPrompts() {
  if (!isSupabaseReady()) throw new Error('Supabase not configured')
  
  const { data, error } = await supabase.from(TABLE_NAME).select('*')
  
  if (error) {
    console.error('Error fetching prompts:', error)
    throw new Error(`Failed to fetch prompts: ${error.message}`)
  }
  
  return (data || []) as PromptRecord[]
}
```

#### Supabase Patterns

- Always check `isSupabaseReady()` before database operations
- Use typed responses with `as TypeName`
- Handle both `error` and empty `data` cases
- Use `.maybeSingle()` for optional single results

#### Lazy Loading

Use React.lazy for code splitting on routes:

```typescript
const ExplorePage = lazy(() => import('./pages/ExplorePage'))

// In JSX
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/explore" element={<ExplorePage />} />
  </Routes>
</Suspense>
```

#### Environment Variables

- Prefix with `VITE_` for client-side access
- Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Access via `import.meta.env.VITE_*`
- Never commit secrets - use `.env.local` for local development

#### Security

- Use `sanitizeInput()` or `sanitizeForStorage()` from `@/lib/utils` for user input
- Validate URLs before use
- Never expose API keys in client code
- Supabase RLS policies handle authorization

### Common Patterns

#### Toast Notifications
```typescript
import { useToast } from '@/contexts/ToastContext'

const { success, error } = useToast()
success('Prompt saved!')
error('Failed to save prompt')
```

#### Service Layer
All database operations go through `src/lib/services/`:
- `prompts.ts` - CRUD for prompts
- `categories.ts` - Category management
- `savedPrompts.ts` - User bookmarks
- `ratings.ts` - Prompt ratings

#### Route Configuration
Static routes defined in `src/config/routes.ts` for sitemap generation.
Dynamic routes (`/prompt/:slug`, `/blog/:slug`) fetched from database.

#### Icons

Use Lucide React for icons:
```typescript
import { Search, Copy, Check } from 'lucide-react'
<Search className="w-4 h-4" />
```

