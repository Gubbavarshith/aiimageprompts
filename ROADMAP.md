# AI Image Prompts — Master Scaling & Growth Roadmap

_Last updated: 2026-06-18 • Owner: Varshith_

This is the single source of truth for taking **aiimageprompts.xyz** from a working
early-stage product to an aggressively-scaled, SEO-led growth machine. It is
staged on purpose: **fix the foundation → harden SEO infrastructure → scale
content & keywords → monitor and compound.** Do the stages roughly in order;
skipping ahead (e.g. pouring traffic in before the data layer is fixed) is how you
burn money and rankings.

Legend: ✅ done · �doing · ⏳ todo · 🔵 optional/later · 👤 needs you (not code)

---

## The strategy in one paragraph

We are building **topical authority** in the "AI image prompts" space through two
engines running in parallel: **(1) programmatic pages at scale** (every prompt,
category, and tag becomes a unique, indexable, internally-linked page — this is
how a directory legitimately reaches tens of thousands of ranking URLs) and
**(2) editorial hub-and-spoke content** (deep pillar guides + clusters of
supporting blog posts targeting low-competition, high-intent, high-volume
keywords). Underneath both, the app must be fast, cacheable, and cheap to serve.
That's the whole game. Stages below.

---

## SEO standards & benchmarks (what "professional" actually means)

You asked what the standard is. Here are the real numbers and rules pros use:

**Content velocity**
- There is no magic post count. **Quality-adjusted consistency beats raw volume.**
  Niche authority sites sustainably publish **2–5 posts/week**. Daily is fine
  *only* with an editorial process and genuine usefulness per post.
- ⚠️ **"Scaled content abuse"** is an official Google spam policy (March 2024).
  Mass-produced, thin, or template-spun AI articles get demoted or deindexed.
  Your blog volume must clear a quality bar; your *scale* comes from programmatic
  pages, not blog spam.

**Keyword targeting (the "sweet spot")**
- Target **low difficulty + real intent**: roughly **KD < 20–30**, **volume
  100–2,000/mo**, clear informational or commercial intent. These are
  "striking-distance" terms you can actually rank for in 1–3 months.
- Build **topical clusters**, not scattered one-offs: 1 pillar + 10–30 supporting
  pages per topic. Google rewards depth of coverage, not breadth of guesses.

**Technical SEO baseline (non-negotiable)**
- **Core Web Vitals:** LCP < 2.5s, INP < 200ms, CLS < 0.1 (field data, not lab).
- Crawlable, indexable, canonical-clean, fresh XML sitemaps, fast HTML for bots
  (you already prerender — good), correct schema, sane internal linking.
- **IndexNow** for instant indexing (you already have a key — wire it up fully).

**GEO / AI search (the new frontier)**
- AI Overviews, ChatGPT, Perplexity now drive meaningful traffic. Optimize for
  citation: clear factual passages, schema, `llms.txt` (you have one), and
  well-structured Q&A content.

**Tools to get live data** (run these skills when you reach Stage C):
`/seo-cluster` (topic clustering), `/seo-content-brief` (per-post briefs),
`/seo-dataforseo` (live volume/KD/SERP data), `/seo-plan`, `/seo-technical`,
`/seo-schema`, `/seo-geo`. Don't target keywords on guesses — validate volume/KD
with real data first.

---

# STAGE A — Technical Foundation & Scaling Hardening

**Goal:** the app must be correct, fast, cheap to serve, and observable *before*
we send it traffic. Several A-items are already done from the debugging session.

### A1. Core bug & data-layer fixes — ✅ DONE
- ✅ Infinite "Loading more" spinner (self-cancelling IntersectionObserver) fixed.
- ✅ Replaced fragile two-step `.in('id', …)` fetch with a single, `.range()`-paginated
  query (no more 1000-row cap, no URL-length bomb).
- ✅ Removed prod module-load `throw` that white-screened the whole app.
- ✅ Added error + Retry UI on Explore.
- ✅ Revoked public EXECUTE on `set_updated_at` SECURITY DEFINER function.

