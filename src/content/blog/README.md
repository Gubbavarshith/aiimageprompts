# Blog Authoring Guide

Store all blog posts as markdown files in this folder.

## File naming

- Use a readable file name, for example `weekly-ai-roundup-2026-04-26.md`
- The filename does not define the route; `slug` in frontmatter does.

## Required frontmatter

```yaml
---
title: "Post title"
slug: "post-slug"
date: "2026-04-26"
author: "Editorial"
category: "News"
excerpt: "Short summary shown in blog cards and meta description fallback."
imageUrl: "https://example.com/cover.jpg"
tags: ["tag-one", "tag-two"]
status: "Published"
---
```

## Optional frontmatter

```yaml
metaTitle: "Custom SEO title"
metaDescription: "Custom SEO description"
showToc: true
```

## Notes

- Only posts with `status: "Published"` are shown publicly and included in sitemap.
- Content is written in markdown and converted to HTML at build/runtime.
- Use `##` and `###` headings for best table-of-contents output.
