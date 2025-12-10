# Product Requirements Document (PRD)
## AI Image Prompt Library

---

## 1. Product Overview

**Product Name:** aiimageprompt.xyz

**Purpose:** A free, public library of AI image prompts with preview images that anyone can browse and copy instantly.

**Target Audience:** AI artists, designers, content creators, and anyone interested in AI image generation.

**Core Value:** Zero-friction access to high-quality AI prompts — no signup required.

---

## 2. Product Goals

- Launch a simple, fast-loading prompt library
- Provide 500-600 quality prompts at launch
- Build organic traffic through SEO and social media
- Keep maintenance simple with admin dashboard
- Scale content easily over time

---

## 3. Features & Requirements

### 3.1 Public Features

#### Landing Page
- Hero section explaining the website
- CTA button to browse library
- Minimal, clean design
- Fast loading

#### Library Page (Main Page)
- Display all prompts as cards
- Each card shows:
  - Preview image (WebP format)
  - Prompt title
  - Category tag
  - Short description
  - "Copy Prompt" button
- Category filter tabs (Portraits, Cinematic, Anime, Logos, UI/UX, etc.)
- All browsing happens on one page
- Smooth filtering/searching

#### Supporting Pages
- Privacy Policy
- Terms of Use
- About Page (optional)
- Contact Page (optional)

### 3.2 Admin Features (Private)

**Admin Dashboard** for content management:
- Add new prompts
- Edit existing prompts
- Upload/replace preview images
- Publish/unpublish prompts
- Manage categories
- View all prompts in table format

**Access:** Password-protected, admin-only

---

## 4. Content Specifications

### Prompts
- **Initial Count:** 500-600 prompts
- **Structure per prompt:**
  - Prompt title
  - Prompt text (main)
  - Negative prompt (optional)
  - Category
  - Tags
  - Preview image (WebP, ~150-200 KB)

### Categories
- Portraits
- Cinematic
- Anime
- Logos
- UI/UX
- [Additional categories as needed]

---

## 5. Technical Requirements

### Tech Stack
- **Framework:** React.js (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Optional/Mocked)
- **Image Format:** WebP

### Performance Requirements
- Fast page load (<2 seconds)
- Optimized images
- Mobile responsive
- SEO-friendly

### Storage Estimates
- 600 prompts × 150-200 KB images = ~120 MB
- Well within Supabase 1GB free limit

---

## 6. User Flows

### Primary Flow (Visitor)
1. Land on homepage
2. Click "Browse Library"
3. See all prompts
4. Filter by category (optional)
5. Click "Copy" on desired prompt
6. Use prompt elsewhere

### Admin Flow
1. Login to admin dashboard
2. Add/edit prompts
3. Upload images
4. Publish content
5. Manage categories

---

## 7. Design Requirements

- **Style:** Clean, minimal, modern
- **Colors:** Simple palette, easy on the eyes
- **Typography:** Readable, professional
- **Layout:** Card-based grid for prompts
- **Mobile:** Fully responsive
- **No Clutter:** Focus on content

---

## 8. What We're NOT Building (Phase 1)

- User accounts
- Login/signup
- Favorites/bookmarks
- Newsletter
- Payments
- Ads
- Social features
- Comments

*(These may come later after growth)*

---

## 9. Success Metrics

- Website launches successfully
- 500-600 prompts live
- Fast page load times
- Mobile-friendly
- Admin can easily add content
- Clean, professional appearance

---

## 10. Launch Checklist

**Before Launch:**
- [ ] Landing page complete
- [ ] Library page functional
- [ ] 500-600 prompts added
- [ ] All images optimized (WebP)
- [ ] Categories organized
- [ ] Admin dashboard working
- [ ] Privacy Policy live
- [ ] Terms of Use live
- [ ] Mobile testing done
- [ ] SEO basics (meta tags, titles)

**After Launch:**
- [ ] Promote on social media
- [ ] Share in WhatsApp channels
- [ ] Add new prompts regularly
- [ ] Monitor performance
- [ ] Gather feedback

---

## 11. Future Considerations (Phase 2+)

After the site gains traction:
- User accounts
- Newsletter signup
- Save/favorite prompts
- Premium prompt packs
- Affiliate links for AI tools
- AdSense integration

**Timeline:** Only after organic growth is proven

---

## 12. Summary

This is a **simple, focused product** with:
- 2 main pages (Landing + Library)
- Clean admin backend
- 500-600 prompts at launch
- No user friction
- Fast, SEO-friendly design
- Easy to maintain and scale