### A2. Database indexes for the hot paths — ✅ DONE (2026-06-18)
**Why:** `prompts` previously had indexes only on `id` and `user_id`. Every public
query ran `WHERE status='Published' ORDER BY created_at` as a **full table scan +
sort** — invisible at 131 rows, a real bottleneck at 10k+ under traffic.
Applied via migration `add_prompts_hot_path_indexes`:
- ✅ A2.1 — btree `idx_prompts_status_created` on `(status, created_at DESC)` (main Explore/feed query).
- ✅ A2.2 — btree `idx_prompts_status_category_created` on `(status, category, created_at DESC)` (category pages).
- ✅ A2.3 — GIN `idx_prompts_tags_gin` on `tags` (array containment for tag filtering).
- 🔵 A2.4 — `pg_trgm` GIN index on `title`/`prompt` for search → **deferred to A4** (build with the search feature).
- ✅ A2.5 — Not needed: `prompt_ratings` already covered by its composite `(prompt_id, …)` unique indexes, and `prompt_discovery_events` already has `prompt_id`/`created_at`/`source`/`from_prompt_id` indexes.

### A3. Server-side pagination & filtering on Explore — ⏳ TODO (highest scaling value)
**Why:** the page downloads ALL prompts to the browser and filters in JS. Fine at
131; at 10k it's a multi-MB payload every visit → slow mobile + **Supabase egress
cost** (the bill that explodes when you go viral).
- A3.1 — Move category/tag/sort filtering to the DB query (`.eq`, `.contains`, `.range`).
- A3.2 — Fetch 20–24 per page from the server on scroll, not the whole table.
- A3.3 — Keep the prerendered/SSG pages as the SEO-facing version (bots get full HTML).

### A4. Real search (replaces client-side `.includes()`) — ⏳ TODO
- A4.1 — Postgres full-text search (`tsvector`) or `pg_trgm` similarity on
  `title` + `prompt` + `tags`, exposed via an RPC.
- A4.2 — Debounced server search; fall back gracefully.
- 🔵 A4.3 — If it outgrows Postgres, move to a search service (Meilisearch/Typesense/Algolia).

### A5. Read caching / egress control — ⏳ TODO
- A5.1 — Cache the public prompts/category responses at the edge (Vercel cache
  headers / a thin caching API route) so visitors don't all hit Postgres.
- A5.2 — Set `Cache-Control` + `stale-while-revalidate` on read endpoints.
- A5.3 — Serve prompt images through a CDN/transform layer (Supabase image
  transform or a CDN) with proper sizing + WebP/AVIF.

### A6. Environment & secrets hygiene — 👤 + ⏳
- A6.1 — 👤 **Fix the key/env drift:** set Vercel env vars to the new
  `sb_publishable_` key (Production/Preview/Dev) and redeploy. The live bundle
  currently ships the **legacy** anon JWT — a time bomb when Supabase disables
  legacy keys.
- A6.2 — Audit that no secret keys are ever in client bundles.
- A6.3 — Document required env vars in the repo.

### A7. Observability & safety nets — ⏳ TODO
- A7.1 — Error tracking (Sentry or similar) on frontend + any edge functions.
- A7.2 — Uptime + Core Web Vitals monitoring (you have Vercel Speed Insights —
  also add field-data alerting).
- A7.3 — DB backups confirmed + a staging/preview Supabase branch for migrations.
- A7.4 — Rate limiting on writes (ratings, contact, submissions) to stop abuse at scale.

### A8. Core Web Vitals performance pass — ⚙️ IN PROGRESS (safe wins done 2026-06-18)
- ✅ A8.1 — Audited LCP path: landing already defers the canvas hero animation
  until after LCP and lazy-loads all below-the-fold sections; LCP element is plain
  text (no blocking image). Good baseline.
- ✅ A8.3 — Added `width/height` + `decoding=async` to hero avatars (CLS), and
  preconnect/dns-prefetch to the Supabase domain (first API call + all prompt
  images) and `api.dicebear.com`. Pure speed/stability wins, no visual change.
- ✅ A8.2 — Removed unused 3D deps (`three`, `@react-three/fiber`, `@react-three/drei`)
  from package.json (2026-06-18). They were imported nowhere; removing them speeds up
  Vercel installs/deploys and shrinks the dependency/security surface. Build verified
  green afterward. (Further splitting the 620 KB entry chunk would need manual
  chunking, which CLAUDE.md flags as previously breaking — left alone.)
