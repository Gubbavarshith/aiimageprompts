import { useState, useEffect } from 'react'
import { ChevronDown, Sparkles, BookOpen, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { upsertJsonLd, removeJsonLd } from '@/lib/seo'
import { getPublicSiteOrigin } from '@/config/site'

// --- FAQ Data ---
const FAQ_ITEMS = [
  {
    question: 'What is an AI image prompt?',
    answer:
      'An AI image prompt is a text description you provide to an AI image generator (like Midjourney, DALL-E, or Stable Diffusion) to guide the creation of a specific image. The prompt includes details about the subject, style, lighting, composition, and artistic direction. Well-crafted prompts produce dramatically better results than vague descriptions.',
  },
  {
    question: 'Which AI image generator works best for prompts?',
    answer:
      'It depends on your goals. Midjourney excels at cinematic, artistic, and photorealistic imagery. DALL-E 3 (via ChatGPT) is best for prompt adherence and text-in-image accuracy. Stable Diffusion and Flux offer the most control through open-source fine-tuning. For anime styles, Stable Diffusion with specialized models is often preferred.',
  },
  {
    question: 'How do I write better AI image prompts?',
    answer:
      'Start with a clear subject, then layer in specific details: environment, lighting (golden hour, studio lighting, neon), camera angle (low angle, aerial, macro), art medium (oil painting, 3D render, watercolor), and mood. Use negative prompts to exclude unwanted elements. Reference specific artists or styles for consistent aesthetics.',
  },
  {
    question: 'Are AI image prompts copyrighted?',
    answer:
      'Prompt text itself is generally not copyrightable as it typically doesn\'t meet the threshold of creative expression required for copyright protection. However, the images generated from prompts have complex and evolving legal status. The U.S. Copyright Office has ruled that purely AI-generated images without meaningful human authorship are not copyrightable, though images with significant human creative input may qualify.',
  },
  {
    question: 'What is a negative prompt and how do I use one?',
    answer:
      'A negative prompt tells the AI what to exclude from the generated image. Common negative prompts include "blurry, low quality, distorted, extra fingers, watermark, text." Negative prompts are especially powerful in Stable Diffusion and Midjourney, where they help eliminate common artifacts and maintain compositional clarity.',
  },
  {
    question: 'Can I use AI-generated images commercially?',
    answer:
      'Commercial usage depends on the platform. Midjourney allows commercial use for paid subscribers. DALL-E 3 through ChatGPT Plus grants commercial rights. Stable Diffusion, being open-source, generally allows commercial use but depends on the specific model license. Always check the current terms of service for the tool you\'re using.',
  },
  {
    question: 'What makes a prompt "cinematic"?',
    answer:
      'Cinematic prompts use film terminology: anamorphic lens, shallow depth of field, volumetric lighting, film grain, 35mm photography, dramatic chiaroscuro, Kodak Portra 400, and director-style framing. Adding phrases like "directed by Ridley Scott" or "shot on ARRI Alexa" triggers cinematic aesthetics in most AI generators.',
  },
  {
    question: 'How are prompts on this site organized?',
    answer:
      'Prompts are organized by categories (Cinematic, Anime, Photography, Illustration, and more), searchable by keyword, and filterable by tags. Each prompt page includes the full prompt text, recommended AI models, suggested settings, and related prompts to help you discover similar creative directions.',
  },
]

// --- Category Content Data ---
const CATEGORY_BLOCKS = [
  {
    name: 'Cinematic',
    slug: 'Cinematic',
    content:
      'Cinematic AI image prompts recreate the visual language of film — dramatic lighting, shallow depth of field, anamorphic lens distortion, and carefully composed frames. These prompts work best with Midjourney and DALL-E 3, which respond well to camera terminology like "35mm film," "golden hour backlight," and "volumetric fog." Use cinematic prompts for movie poster concepts, dramatic character portraits, and atmospheric scene design.',
    keywords: ['cinematic lighting', 'film photography', 'dramatic portrait', 'movie poster'],
  },
  {
    name: 'Anime',
    slug: 'Anime',
    content:
      'Anime-style AI prompts generate images in the visual tradition of Japanese animation — cel-shaded characters, expressive eyes, dynamic action poses, and vibrant color palettes. Stable Diffusion with anime-trained models (like Anything V5 or Counterfeit) produces the most authentic results. Specify art styles referencing Studio Ghibli, Makoto Shinkai, or Trigger Studio for distinct aesthetic directions.',
    keywords: ['anime art', 'manga style', 'cel-shaded', 'Japanese illustration'],
  },
  {
    name: 'Photography',
    slug: 'Photography',
    content:
      'AI photo prompts produce hyper-realistic images that mimic professional photography. Specify camera models (Canon EOS R5, Sony A7IV), lens types (85mm f/1.4, 24-70mm), and film stocks (Kodak Portra, Fuji Velvia) for authentic photographic quality. These prompts are ideal for product mockups, lifestyle imagery, portrait photography concepts, and architectural visualization.',
    keywords: ['AI photo prompts', 'realistic photography', 'product photography', 'portrait'],
  },
  {
    name: 'Illustration',
    slug: 'Illustration',
    content:
      'Illustration prompts guide AI generators to produce hand-crafted digital art styles — from flat vector graphics and editorial illustrations to detailed concept art and children\'s book imagery. Reference specific mediums like "watercolor on textured paper," "gouache painting," or "ink and wash" to control the artistic output. DALL-E 3 excels at clean, precise illustration styles.',
    keywords: ['digital illustration', 'concept art', 'editorial art', 'vector style'],
  },
  {
    name: 'Product & Fashion',
    slug: 'Product',
    content:
      'Product photography and fashion AI prompts create polished, commercial-ready imagery for e-commerce, advertising, and brand campaigns. Use precise lighting descriptors — "softbox studio lighting," "rim light on white cyclorama," "lifestyle flat lay" — combined with material descriptors for photorealistic product shots. Fashion prompts benefit from referencing editorial magazines, runway styles, and specific fashion photographers.',
    keywords: ['product photography', 'fashion editorial', 'e-commerce', 'commercial photography'],
  },
]

// --- Expandable Category Block ---
const CategoryBlock = ({
  category,
}: {
  category: (typeof CATEGORY_BLOCKS)[number]
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-2 border-black/10 dark:border-white/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-black/20 dark:hover:border-white/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left group focus:outline-none focus:ring-2 focus:ring-[#FFDE1A] focus:ring-offset-2 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFDE1A]/10 text-[#F8BE00]">
            <Sparkles className="w-4 h-4" />
          </span>
          <h3 className="text-lg font-bold text-black dark:text-white">
            {category.name} AI Image Prompts
          </h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 pb-5 space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {category.content}
          </p>
          <div className="flex flex-wrap gap-2">
            {category.keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                {kw}
              </span>
            ))}
          </div>
          <Link
            to={`/explore?category=${encodeURIComponent(category.slug)}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F8BE00] hover:underline"
          >
            Browse {category.name} prompts →
          </Link>
        </div>
      </div>
    </div>
  )
}

// --- FAQ Item ---
const FAQItem = ({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQ_ITEMS)[number]
  isOpen: boolean
  onToggle: () => void
}) => (
  <div className="border-b border-black/5 dark:border-white/5 last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-start justify-between py-5 text-left group focus:outline-none focus:ring-2 focus:ring-[#FFDE1A] focus:ring-offset-2 rounded-lg"
      aria-expanded={isOpen}
    >
      <span className="text-base font-bold text-black dark:text-white pr-4 leading-snug">
        {item.question}
      </span>
      <ChevronDown
        className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ${
        isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'
      }`}
    >
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">
        {item.answer}
      </p>
    </div>
  </div>
)

// --- Main Component ---
export const ExplorePageSEOFooter = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  // Inject FAQ JSON-LD
  useEffect(() => {
    const origin = getPublicSiteOrigin()

    upsertJsonLd('explore-faq-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
      url: `${origin}/explore`,
    })

    return () => {
      removeJsonLd('explore-faq-jsonld')
    }
  }, [])

  return (
    <section className="mt-20 border-t-2 border-black/5 dark:border-white/5 pt-16 pb-8">
      <div className="max-w-4xl mx-auto space-y-20">
        {/* --- Intro Section --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFDE1A]/10 text-[#F8BE00]">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">
              What Are AI Image Prompts?
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            AI image prompts are carefully crafted text instructions that tell an AI image generator
            — like{' '}
            <Link to="/blog" className="text-[#F8BE00] hover:underline font-semibold">
              Midjourney, DALL-E, or Stable Diffusion
            </Link>{' '}
            — exactly what to create. A well-written prompt controls subject, composition, lighting,
            color palette, art style, camera angle, and mood. The difference between a generic output
            and a stunning, publication-quality image is almost always the prompt.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            This library contains{' '}
            <strong className="text-black dark:text-white">
              hundreds of curated, copy-ready AI image prompts
            </strong>{' '}
            organized by style and category. Each prompt is designed for immediate use — browse by
            category below, or use the search and filters above to find prompts for your exact
            creative direction.
          </p>
        </div>

        {/* --- Category Authority Blocks --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFDE1A]/10 text-[#F8BE00]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">
              Explore Prompts by Category
            </h2>
          </div>
          <p className="text-zinc-500 dark:text-zinc-500 mb-4">
            Each category contains specialized prompts optimized for specific AI models and visual
            styles. Expand a category to learn more about the style and discover related prompts.
          </p>
          <div className="space-y-3">
            {CATEGORY_BLOCKS.map((cat) => (
              <CategoryBlock key={cat.slug} category={cat} />
            ))}
          </div>
        </div>

        {/* --- FAQ Section --- */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFDE1A]/10 text-[#F8BE00]">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-black/5 dark:border-white/5 p-6 md:p-8">
            {FAQ_ITEMS.map((item, idx) => (
              <FAQItem
                key={idx}
                item={item}
                isOpen={openFAQ === idx}
                onToggle={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ExplorePageSEOFooter
