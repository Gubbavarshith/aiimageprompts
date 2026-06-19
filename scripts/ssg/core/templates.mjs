import { esc } from './html.mjs'

export const CATEGORIES = [
  ['Portrait', 'portrait'],
  ['Photography', 'photography'],
  ['Fantasy Art', 'fantasy-art'],
  ['Product Photography', 'product-photography'],
  ['Product Marketing', 'product-marketing'],
  ['Lifestyle', 'lifestyle'],
  ['Fashion Portrait', 'fashion-portrait'],
  ['Interior Design', 'interior-design'],
  ['Poster', 'poster'],
  ['3D Graphics', '3d-graphics'],
  ['Gaming', 'gaming'],
  ['Pixel Art', 'pixel-art'],
  ['Conceptual Portrait', 'conceptual-portrait'],
  ['Chibi', 'chibi'],
  ['Coloring Page', 'coloring-page'],
  ['Graphics', 'graphics'],
  ['Home Decor', 'home-decor'],
  ['Animals Portrait', 'animals-portrait'],
  ['Ad', 'ad'],
  ['Crafts', 'crafts'],
  ['Capsule', 'capsule'],
  ['Accidental Selfie', 'accidental-selfie'],
  ['UI/UX Design', 'uiux-design'],
  ['Web Development', 'web-development'],
]

export function explorePage() {
  const catLinks = CATEGORIES.map(([label, slug]) =>
    `<li style="display:contents;"><a href="/categories/${slug}" style="display:block;padding:14px 18px;border:1px solid #e4e4e7;border-radius:10px;text-decoration:none;color:#111827;font-weight:500;font-size:15px;transition:border-color .15s;" onmouseover="this.style.borderColor='#FFDE1A'" onmouseout="this.style.borderColor='#e4e4e7'">${esc(label)}</a></li>`
  ).join('\n    ')

  return `<main style="max-width:1200px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:52px;font-weight:900;margin:0 0 16px;line-height:1.1;letter-spacing:-1px;">Explore AI Image Prompts</h1>
  <p style="font-size:20px;color:#52525b;margin:0 0 48px;max-width:640px;line-height:1.6;">Browse 1,000+ curated prompts for Midjourney, DALL·E, Stable Diffusion, and Flux. Copy any prompt and paste it directly into your AI image generator.</p>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 20px;">Browse by Category</h2>
    <ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px;margin:0;">
    ${catLinks}
    </ul>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">What are AI Image Prompts?</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">AI image prompts are structured text descriptions that guide AI generators to create specific images. A well-crafted prompt describes the subject, style, lighting, composition, and mood of the desired image — instead of relying on vague instructions that produce generic results.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">Our library contains professionally crafted prompts tuned for creative control. Each prompt has been tested across models so it produces strong, consistent results you can build on.</p>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">How to Use These Prompts</h2>
    <ol style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Browse by category or search for a specific style or subject</li>
      <li>Click any prompt card to see the full prompt and details</li>
      <li>Copy the prompt with one click</li>
      <li>Paste into Midjourney, DALL·E, Stable Diffusion, or Flux</li>
      <li>Iterate: swap one variable at a time (subject, lighting, style) to explore variations</li>
    </ol>
  </section>

  <section style="margin-bottom:64px;">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">Supported AI Image Generators</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Midjourney</strong> — Industry-leading artistic quality; our prompts include aspect ratio flags</li>
      <li><strong>DALL·E 3</strong> — Strong instruction-following; ideal for product and commercial imagery</li>
      <li><strong>Stable Diffusion</strong> — Open-source with maximum control; prompts include negative prompt guidance</li>
      <li><strong>Flux</strong> — Fast, photorealistic results with excellent text rendering</li>
    </ul>
  </section>

  <section>
    <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;">From the Blog</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><a href="/blog/best-midjourney-prompts" style="color:#2563eb;">Best Midjourney Prompts: 25 Copy-Paste Templates</a></li>
      <li><a href="/blog/text-to-image-prompt-formulas" style="color:#2563eb;">Text-to-Image Prompt Formulas That Always Work</a></li>
      <li><a href="/blog/ai-photo-prompts" style="color:#2563eb;">AI Photo Prompts for Realistic Images</a></li>
      <li><a href="/blog/image-prompts-guide" style="color:#2563eb;">The Complete AI Image Prompts Guide</a></li>
    </ul>
  </section>
</main>`
}