- ⏳ A8.4 — Measure real field CWV (LCP < 2.5s, INP < 200ms, CLS < 0.1) via
  PageSpeed Insights / Search Console once promo traffic arrives.
- ✅ A8.5 — **Mobile responsive fix (2026-06-18).** Verified every public page with
  a headless browser at 390px and 360px widths. Found the home page overflowed
  horizontally (495px on a 390px screen) — caused by decorative blur/glow divs
  (e.g. `w-[600px]`) that weren't clipped, which made content look shifted/cut off.
  Fixed globally with `html, body { overflow-x: clip; max-width: 100% }` in
  `src/index.css` (clip is sticky-safe). Re-verified: **0 overflow on all pages at
  both widths.** (Playwright added as a devDependency for ongoing visual QA.)

### A9. Security advisors cleanup — ⚙️ PARTIAL
- ✅ SECURITY DEFINER function locked down (A1).
- 👤 A9.1 — Enable leaked-password protection (Supabase Auth dashboard toggle).
- ⏳ A9.2 — Re-run `get_advisors` after each migration; keep it clean.

**Exit criteria for Stage A:** Explore loads fast with server pagination; indexes
in place; egress controlled; env aligned; errors visible in a dashboard; CWV green.

---

# STAGE B — SEO Technical & On-Page Infrastructure

**Goal:** make every page maximally crawlable, indexable, and rich — and build the
**programmatic page system** that will scale to thousands of URLs. Do this before
mass content so new pages are born optimized.

### B1. Crawlability & indexation — ⏳ TODO
- B1.1 — Dynamic, always-fresh sitemaps (prompts, categories, tags, blog) — already
  generated at build; ensure they regenerate on new content + ping IndexNow.
- B1.2 — Wire up **IndexNow** fully (key exists) so new/updated URLs are submitted instantly.
- ✅ B1.3a — **Canonical/OG duplication fixed (2026-06-18).** The SSG was *appending*
  per-page canonical + OG/Twitter tags without removing the base template's homepage
  ones, so **all 188 prerendered pages had two `<link rel="canonical">` (homepage +
  correct) and duplicate `og:title`/`og:description`**. Risk: Google picks the homepage
  canonical → prompt/category/blog pages never get indexed individually (would have
  sabotaged the whole programmatic-SEO plan); social shares could show the homepage
  title. Fixed `injectIntoShell` in `scripts/ssg/core/html.mjs` to strip the template's
  SEO tags before injecting a single clean set. Verified: 0/188 pages with a wrong
  canonical count; OG titles are page-specific.
- B1.3b — Remaining: confirm `?category=`/`?tag=`/`?q=` URL canonical/noindex rules at
  scale (partly handled in `buildExploreSeoState`).
- B1.3 — robots.txt verified: crawlable, sensible disallows (admin/auth/saved/api), all 5
  sitemaps referenced. ✅
- B1.4 — Google Search Console + Bing Webmaster set up, sitemaps submitted, coverage monitored.

### B2. Structured data / schema at scale — ⏳ TODO
- B2.1 — `ImageObject` + `CreativeWork` schema on every prompt page.
- B2.2 — `CollectionPage` + `ItemList` on Explore/category pages (partly present).
- B2.3 — `BreadcrumbList` everywhere (present on Explore — extend site-wide).
- B2.4 — `Article` + `Author`/`Organization` (E-E-A-T) on blog posts.
- B2.5 — `FAQPage` schema on pages with Q&A blocks.
- B2.6 — Validate with `/seo-schema` and Rich Results Test.

### B3. Programmatic page templates (the scale engine) — ⏳ TODO
**This is the single biggest organic-growth lever for a directory.**
- B3.1 — **Prompt detail pages** (`/prompt/:slug`): unique title/H1/meta, the prompt,
  example image, model tags, related prompts, copy CTA, schema. ~1 page per prompt.
- B3.2 — **Category pages** (`/explore?category=` → ideally clean `/category/:slug`):
  unique intro copy, curated grid, internal links, FAQ. Target "[category] AI prompts".
