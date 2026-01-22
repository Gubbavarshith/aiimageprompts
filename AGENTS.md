# AGENTS.md - AI Image Prompts Codebase Guide

This document provides essential information for AI agents working in this repository.

## Project Overview

A React + TypeScript web application for discovering and sharing AI image generation prompts.
Built with Vite, Tailwind CSS, shadcn/ui components, and Supabase backend.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui (New York style), class-variance-authority
- **State/Routing**: React Router DOM v7, React Context
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Auth**: Clerk for user auth, Supabase auth for admin
- **Animation**: Framer Motion
- **Rich Text**: TipTap editor
- **3D**: React Three Fiber, Three.js

## Build/Lint/Test Commands

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

## Project Structure

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

## Code Style Guidelines

### Imports

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

### Path Aliases

Use the `@/` alias for all `src/` imports:
- `@/components/*` - UI components
- `@/lib/*` - Utilities and services
- `@/hooks/*` - Custom hooks
- `@/contexts/*` - Context providers
- `@/pages/*` - Page components

### TypeScript

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

### Naming Conventions

- **Files**: PascalCase for components (`ExplorePage.tsx`), camelCase for utilities (`utils.ts`)
- **Components**: PascalCase (`PromptCard`, `FloatingNavbar`)
- **Hooks**: camelCase with `use` prefix (`useToast`, `useAuth`)
- **Services**: camelCase (`fetchPrompts`, `createPrompt`)
- **Types**: PascalCase (`PromptRecord`, `ToastType`)
- **Constants**: SCREAMING_SNAKE_CASE (`TABLE_NAME`, `IMAGE_RATIOS`)
- **CSS classes**: Tailwind utilities, kebab-case for custom classes

### Component Patterns

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

### Styling

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

### Error Handling

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

### Supabase Patterns

- Always check `isSupabaseReady()` before database operations
- Use typed responses with `as TypeName`
- Handle both `error` and empty `data` cases
- Use `.maybeSingle()` for optional single results

### Lazy Loading

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

### Environment Variables

- Prefix with `VITE_` for client-side access
- Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Access via `import.meta.env.VITE_*`
- Never commit secrets - use `.env.local` for local development

### Security

- Use `sanitizeInput()` or `sanitizeForStorage()` from `@/lib/utils` for user input
- Validate URLs before use
- Never expose API keys in client code
- Supabase RLS policies handle authorization

## Common Patterns

### Toast Notifications
```typescript
import { useToast } from '@/contexts/ToastContext'

const { success, error } = useToast()
success('Prompt saved!')
error('Failed to save prompt')
```

### Service Layer
All database operations go through `src/lib/services/`:
- `prompts.ts` - CRUD for prompts
- `categories.ts` - Category management
- `savedPrompts.ts` - User bookmarks
- `ratings.ts` - Prompt ratings

### Route Configuration
Static routes defined in `src/config/routes.ts` for sitemap generation.
Dynamic routes (`/prompt/:slug`, `/blog/:slug`) fetched from database.

## Icons

Use Lucide React for icons:
```typescript
import { Search, Copy, Check } from 'lucide-react'
<Search className="w-4 h-4" />
```