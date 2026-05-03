# Google Search Console (GSC) — Complete SEO Rules & System

---

## 1. What Is Google Search Console?

```
GSC = Direct data from Google's own database.
NOT a third-party estimate (unlike SEMrush, Ahrefs, etc.).
It is the actual data Google uses to rank, index, and crawl your site.
```

**It covers:**
- Performance tracking (clicks, impressions, CTR, position)
- Keyword research (queries)
- Page-level analysis
- Technical SEO (indexing, crawling, errors)
- Schema/enhancement validation
- Sitemap management
- Crawl stats

> **Rule:** If you are not using GSC, you are flying blind. Set it up at search.google.com/search-console before anything else.

---

## 2. Core Metrics — Definitions & Rules

### 2.1 Clicks
```
What:   Number of times users clicked your URL from Google search results.
Rule:   Sort by clicks to find your strongest performing keywords/pages.
```

### 2.2 Impressions
```
What:   Number of times your URL was present on a loaded search results page.
        — Position 1–10 (page 1): earns impression even if user did NOT scroll to it.
        — Position 11+ (page 2+): only earns impression if user navigates to that page.

Rule 1: High impressions = high search demand for that keyword.
Rule 2: Sort by impressions to find opportunity keywords you are NOT yet clicking on.
Rule 3: High impressions + zero/low clicks = ranking opportunity. Go after it.
Rule 4: High impressions + position 30 = high-demand keyword you can rank for with work.
```

### 2.3 CTR (Click-Through Rate)
```
Formula: CTR = Clicks / Impressions

What:   How often users click your result when they see it.
        Reflects quality of your title tag + meta description.

Rule 1: High impressions + low CTR → fix the title tag and/or meta description.
Rule 2: Search the keyword on Google. See what competitors' listings look like. Match or beat intent.
Rule 3: Use best judgment — GSC CTR is an average and can be skewed by multi-country data.
Rule 4: Always filter by country (e.g., United States) before acting on CTR data.
```

### 2.4 Position
```
What:   Average ranking position across all searches for that keyword.
        — This is a rough average, not a precise rank.
        — Includes all countries unless filtered.

Rule 1: Not the most reliable metric in isolation.
Rule 2: Useful for detecting large drops (e.g., position 3 → position 20 = problem).
Rule 3: Always segment by country before making decisions based on position.
Rule 4: Clicks + impressions are more reliable signals than position alone.
```

---

## 3. Performance Report — Rules

```
Location: GSC → Performance → Full Report
```

### 3.1 Date Ranges
```
Available:  Last 24 hours / 7 days / 28 days / 3 months / custom / up to 16 months
Max:        16 months is the maximum historical data available.

Rule 1: Use 16-month view to spot long-term trends (growth or decline).
Rule 2: Use Compare tab to compare last 3 months vs. previous 3 months OR vs. same period last year.
Rule 3: A traffic drop? → compare periods → identify which keywords/pages lost clicks.
Rule 4: Export data to Google Sheets for deeper analysis.
```

### 3.2 Queries Tab (Keywords)
```
Rule 1: Default sort = clicks → shows keywords already bringing traffic (likely page 1).
Rule 2: Sort by impressions → reveals opportunity keywords with demand but low click volume.
Rule 3: High impressions + low or zero clicks = SEO opportunity. Improve content or CTR.
Rule 4: Export all queries as Google Sheet for bulk analysis.
Rule 5: With large sites, GSC caps display at 1,000 rows. Use Looker Studio to bypass this (see Section 9).
```

### 3.3 Pages Tab
```
Rule 1: Shows every page with total clicks + total impressions from ALL keywords it ranks for.
Rule 2: The TOP 20 pages by clicks or impressions = your biggest 80/20 SEO opportunities 90% of the time.
Rule 3: These pages already have Google's trust. Optimizing them = fastest traffic gains.
Rule 4: Click any page URL → it filters to show ONLY that page's ranking keywords.
Rule 5: Sort pages by impressions to find underperforming pages with hidden demand.
Rule 6: Analyze: is most traffic from /blog, /products, /collections, or /landing-pages?
         → If 80%+ is blog/informational, risk is HIGH with AI search. Diversify.
```

### 3.4 Other Tabs (Countries / Devices / Search Appearance / Dates)
```
Countries:
  Rule: Always filter to your target country (e.g., US) before analyzing CTR or position.

Devices:
  Rule: If mobile average position is much worse than desktop → mobile UX/technical issue. Fix it.

Search Appearance:
  Rule: Review product snippets, video results, image results for schema opportunities.
  Rule: Low-priority unless you have specific schema goals.

Dates:
  Rule: Useful only for deep day-level trend analysis. Not needed in routine workflows.
```

---