- B3.3 — **Tag pages**: same pattern for long-tail "[tag] prompts".
- B3.4 — **Use-case / tool landing pages**: "Midjourney prompts for X",
  "Stable Diffusion [style] prompts", "DALL·E [subject] prompts" — templated from data.
- B3.5 — ⚠️ **Thin-content guardrails:** every programmatic page needs *unique* value
  (real prompt, image, description) — never empty templates, or you trigger
  "scaled content abuse." Set a minimum-content gate before a page is indexable.
- B3.6 — Pretty URLs: migrate `/explore?category=x` → `/category/x` for cleaner SEO
  (with redirects).

### B4. Internal linking architecture (hub-and-spoke) — ⚙️ IN PROGRESS
- B4.1 — Pillar pages link to all cluster pages and vice-versa.
- ✅ B4.2 — Prompt pages now link to their **category (clean `/categories/:slug` URL)**,
  **6 related prompts in the same category** (grid with thumbnails), and relevant blog
  posts (2026-06-18). Also added a visible **breadcrumb** (Home › Explore › Category ›
  Prompt) + **BreadcrumbList JSON-LD** schema. This ends the prompt-page dead-ends so
  crawlers and link equity flow between prompts. See `scripts/ssg/renderers/prompts.mjs`.
- B4.3 — Blog posts link to relevant prompts/categories (content → product).
- B4.4 — Automated "related" modules to spread link equity and crawl depth.

### B5. Metadata & social/OG at scale — ⏳ TODO
- B5.1 — Per-page title/description templates that stay unique across thousands of pages.
- B5.2 — Auto-generated OG images per prompt/category (dynamic image endpoint).
- B5.3 — Twitter/X cards, Pinterest-rich pins (visual platform = big for image prompts).

### B6. GEO / AI-search optimization — ⏳ TODO
- B6.1 — Keep `llms.txt` current; ensure key pages are AI-crawlable.
- B6.2 — Structure content in citable passages (clear answers, definitions, lists).
- B6.3 — Track brand mentions/citations in AI Overviews, ChatGPT, Perplexity (`/seo-geo`).

**Exit criteria for Stage B:** programmatic templates live with unique content +
schema; internal linking automated; GSC clean; new pages auto-submitted via IndexNow.

---

# STAGE C — Aggressive Content & Keyword Strategy

**Goal:** dominate clusters of low-competition, high-value keywords with a
sustainable, high-velocity content operation. Only start once A & B are solid.

### C1. Keyword research & clustering — ⏳ TODO (do with live data)
- C1.1 — Seed list around: "ai image prompts", "midjourney prompts", "stable diffusion
  prompts", "dall e prompts", "ai art prompts", "[style] prompts", "[subject] prompts",
  "prompt for [use case]", "[tool] prompt examples".
- C1.2 — Expand + pull **volume/KD/intent with `/seo-dataforseo`**; filter to the
  sweet spot (KD < 20–30, volume 100–2k, clear intent). _Validate — don't guess._
- C1.3 — **Cluster by SERP overlap** with `/seo-cluster` → hub-and-spoke map.
- C1.4 — Prioritize clusters by (value × winnability ÷ effort). Build a backlog.

### C2. Content architecture (pillars + clusters) — ⏳ TODO
- C2.1 — Define 5–10 **pillar** topics (e.g. "Midjourney Prompts: Complete Guide",
  "AI Portrait Prompts", "AI Logo Prompts", per-tool guides).
- C2.2 — Map 10–30 **supporting posts** per pillar (long-tail how-tos, lists, comparisons).
- C2.3 — Each post maps to one primary keyword + 2–5 secondary, and links into product pages.

### C3. Editorial system & cadence — ⏳ TODO
- C3.1 — Set a **realistic, sustainable cadence** (recommend 3–5 quality posts/week to
  start; scale to daily only once the pipeline + quality bar are proven).
- C3.2 — Standardized **content brief** per post (`/seo-content-brief`): target keyword,
  intent, outline, word-count, internal links, schema, image plan.
- C3.3 — **E-E-A-T:** author bios, real expertise signals, sources, original images.
- C3.4 — Quality gate / review checklist before publish (kills the "scaled abuse" risk).
- C3.5 — You already have `npm run new:blog` — extend it into the briefed workflow.

