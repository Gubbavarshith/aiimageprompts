import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { injectIntoShell, SITE } from '../core/html.mjs'
import {
  explorePage,
  aboutPage,
  faqPage,
  contactPage,
  submitPage,
  guidelinesPage,
  legalPage,
  donatePage,
} from '../core/templates.mjs'

export async function renderStaticPages({ distDir, projectRoot, indexHtml }) {
  const faqRaw = await readFile(join(projectRoot, 'src', 'content', 'FAQ-content.md'), 'utf8')
  const { body: faqBody, jsonLd: faqJsonLd } = faqPage(faqRaw)

  const pages = [
    {
      route: 'explore',
      title: 'Explore AI Image Prompts — Browse 1,000+ Prompts by Category',
      description:
        'Browse 1,000+ curated AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux. Filter by category, style, and mood to find the perfect prompt.',
      canonical: `${SITE}/explore`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'AI Image Prompts Library',
        description:
          'Curated AI image prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.',
        url: `${SITE}/explore`,
        provider: { '@type': 'Organization', name: 'AI Image Prompts', url: SITE },
      },
      body: explorePage(),
    },
    {
      route: 'about',
      title: 'About AI Image Prompts | Better Prompts, Better Art',
      description:
        'Learn about AI Image Prompts — a curated library of AI image prompts for designers, marketers, and creators who care about craft over boilerplate.',
      canonical: `${SITE}/about`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About AI Image Prompts',
        url: `${SITE}/about`,
        description: 'Our story and mission',
      },
      body: aboutPage(),
    },
    {
      route: 'faq',
      title: 'AI Image Prompts FAQ | Frequently Asked Questions',
      description:
        'Answers to common questions about AI image prompts — which models they work with, how to write better prompts, troubleshooting, and commercial usage.',
      canonical: `${SITE}/faq`,
      jsonLd: faqJsonLd,
      body: faqBody,
    },
    {
      route: 'contact',
      title: 'Contact AI Image Prompts | Get in Touch',
      description:
        'Contact AI Image Prompts with feedback, suggestions, partnership inquiries, or general questions about the prompt library.',
      canonical: `${SITE}/contact`,
      body: contactPage(),
    },
    {
      route: 'submit',
      title: 'Submit an AI Image Prompt | Contribute to the Library',
      description:
        'Submit your best AI image prompts to the community library. Share original, tested prompts for Midjourney, DALL·E, Stable Diffusion, and Flux.',
      canonical: `${SITE}/submit`,
      body: submitPage(),
    },
    {
      route: 'guidelines',
      title: 'Community Guidelines | AI Image Prompts',
      description:
        'Content standards and usage rules for the AI Image Prompts library. What you can submit, what is not allowed, and how moderation works.',
      canonical: `${SITE}/guidelines`,
      body: guidelinesPage(),
    },
    {
      route: 'terms',
      title: 'Terms of Service | AI Image Prompts',
      description: 'Terms of service for using the AI Image Prompts library and website.',
      canonical: `${SITE}/terms`,
      body: legalPage(
        'Terms of Service',
        'By using AI Image Prompts you agree to these terms.',
        '<p>Full terms are available on this page. Visit <a href="/about" style="color:#2563eb;">About</a> to learn more about our platform, or <a href="/contact" style="color:#2563eb;">Contact us</a> with questions.</p>'
      ),
    },
    {
      route: 'privacy',
      title: 'Privacy Policy | AI Image Prompts',
      description: 'Privacy policy for AI Image Prompts — how we collect, use, and protect your data.',
      canonical: `${SITE}/privacy`,
      body: legalPage(
        'Privacy Policy',
        'We respect your privacy. This policy explains how AI Image Prompts handles your data.',
        '<p>We collect minimal data necessary to operate the service. We do not sell your personal information. For questions, <a href="/contact" style="color:#2563eb;">contact us</a>.</p>'
      ),
    },
    {
      route: 'cookies',
      title: 'Cookie Policy | AI Image Prompts',
      description: 'Cookie policy for AI Image Prompts — what cookies we use and how to manage them.',
      canonical: `${SITE}/cookies`,
      body: legalPage(
        'Cookie Policy',
        'We use cookies to improve your experience on AI Image Prompts.',
        '<p>We use essential cookies for site functionality and optional analytics cookies to understand usage. You can manage cookie preferences in your browser settings.</p>'
      ),
    },
    {
      route: 'refund',
      title: 'Refund Policy | AI Image Prompts',
      description: 'Refund policy for AI Image Prompts — our approach to refunds for any paid features.',
      canonical: `${SITE}/refund`,
      body: legalPage(
        'Refund Policy',
        'Our refund policy for AI Image Prompts paid features.',
        '<p>The core prompt library is free. For any paid features or subscriptions, contact us within 14 days of purchase for a refund. See <a href="/terms" style="color:#2563eb;">Terms of Service</a> for full details.</p>'
      ),
    },
    {
      route: 'donate',
      title: 'Support AI Image Prompts | Donate',
      description: 'Support the AI Image Prompts library and help keep it free for everyone.',
      canonical: `${SITE}/donate`,
      body: donatePage(),
    },
  ]

  for (const page of pages) {
    const outDir = join(distDir, page.route)
    await mkdir(outDir, { recursive: true })
    const html = injectIntoShell(indexHtml, page)
    await writeFile(join(outDir, 'index.html'), html, 'utf8')
    console.log(`  ✓ /${page.route}`)
  }

  console.log(`[ssg] Static pages written — ${pages.length} pages.`)
}