export function aboutPage() {
  return `<main style="max-width:900px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:52px;font-weight:900;margin:0 0 20px;line-height:1.1;">Better Prompts, Better Art</h1>
  <p style="font-size:20px;color:#52525b;line-height:1.6;margin:0 0 48px;">A curated playground for AI image model prompts — built for people who care about craft, not copy-pasted boilerplate.</p>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">Our Story</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">AI Image Prompts started as a personal collection of prompts from late-night creative experiments, client work, and visual explorations. Over time it became clear that most people weren't struggling with the AI models — they were struggling with language.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 16px;">The same vague, generic prompts produced the same vague, generic images. This library exists to fix that: an evolving collection of prompts that feel intentional, directional, and actually fun to build on.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">We'd rather have 100 sharp, reusable prompts than 10,000 noisy ones that all look the same.</p>
  </section>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">What We Care About</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Quality over volume</strong> — every prompt is edited, not generated in bulk</li>
      <li><strong>Accessible craft</strong> — you shouldn't need a design degree to make great images</li>
      <li><strong>Ethical use</strong> — no harmful, hateful, or exploitative content</li>
      <li><strong>Community-first</strong> — real feedback from designers, artists, and founders shapes the library</li>
      <li><strong>Future-friendly</strong> — as models evolve, we update prompts to keep them working</li>
    </ul>
  </section>

  <section style="margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 16px;">The Numbers</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>10,000+</strong> curated prompt variations tested across AI models</li>
      <li><strong>50K+</strong> monthly prompt runs across tools</li>
      <li><strong>15+</strong> image models tested and tuned against</li>
      <li><strong>24/7</strong> global experimentation from the community</li>
    </ul>
  </section>

  <div style="text-align:center;padding:32px;background:#f4f4f5;border-radius:16px;">
    <h2 style="font-size:28px;font-weight:900;margin:0 0 12px;">Ready to explore the library?</h2>
    <p style="font-size:17px;color:#52525b;margin:0 0 24px;">Browse 1,000+ curated prompts and start making better images today.</p>
    <a href="/explore" style="display:inline-block;padding:14px 32px;background:#FFDE1A;color:#111827;font-weight:700;font-size:16px;border-radius:9999px;text-decoration:none;">Explore Prompts</a>
  </div>
</main>`
}

export function faqPage(faqContent) {
  const lines = faqContent.split('\n')
  const sections = []
  let currentCategory = ''
  let currentQ = ''
  let currentA = []

  const flush = () => {
    if (currentQ && currentA.length) {
      sections.push({ cat: currentCategory, q: currentQ, a: currentA.join('\n').trim() })
      currentQ = ''
      currentA = []
    }
  }

  for (const line of lines) {
    if (line.startsWith('# ')) {
      flush()
      currentCategory = line.slice(2).trim()
    } else if (line.startsWith('## ')) {
      flush()
      currentQ = line.slice(3).trim()
    } else if (currentQ) {
      currentA.push(line)
    }
  }
  flush()

  const catMap = new Map()
  for (const item of sections) {
    if (!catMap.has(item.cat)) catMap.set(item.cat, [])
    catMap.get(item.cat).push(item)
  }

  const faqHtml = Array.from(catMap.entries()).map(([cat, items]) => {
    const qs = items.map(({ q, a }) => `
    <div style="border-bottom:1px solid #e4e4e7;padding:20px 0;">
      <h3 style="font-size:17px;font-weight:600;margin:0 0 8px;color:#111827;">${esc(q)}</h3>
      <p style="font-size:15px;color:#52525b;margin:0;line-height:1.7;">${esc(a).replace(/\n/g, '<br>')}</p>
    </div>`).join('')
    return `
  <section style="margin-bottom:48px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid #FFDE1A;">${esc(cat)}</h2>
    ${qs}
  </section>`
  }).join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  return {
    body: `<main style="max-width:900px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Frequently Asked Questions</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 48px;line-height:1.6;">Everything you need to know about using AI image prompts — from getting started to advanced techniques.</p>
  ${faqHtml}
  <div style="margin-top:48px;padding:28px;background:#f4f4f5;border-radius:12px;">
    <p style="font-size:17px;font-weight:700;margin:0 0 8px;">Still have questions?</p>
    <p style="font-size:15px;color:#52525b;margin:0;line-height:1.6;">Reach out via the <a href="/contact" style="color:#2563eb;">Contact page</a> or explore the <a href="/blog" style="color:#2563eb;">blog</a> for in-depth guides.</p>
  </div>
</main>`,
    jsonLd,
  }
}