## 4. On-Page SEO Using GSC — Core Workflow

> This is the single highest-impact use of GSC.

### 4.1 The Process
```
Step 1: Go to Performance → Pages tab.
Step 2: Sort by impressions (or clicks).
Step 3: Click a page URL → see all keywords that page ranks for.
Step 4: For each keyword shown: Ctrl+F that keyword on your actual page.
Step 5: If the keyword is NOT on the page → ADD it. Write content around it.
Step 6: If a subtopic appears (e.g., "red hat benefits", "red hat colors") → add a subheading + content for it.
Step 7: Repeat for top 20 pages.
```

### 4.2 Rules
```
Rule 1: GSC keywords ARE the entities and topics Google expects on that page. Use them.
Rule 2: Adding GSC keywords to the page improves both keyword coverage AND topical relevance for the target keyword.
Rule 3: If a keyword appears in GSC but has no heading/section on the page → you are leaving ranking potential on the table.
Rule 4: Answer question-type keywords (e.g., "what are the benefits of X") with actual answers, not just mentions.
Rule 5: This technique works best on pages that are already ranking (positions 5–20). Push them to 1–3.
Rule 6: After optimizing a page, check back in GSC ~4 weeks later. See which new keywords it picked up.
```

---

## 5. CTR Optimization Workflow

```
Step 1: Performance → Pages → enable CTR column.
Step 2: Find pages with high impressions + low CTR.
Step 3: Click the page → note the top keyword.
Step 4: Search that keyword on Google. Look at how your listing appears.
Step 5: Compare your title tag and meta description to top-ranking competitors.
Step 6: Rewrite title tag and/or meta description to be more compelling and intent-matched.

Rule 1: Low CTR is almost always a title tag or meta description problem.
Rule 2: Always verify in actual Google SERP — do not rely solely on GSC averages.
Rule 3: GSC CTR is an average across all countries/time. Segment by country for accuracy.
```

---

## 6. Filters & Segmentation — Rules

### 6.1 Query Filters
```
Use case:       Filter keywords by text content.
Example:        Query contains "what" → informational intent keywords.
Example:        Query contains "glass cup" → all variations of that product keyword.

Rule: Use query filters to isolate keyword clusters by intent (informational, commercial, navigational).
```

### 6.2 Page Filters
```
Use case:       Filter pages by URL pattern.
Example:        Page contains "/blog"       → all blog page rankings.
Example:        Page contains "/collections" → all collection page rankings (Shopify).
Example:        Page contains "/products"   → all product page rankings.

Rule 1: Use page filters to understand which site sections drive traffic.
Rule 2: If /blog = 80% of traffic and it is all informational → high AI risk. Shift focus.
Rule 3: Diagnose traffic by section: blog vs. product vs. landing vs. local vs. service pages.
```

### 6.3 Regular Expressions (Regex Filters)
```
Location:  Add Filter → Query → Matches Regular Expression

Example regex for question keywords:
  who|what|when|where|how|why|do|does|is|are|can|should

Use case:  Surface all question-type keywords already generating impressions/traffic.

Rule 1: Question keywords with impressions but no dedicated page = blog post opportunity.
Rule 2: Use regex to bulk-identify keyword clusters (questions, brand mentions, product types).
Rule 3: Reference: "Python for SEO" (JC) has strong regex guides for GSC.
Rule 4: Do not sleep on regex filters — they surface opportunities no manual review finds.
```

---

## 7. Technical SEO — Indexing Report

```
Location: GSC → Indexing → Pages
```

### 7.1 Index vs. Non-Index Overview
```
Rule: Monitor total indexed vs. non-indexed pages over time.
      A sudden drop in indexed pages = critical problem. Investigate immediately.
```

### 7.2 "Why Pages Aren't Indexed" — Priority Issues

#### 404 Errors
```
What:   Google crawled a URL and found no page (broken/deleted page).
Rule 1: Export all 404s.
Rule 2: Redirect each 404 to the closest relevant live page using a 301 redirect.
Rule 3: In Shopify/WordPress: use built-in redirect tools. Learn platform-specific method.
```

#### Soft 404s
```
What:   Page loads but has no real content — Google treats it as empty.
Rule:   Same fix as 404. Redirect or restore content.
```

#### 5xx Server Errors
```
What:   Server errors. Google could not reach the page.
Rule:   These are critical. Google penalizes sites with frequent server errors. Fix immediately.
```

#### 4xx Errors (Non-404)
```
Rule:   Audit and redirect or remove these pages.
```

#### Crawled — Currently Not Indexed
```
What:   Google crawled the page but chose not to index it.
Rule 1: Review this list. Hidden inside are often important pages Google is ignoring.
Rule 2: For junk URLs (parameter URLs, filters, etc.): add noindex tag or block via robots.txt.
Rule 3: For pages you WANT indexed: use URL Inspection Tool → Request Indexing.
Rule 4: Clean up junk URLs to improve crawl budget allocation.
```

