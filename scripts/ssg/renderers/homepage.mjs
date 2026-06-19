import { esc, generateSlug, injectIntoShell, SITE } from '../core/html.mjs'
import { writeRootPage } from '../core/engine.mjs'

function renderHero() {
  const categories = [
    { label: 'Portraits', slug: 'portrait' },
    { label: 'Anime', slug: 'anime' },
    { label: 'Logos', slug: 'logos' },
    { label: 'UI/UX', slug: 'uiux-design' },
    { label: 'Cinematic', slug: 'cinematic' },
  ]

  const categoryTags = categories
    .map(
      (cat) =>
        `<a href="/categories/${cat.slug}" style="display:inline-block;margin:6px 4px;padding:6px 14px;border:1px solid #e4e4e7;border-radius:9999px;font-size:14px;color:#71717a;text-decoration:none;font-weight:500;background:#fff;" onmouseover="this.style.borderColor='#111';this.style.color='#111'" onmouseout="this.style.borderColor='#e4e4e7';this.style.color='#71717a'">${esc(cat.label)}</a>`
    )
    .join('')

  return `<section style="max-width:900px;margin:0 auto;padding:96px 24px 64px;text-align:center;font-family:sans-serif;">
  <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:#f4f4f5;border-radius:9999px;font-size:13px;font-weight:600;color:#18181b;margin-bottom:32px;">
    <span style="display:inline-block;width:6px;height:6px;background:#10b981;border-radius:50%;"></span>
    Loved by 15,000+ creators
  </div>

  <h1 style="font-size:72px;font-weight:900;line-height:0.95;margin:0 0 24px;text-transform:uppercase;letter-spacing:-1px;color:#111827;">
    Better Prompts<br><span style="background:linear-gradient(to right,#FFDE1A,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Better Art</span>
  </h1>

  <p style="font-size:20px;color:#52525b;max-width:600px;margin:0 auto 40px;line-height:1.6;">
    Master the art of AI generation. Thousands of pro-level prompts ready for your next masterpiece.
  </p>

  <div style="max-width:600px;margin:0 auto 24px;position:relative;display:flex;align-items:center;border:2px solid #111;border-radius:9999px;background:#fff;padding:8px 8px 8px 24px;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);">
    <span style="color:#9ca3af;font-size:16px;flex-grow:1;text-align:left;user-select:none;">Search for 'cyberpunk city' or 'watercolor cat'...</span>
    <a href="/explore" style="display:inline-block;padding:12px 28px;background:#FFDE1A;color:#111;font-weight:700;text-decoration:none;border-radius:9999px;border:2px solid #111;font-size:15px;box-shadow:2px 2px 0 0 rgba(0,0,0,1);">Explore</a>
  </div>

  <div style="margin-top:16px;">
    ${categoryTags}
  </div>
</section>`
}

function renderFeaturedPrompts(prompts) {
  if (prompts.length === 0) return ''

  const cards = prompts
    .map((p) => {
      const slug = generateSlug(p.title)
      const previewUrl =
        p.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'
      const cleanCategory = p.category || 'AI Prompt'

      return `<div style="display:flex;flex-direction:column;border:2px solid #111;border-radius:12px;overflow:hidden;background:#fff;box-shadow:4px 4px 0px 0px rgba(0,0,0,1);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
      <div style="position:relative;background:#f4f4f5;aspect-ratio:4/3;overflow:hidden;border-bottom:2px solid #111;">
        <img src="${esc(previewUrl)}" alt="AI ${esc(cleanCategory)} Prompt: ${esc(p.title)}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
        <span style="position:absolute;top:12px;left:12px;background:#FFDE1A;border:2px solid #111;color:#111;font-size:11px;font-weight:700;text-transform:uppercase;padding:4px 8px;border-radius:4px;box-shadow:1.5px 1.5px 0 0 rgba(0,0,0,1);">${esc(cleanCategory)}</span>
      </div>
      <div style="padding:16px;flex-grow:1;display:flex;flex-direction:column;">
        <h3 style="margin:0 0 10px;font-size:18px;font-weight:700;line-height:1.3;color:#111827;">${esc(p.title)}</h3>
        <div style="border-left:3px solid #FFDE1A;padding-left:12px;margin-bottom:16px;flex-grow:1;">
          <p style="margin:0;font-size:13px;font-family:monospace;color:#52525b;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.6;word-break:break-all;">${esc(p.prompt)}</p>
        </div>
        <div style="display:flex;gap:10px;border-top:1px solid #e4e4e7;padding-top:14px;margin-top:auto;">
          <a href="/prompt/${slug}" style="flex-grow:1;display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;background:#fff;border:2px solid #111;color:#111;font-weight:700;font-size:13px;text-decoration:none;border-radius:6px;box-shadow:2px 2px 0 0 rgba(0,0,0,1);">Copy Prompt</a>
          <a href="/prompt/${slug}" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:38px;background:#fff;border:2px solid #111;border-radius:6px;text-decoration:none;box-shadow:2px 2px 0 0 rgba(0,0,0,1);color:#111;">➔</a>
        </div>
      </div>
    </div>`
    })
    .join('\n    ')

  return `<section style="max-width:1200px;margin:0 auto;padding:64px 24px;font-family:sans-serif;">
  <div style="margin-bottom:48px;">
    <span style="color:#f59e0b;font-family:monospace;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">// Recently added</span>
    <h2 style="font-size:40px;font-weight:900;margin:10px 0 12px;letter-spacing:-0.5px;">Latest Prompt Creations</h2>
    <p style="margin:0;font-size:18px;color:#52525b;">New publishes from our community catalog — copy and run immediately.</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:32px;">
    ${cards}
  </div>

  <div style="text-align:center;margin-top:48px;">
    <a href="/explore" style="display:inline-block;padding:14px 32px;border:2px solid #111;border-radius:9999px;font-weight:700;color:#111;text-decoration:none;box-shadow:3px 3px 0 0 rgba(0,0,0,1);background:#fff;" onmouseover="this.style.backgroundColor='#f4f4f5'" onmouseout="this.style.backgroundColor='#fff'">View All Prompt Templates</a>
  </div>
</section>`
}