### C4. Programmatic content at scale — ⏳ TODO
- C4.1 — Generate the B3 templated pages for the full keyword map ("[tool] prompts for
  [subject/style]") — backed by real prompts/images.
- C4.2 — Batch-submit via IndexNow; monitor indexation rate in GSC.
- C4.3 — Prune/merge thin or cannibalizing pages proactively.

### C5. Off-page & distribution — ⏳ TODO
- C5.1 — Link building: digital-PR, guest posts, "best AI prompt sites" listicles,
  tool directories, HARO/expert quotes.
- C5.2 — Social distribution where image content thrives: **Pinterest** (huge for this
  niche), X, Reddit communities, image-gen Discords.
- C5.3 — Email capture + newsletter (you have `email_subscriptions`) to build owned audience.

### C6. Measurement & iteration — ⏳ TODO
- C6.1 — Weekly GSC review: impressions, clicks, position, CTR by cluster.
- C6.2 — Rank tracking on target keywords.
- C6.3 — **Content refresh cycle:** update/upgrade pages that stall on page 2 ("striking
  distance") — often higher ROI than net-new posts.
- C6.4 — Double down on winning clusters; cut losers.

**Exit criteria for Stage C:** repeatable content engine shipping briefed, quality
content on a calendar; clusters ranking; programmatic pages indexed and growing traffic.

---

# STAGE D — Scale, Defend & Compound

**Goal:** keep growth compounding without technical debt or Google penalties biting.

### D1. Crawl budget & index hygiene — 🔵
- D1.1 — Monitor index bloat (params, near-duplicates); noindex/canonical low-value pages.
- D1.2 — Keep sitemaps lean and segmented; watch GSC "crawled – not indexed".

### D2. Infra scaling triggers — 🔵
- D2.1 — Define thresholds to upgrade Supabase tier (egress, connections, CPU).
- D2.2 — Add caching tiers / read replicas if read load demands it.
- D2.3 — Revisit search backend if Postgres FTS hits limits (A4.3).

### D3. Conversion & retention — 🔵
- D3.1 — Optimize signup/save/submit funnels; A/B test CTAs.
- D3.2 — Newsletter automation; bring users back to new prompts.
- D3.3 — UGC loop: user-submitted prompts (you have `/submit`) = free scaling content
  (with moderation — you have `/admin/review`).

### D4. Quarterly SEO + tech audits — 🔵
- D4.1 — `/seo-audit` full-site pass each quarter.
- D4.2 — Re-run Supabase `get_advisors`; keep CWV green; refresh schema as Google evolves.

---

## Recommended execution order (TL;DR)

1. **A2 + A6.1** — indexes + fix Vercel env (hours, unblocks everything).
2. **A3 + A4 + A5** — server pagination, search, caching (the real scaling work).
3. **A7 + A8** — observability + CWV (so you can see and survive traffic).
4. **B1–B3** — indexation, schema, programmatic templates (the scale engine).
5. **B4–B6** — internal links, OG at scale, GEO.
6. **C1–C3** — validated keyword clusters + editorial engine.
7. **C4–C6** — programmatic scale + distribution + iterate.
8. **D** — defend and compound.

> **Rule of thumb:** don't start Stage C spend until A3/A4/A5 are done. Sending
> aggressive traffic to a fetch-everything client app will be slow *and* run up
> egress bills — exactly the failure mode to avoid before a marketing push.

---

## Appendix — Verified evidence (from the live project, 2026-06-18)

- Project `aiimageprompts.xyz` (`hfncjkqzflreyfxvobxx`): ACTIVE_HEALTHY.
- 131 prompts, all `status='Published'`; RLS public-read policy correct.
- Exact public query returns all 131 rows (HTTP 200) anonymously with both the new
  `sb_publishable_` key and the legacy `eyJ…` key.
- Live bundle ships the **legacy** anon JWT, not the new key → env drift (A6.1).
- `prompts` table indexes: **only `id` + `user_id`** → missing hot-path indexes (A2).
- All tables tiny (largest is `bulk_upload_drafts` 544 kB) → no bloat yet; clean slate
  to fix the architecture before scaling.
- Browser inspection: prompts rendered fine, no console/network errors — the reported
  bug was purely the client-side infinite-scroll loop (fixed in A1).
</content>