#### Discovered — Currently Not Indexed
```
What:   Google found the URL (via sitemap or links) but has not crawled or indexed it yet.
Rule 1: This is often MORE important than "Crawled — Not Indexed."
Rule 2: Check this list FIRST. Money pages sometimes end up here.
Rule 3: If important pages are here: check internal linking, page quality, and crawl budget.
Rule 4: Request indexing via URL Inspection Tool for critical pages.
```

---

## 8. URL Inspection Tool — Rules

```
Location:  GSC → URL Inspection (search bar at top) OR click any URL in any report.
```

```
Rule 1: Use to check if any specific URL is indexed by Google.
Rule 2: Use "Request Indexing" to force Google to crawl a page immediately.
Rule 3: Use "Test Live URL" → "View Crawled Page" to see the EXACT HTML Google receives.
         — Critical for JavaScript-heavy sites.
         — If Google cannot see your JS-rendered content, it cannot rank it.
Rule 4: "View Crawled Page" also shows a screenshot of what Googlebot sees visually.
Rule 5: Check "Page is linked by" → see if important pages lack internal links (fix it).
Rule 6: This is the only tool that shows you exactly what Google sees on your page. Use it.
```

---

## 9. Crawl Stats Report — Rules

```
Location:  GSC → Settings → Crawl Stats
```

```
Rule 1: Shows how many crawl requests Googlebot makes per day over the last 90 days.
Rule 2: Check "Crawl requests by response": 
        — High % of 404 errors in crawl requests = critical. Fix immediately.
        — Target: near-zero 404/5xx in crawl response breakdown.
Rule 3: Monitor crawl frequency trends. Low crawl frequency = Google deprioritizing your site.
Rule 4: Check for subdomain issues — too many subdomains can fragment crawl budget.
Rule 5: Googlebot type breakdown shows what types of content Google is prioritizing.
```

---

## 10. Sitemaps — Rules

```
Location:  GSC → Indexing → Sitemaps
```

```
Rule 1: Every site must have a sitemap submitted in GSC.
Rule 2: Status must show "Success." Any errors → investigate and fix.
Rule 3: Sitemap tells Google the structure and priority of your website.
Rule 4: For large sites: ensure sitemap is auto-updating (most CMS platforms do this).
Rule 5: Do not include 404 or noindex URLs in your sitemap.
```

---

## 11. Enhancements & Schema — Rules

```
Location:  GSC → Enhancements (e-commerce/schema-heavy sites)
```

```
Rule 1: Review review snippets (star ratings) — valid count should be stable or growing. 
        A drop to zero = schema broke on your site. Fix immediately.
Rule 2: Check FAQ schema, breadcrumb schema for errors.
Rule 3: For Shopify/e-commerce: monitor Shopping snippets and Merchant listings for validity.
Rule 4: Core Web Vitals — minor ranking factor at best. Prioritize user experience and page speed,
        but do not obsess over perfect CWV scores. Focus on fast, usable pages.
```

---

## 12. Removals Tool — Rules

```
Location:  GSC → Indexing → Removals
```

```
Rule 1: Use to request Google remove specific indexed URLs entirely.
Rule 2: Use case: junk/parameter URLs that are indexed and showing impressions 
        but have no SEO value.
Rule 3: Also add noindex tags + robots.txt blocks to prevent re-indexing.
```

---

## 13. Links Report — Rules

```
Location:  GSC → Links
```

```
Rule:  Shows external + internal links and top linking pages.
       Useful reference, but Ahrefs/Majestic/Moz provide cleaner backlink data.
       Use GSC Links for a quick internal link audit only.
```

---

## 14. Exporting All Keyword Data (Bypass 1,000-Row Limit)

> GSC caps the performance report at 1,000 rows. Large sites have 10,000–100,000+ keywords.

### Method: Looker Studio
```
Step 1: Go to lookerstudio.google.com → Create new report.
Step 2: Connect data source → Search Console.
Step 3: Select your property → choose "Site Impression" or "URL Impression."
Step 4: Add a Table → drag "Query" dimension into it.
Step 5: Remove "Property" dimension (not needed).
Step 6: Add Clicks and/or Impressions as metrics.
Step 7: Export table → CSV or Google Sheets.

Result: Access to ALL keywords (can be 20,000+ vs. 1,000 in native GSC).
```

### Method: GSC Chrome Extension
```
"Google Search Console Tool" Chrome extension.
Alternative bypass for quick bulk exports.
```

---

## 15. Priority Workflow — Daily / Weekly SEO System