function renderSEOContent() {
  return `<section style="background:#f9fafb;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:96px 24px;font-family:sans-serif;">
  <div style="max-width:800px;margin:0 auto;line-height:1.75;color:#374151;">
    <article style="margin-bottom:48px;">
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">What Are AI Image Prompts?</h2>
      <p style="font-size:17px;margin-bottom:16px;">
        AI image prompts are detailed text instructions that guide artificial intelligence models to generate specific visual outputs. Whether you need <a href="/explore?category=Photography" style="color:#f59e0b;font-weight:700;text-decoration:none;">photorealistic portrait prompts</a>, design-focused logo briefs, or custom UI/UX mockups, the prompt is how you direct the model's canvas.
      </p>
      <p style="font-size:17px;">
        The difference between amateur output and professional generated art is prompt engineering. Curated, high-quality prompt formulas save hours of trial and error, enabling creators to build consistent, production-ready visuals for blogs, social campaigns, and websites.
      </p>
    </article>

    <article style="margin-bottom:48px;">
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">How to Write Better Prompts</h2>
      <p style="font-size:17px;margin-bottom:16px;">
        Great prompt templates use a structured formula combining subject, environment, lighting, medium, and aesthetic modifiers. Here are four foundational prompt rules:
      </p>
      <ul style="font-size:17px;padding-left:24px;margin-bottom:20px;line-height:2;">
        <li><strong>Be descriptive:</strong> Instead of "a car," describe the make, environment, and era: "a vintage 1969 muscle car parked in a neon-lit cyberpunk street."</li>
        <li><strong>Incorporate lighting:</strong> Lighting dictates visual quality. Include descriptors like <em>cinematic backlight</em>, <em>golden hour glare</em>, or <em>soft volumetric fog</em>.</li>
        <li><strong>Specify the medium:</strong> Tell the AI if you want a 3D render, watercolor painting, vector illustration, or a high-shutter photo.</li>
        <li><strong>Apply negative prompts:</strong> Use negative keywords to filter out artifacts, deformed faces, text overlays, and noise.</li>
      </ul>
    </article>

    <article>
      <h2 style="font-size:32px;font-weight:800;color:#111827;margin-bottom:16px;">Best AI Generators for Prompting</h2>
      <p style="font-size:17px;margin-bottom:24px;">Each image generation model excels at different visual disciplines:</p>
      <div style="margin-bottom:16px;">
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">Midjourney</h3>
        <p style="font-size:16px;margin:0;">The industry standard for cinematic art, photorealism, and style transfer. Responds well to detailed artistic references and camera commands.</p>
      </div>
      <div style="margin-bottom:16px;">
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">DALL·E 3</h3>
        <p style="font-size:16px;margin:0;">Ideal for high-fidelity prompt compliance. If your prompt includes complex positional setups or exact text inside the image, DALL-E (via ChatGPT) is the best choice.</p>
      </div>
      <div>
        <h3 style="font-size:19px;font-weight:700;color:#111827;margin:0 0 6px;">Stable Diffusion / Flux</h3>
        <p style="font-size:16px;margin:0;">Perfect for open-source customization, control nets, and photorealistic skin rendering. SD XL and Flux offer extreme flexibility for developers and custom models.</p>
      </div>
    </article>
  </div>
</section>`
}

function renderSubmitCTA() {
  return `<section style="max-width:900px;margin:80px auto;padding:64px 24px;text-align:center;font-family:sans-serif;">
  <div style="background:#fff;border:3px solid #111;border-radius:24px;padding:48px 32px;box-shadow:8px 8px 0 0 rgba(0,0,0,1);">
    <h2 style="font-size:36px;font-weight:900;margin:0 0 16px;letter-spacing:-0.5px;">Have an amazing prompt formula?</h2>
    <p style="font-size:18px;color:#52525b;max-width:550px;margin:0 auto 32px;line-height:1.6;">
      Share your best image prompt designs with the community. Approved prompts get featured in our catalog with proper creator attribution.
    </p>
    <a href="/submit" style="display:inline-block;padding:14px 36px;background:#FFDE1A;color:#111;border:2px solid #111;font-weight:700;text-decoration:none;border-radius:9999px;font-size:16px;box-shadow:3px 3px 0 0 rgba(0,0,0,1);">Submit a Prompt</a>
  </div>
</section>`
}

export async function renderHomepage({ distDir, indexHtml, featuredPrompts }) {
  const body = [
    renderHero(),
    renderFeaturedPrompts(featuredPrompts),
    renderSEOContent(),
    renderSubmitCTA(),
  ].join('\n')

  const html = injectIntoShell(indexHtml, {
    title: 'AI Image Prompts Library | Better Prompts, Better Art',
    description:
      'Explore AI image prompts, AI photo prompts, and prompt ideas for Midjourney, DALL-E, and Stable Diffusion. Browse free prompts for better generated art.',
    canonical: SITE,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Image Prompts',
      url: SITE,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE}/explore?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    body,
  })

  await writeRootPage(distDir, html)
  console.log('[ssg] Homepage written.')
}
