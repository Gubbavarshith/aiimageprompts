# Supabase Database Tables

This document lists all the tables used in the AI Image Prompts application.

## Main Tables

### `prompts`
The primary table storing all AI image prompts.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `title` (text) - Prompt title
- `prompt` (text) - The actual prompt text
- `negative_prompt` (text, nullable) - Negative prompt text
- `category` (text) - Category name (free-form text, no foreign key)
- `tags` (text[], nullable) - Array of tags
- `preview_image_url` (text, nullable) - URL to preview image
- `status` (text) - Status: 'Published', 'Draft', 'Review', 'Pending', 'Rejected'
- `views` (integer) - View count (default: 0)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp
- `user_id` (text, nullable) - User who created the prompt
- `rating_avg` (numeric, nullable) - Average rating
- `rating_count` (integer) - Number of ratings (default: 0)
- `attribution` (text, nullable) - Attribution text
- `attribution_link` (text, nullable) - Attribution URL
- `scheduled_at` (timestamptz, nullable) - Scheduled publication time
- `image_ratio` (text) - Image aspect ratio: '1:1', '4:3', '16:9', '9:16', '21:9', '3:2', '2:3' (default: '4:3')

**Relationships:**
- Referenced by: `prompt_ratings`, `saved_prompts`, `prompt_discovery_events`

**RLS:** Enabled

---

### `category_meta`
Optional metadata for categories (icons, colors, descriptions, etc.).

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `category_name` (text, unique) - Category name (matches `prompts.category`)
- `icon` (text, nullable) - Icon identifier/URL
- `accent_color` (text, nullable) - Accent color hex code
- `description` (text, nullable) - Category description
- `is_featured` (boolean) - Whether category is featured (default: false)
- `display_order` (integer) - Display order (default: 0)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**RLS:** Disabled

---

### `prompt_ratings`
Stores user ratings for prompts.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `prompt_id` (uuid) - Foreign key to `prompts.id`
- `user_id` (text, nullable) - User who rated (if authenticated)
- `rating` (integer) - Rating value (1-5)
- `ip_hash` (text, nullable) - Hashed IP address for anonymous ratings
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- `rating >= 1 AND rating <= 5`

**RLS:** Enabled

---

### `saved_prompts`
User's saved/favorited prompts.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `user_id` (text) - User identifier
- `prompt_id` (uuid) - Foreign key to `prompts.id`
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**RLS:** Enabled

---

### `profiles`
User profile information.

**Columns:**
- `id` (uuid, primary key) - User ID (matches auth.users)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `display_name` (text, nullable)
- `bio` (text, nullable)
- `avatar_url` (text, nullable)
- `website` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS:** Enabled

---

### `email_subscriptions`
Email newsletter subscriptions.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `email` (text, unique) - Subscriber email
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `ip_address` (text, nullable) - Subscriber IP
- `country` (text, nullable) - Subscriber country
- `region` (text, nullable) - Subscriber region
- `city` (text, nullable) - Subscriber city
- `timezone` (text, nullable) - Subscriber timezone

**RLS:** Enabled

---

### `blog_posts`
Blog posts/articles.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `title` (text) - Post title
- `slug` (text, unique) - URL slug
- `excerpt` (text) - Post excerpt
- `content` (text) - Full post content
- `author` (text) - Author name
- `date` (date) - Publication date
- `read_time` (text) - Estimated read time
- `category` (text) - Post category
- `image_url` (text, nullable) - Featured image URL
- `tags` (text[], nullable) - Array of tags
- `status` (text) - Status: 'Published', 'Draft', 'Scheduled' (default: 'Draft')
- `meta_title` (text, nullable) - SEO meta title
- `meta_description` (text, nullable) - SEO meta description
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `scheduled_at` (timestamptz, nullable) - Scheduled publication time

**RLS:** Enabled

---

### `app_settings`
Application-wide settings (key-value store).

**Columns:**
- `key` (text, primary key) - Setting key
- `value` (text) - Setting value

**RLS:** Enabled

---

### `explore_hero_tools`
Featured AI tools displayed on explore page.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `name` (text) - Tool name
- `slug` (text, generated) - URL-friendly slug (auto-generated from name)
- `logo_url` (text) - Logo image URL
- `affiliate_link` (text) - Affiliate/referral link
- `color` (text) - Brand color hex (default: '#000000')
- `sort_order` (integer) - Display order (default: 0)
- `is_active` (boolean) - Whether tool is active (default: true)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS:** Enabled

---

### `tag_aliases`
Tag alias mappings (e.g., "ai" → "artificial-intelligence").

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `alias` (text, unique) - Alias tag name
- `canonical_tag` (text) - Canonical tag name
- `created_at` (timestamptz)

**RLS:** Disabled

---

### `prompt_discovery_events`
Analytics for how users discover prompts.

**Columns:**
- `id` (uuid, primary key) - Unique identifier
- `prompt_id` (uuid) - Foreign key to `prompts.id`
- `from_prompt_id` (uuid, nullable) - Source prompt (for related prompts)
- `source` (text) - Discovery source: 'related', 'category-chip', 'tag-chip', 'search-result', 'featured', 'direct'
- `category_at_click` (text, nullable) - Category when clicked
- `tag_at_click` (text, nullable) - Tag when clicked
- `user_id` (text, nullable) - User identifier (if authenticated)
- `anon_id` (text, nullable) - Anonymous user identifier
- `created_at` (timestamptz)

**RLS:** Disabled

---

## Notes

1. **Categories**: Categories are stored as free-form text in the `prompts.category` field. There's no separate categories table. The `category_meta` table is optional and provides metadata (icons, colors) for categories.

2. **RLS (Row Level Security)**: Most tables have RLS enabled for security. `category_meta` and `tag_aliases` have RLS disabled as they're considered public metadata.

3. **Foreign Keys**: The `prompts` table is referenced by several other tables, but categories themselves don't have foreign key constraints - they're just text fields.

4. **Auto-creation**: When uploading prompts via bulk upload, new categories are automatically created (they just need to be used in a prompt). Category metadata entries are optionally created in `category_meta` for new categories.