```
WEEKLY ROUTINE:

1. Performance Report
   → Check clicks/impressions trend (vs. last period).
   → Flag any drops → drill into affected pages + keywords.

2. Pages Report (Top 20 by Impressions)
   → Pick 2–5 pages.
   → Click each → review ranking keywords.
   → Ctrl+F each keyword on the live page.
   → Add missing keywords + subtopic sections to page content.

3. CTR Review
   → Find pages with high impressions + low CTR.
   → Rewrite title tags + meta descriptions.

4. Indexing Report
   → Check "Crawled — Not Indexed" and "Discovered — Not Indexed."
   → Identify and request indexing for any important pages.
   → Redirect any new 404s found.

5. Regex Filter (Monthly)
   → Apply question keyword regex.
   → Export question keywords with impressions but no dedicated page.
   → Create content calendar from findings.
```

---

## 16. 80/20 Priority Rules Summary

```
FOCUS ON THESE (highest ROI):
  ✅ Performance Report (clicks + impressions)
  ✅ Pages Report (top 20 pages)
  ✅ On-page keyword injection from GSC data
  ✅ Crawled/Discovered Not Indexed reports
  ✅ 404 + 5xx error cleanup
  ✅ Sitemap validity
  ✅ CTR optimization (title tags)
  ✅ URL Inspection for JS content verification

LOWER PRIORITY (situational):
  ⬇ Average position (rough, use carefully)
  ⬇ Devices tab (unless mobile rankings are severely lagging)
  ⬇ Search Appearance (useful for schema, not routine)
  ⬇ Links Report (use Ahrefs/Majestic for serious backlink work)
  ⬇ Core Web Vitals (minor ranking signal — focus on UX, not the score)
  ⬇ Discover Report (low actionability)
  ⬇ Video Indexing (only if video is a core channel)
```

---

## 17. AI + GSC — Risk Awareness

```
Context: AI search (SGE, AI Overviews) is absorbing informational query traffic.

Rule 1: If /blog accounts for 80%+ of your traffic and it is all informational → HIGH RISK.
Rule 2: Use page filters (/blog, /products, /collections, /services) to audit traffic distribution.
Rule 3: Shift SEO investment toward transactional, commercial, and local pages.
Rule 4: Informational content still has value but must be deeper, more contextual, and more authoritative.
Rule 5: Queries are becoming longer and more intent-driven. Content must match this shift.
```

---

## 18. GSC API — Programmatic Access

### Setup
```
Step 1: Create project in Google Cloud Console.
Step 2: Enable Search Console API.
Step 3: Create credentials (OAuth 2.0 or Service Account).
Step 4: Add service account as a verified user on the GSC property.
```

### Endpoint
```
POST https://searchconsole.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
```

### Example Request Body
```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "dimensions": ["query"],
  "rowLimit": 1000
}
```

### Example Response
```json
{
  "rows": [
    {
      "keys": ["seo tools"],
      "clicks": 120,
      "impressions": 1000,
      "ctr": 0.12,
      "position": 5.2
    }
  ]
}
```

### Available Dimensions
```
query    → keywords
page     → URLs
country  → geo breakdown
device   → mobile / desktop / tablet
date     → time-series analysis
```

### API Use Cases
```
1. Keyword Opportunity Finder
   → Filter: impressions > threshold, clicks = low → optimize those pages.

2. Page Performance Tracker
   → Pull top pages over time → detect gains/drops automatically.

3. SEO Dashboard
   → Feed data into React dashboard, Google Sheets, or internal tools.

4. Automated Reporting
   → Daily/weekly data sync without manual GSC exports.

5. Traffic Drop Alerts
   → Compare periods programmatically → trigger alerts on significant drops.
```

---

## 19. Full SEO Intelligence System (Agent-Ready)

```
INPUT:
  GSC API data (queries, pages, clicks, impressions, CTR, position)

PROCESS:
  1. Detect high-impression / low-click opportunities → flag for content optimization.
  2. Detect pages in "Not Indexed" reports → flag for URL inspection / indexing request.
  3. Compare date ranges → detect traffic drops → identify affected pages + keywords.
  4. Regex filter question keywords → generate content gap list.
  5. Crawl stats error rate > 5% → trigger technical SEO alert.

OUTPUT:
  → Prioritized list of pages to optimize (with specific keywords to add).
  → List of pages to request indexing for.
  → List of 404s/5xxs to redirect.
  → Content calendar from question keyword gaps.
  → CTR improvement candidates (title/meta rewrites).

RESULT:
  GSC + API = Full SEO Intelligence System.
  Real data from Google. Automated insights. Scalable workflow.
```

---

*Sources: GSC SEO Tutorial 2025 (video transcripts) + GSC API reference guide.*