export function contactPage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Contact Us</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Have feedback on a prompt, a suggestion for the library, or a question about the platform? We'd love to hear from you.</p>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">What you can contact us about</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Prompt quality issues or improvement suggestions</li>
      <li>Feature requests for the prompt library</li>
      <li>Partnership or collaboration inquiries</li>
      <li>Press and media inquiries</li>
      <li>General feedback about the platform</li>
    </ul>
  </section>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Before reaching out</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 12px;">Check the <a href="/faq" style="color:#2563eb;">FAQ</a> — most common questions are answered there.</p>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">If you want to contribute prompts, use the <a href="/submit" style="color:#2563eb;">Submit page</a> instead.</p>
  </section>
</main>`
}

export function submitPage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Submit a Prompt</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Share your best AI image prompts with the community. The strongest submissions get curated into the public library.</p>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">What makes a great submission?</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li><strong>Original</strong> — not a copy-paste from another source</li>
      <li><strong>Specific</strong> — clear subject, style, lighting, and composition direction</li>
      <li><strong>Reusable</strong> — works as a template that others can adapt</li>
      <li><strong>Tested</strong> — you've actually run this in at least one AI image generator</li>
    </ul>
  </section>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Which models should prompts work with?</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">Prompts that work across multiple generators (Midjourney, DALL·E, Stable Diffusion, Flux) are preferred. Single-model prompts can still be submitted — just note which model you tested on.</p>
  </section>
  <section>
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Prompt guidelines</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0 0 12px;">Read the <a href="/guidelines" style="color:#2563eb;">community guidelines</a> before submitting. Prompts that generate harmful, hateful, or deceptive content will not be accepted.</p>
  </section>
</main>`
}

export function guidelinesPage() {
  return `<main style="max-width:800px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Community Guidelines</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">Rules and standards for contributing to and using the AI Image Prompts library.</p>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Content standards</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>No prompts designed to generate real people without consent</li>
      <li>No NSFW, adult, violent, or hateful content</li>
      <li>No prompts that infringe on known copyrights or trademarks</li>
      <li>No misleading or deceptive imagery prompts (e.g., fake news visuals)</li>
    </ul>
  </section>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Usage terms</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Prompts can be used freely for personal and commercial projects</li>
      <li>Credit is appreciated but not required</li>
      <li>Do not redistribute the entire library as your own product</li>
    </ul>
  </section>
  <section>
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Moderation</h2>
    <p style="font-size:17px;color:#52525b;line-height:1.75;margin:0;">All submitted prompts are reviewed before being added to the public library. We reserve the right to reject or remove any submission at our discretion. See the full <a href="/terms" style="color:#2563eb;">Terms of Service</a> for details.</p>
  </section>
</main>`
}

export function legalPage(title, description, content) {
  return `<main style="max-width:800px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:40px;font-weight:900;margin:0 0 16px;line-height:1.1;">${esc(title)}</h1>
  <p style="font-size:17px;color:#52525b;margin:0 0 32px;line-height:1.6;">${esc(description)}</p>
  <div style="font-size:16px;color:#52525b;line-height:1.75;">${content}</div>
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid #e4e4e7;font-size:14px;color:#71717a;">
    <p>Questions? <a href="/contact" style="color:#2563eb;">Contact us</a>.</p>
  </div>
</main>`
}

export function donatePage() {
  return `<main style="max-width:720px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <h1 style="font-size:48px;font-weight:900;margin:0 0 16px;line-height:1.1;">Support AI Image Prompts</h1>
  <p style="font-size:18px;color:#52525b;margin:0 0 40px;line-height:1.6;">If the library has helped your creative work, consider supporting it so we can keep adding and improving prompts.</p>
  <section style="margin-bottom:40px;">
    <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">Why support?</h2>
    <ul style="font-size:17px;color:#52525b;line-height:2;padding-left:24px;margin:0;">
      <li>Keeps the core library free for everyone</li>
      <li>Funds testing prompts across new models as they launch</li>
      <li>Supports content creation for the <a href="/blog" style="color:#2563eb;">blog</a></li>
    </ul>
  </section>
  <p style="font-size:17px;color:#52525b;line-height:1.75;">Alternatively, the best way to support is to <a href="/submit" style="color:#2563eb;">submit a great prompt</a> or share the library with someone who'd find it useful.</p>
</main>`
}
