import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { supabase } from '@/lib/supabaseClient'
import { generateSlug, type PromptRecord } from '@/lib/services/prompts'
import { updateMetaTags, upsertJsonLd, removeJsonLd } from '@/lib/seo'
import { getPublicSiteOrigin } from '@/config/site'
import { getAspectRatioClass } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import categories from '@/config/categories.json'

type CategoryEntry = { name: string; slug: string; description: string }

function PromptCard({ prompt, onCopy, copiedId }: {
  prompt: PromptRecord
  onCopy: (p: PromptRecord) => void
  copiedId: string | null
}) {
  const slug = generateSlug(prompt.title)
  const copied = copiedId === prompt.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all duration-200"
    >
      <Link to={`/prompt/${slug}`} className="block">
        <div className={`relative ${getAspectRatioClass(prompt.image_ratio)} overflow-hidden bg-gray-100 dark:bg-zinc-800`}>
          <img
            src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
            alt={`${prompt.title} — AI image prompt`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute top-2 left-2">
            <span className="bg-[#FFDE1A] border-2 border-black text-black text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {prompt.category}
            </span>
          </div>
        </div>
        <div className="p-3">
          <h2 className="font-bold text-sm leading-tight text-black dark:text-white group-hover:text-[#F8BE00] transition-colors line-clamp-2">
            {prompt.title}
          </h2>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <button
          onClick={() => onCopy(prompt)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-lg border-2 border-black dark:border-white hover:bg-[#FFDE1A] hover:text-black dark:hover:bg-[#FFDE1A] dark:hover:text-black hover:border-[#FFDE1A] transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>
      </div>
    </motion.div>
  )
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const category = categories.find((c: CategoryEntry) => c.slug === slug) as CategoryEntry | undefined

  const [prompts, setPrompts] = useState<PromptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    if (!category) {
      navigate('/explore', { replace: true })
      return
    }

    const origin = getPublicSiteOrigin()
    const canonicalUrl = `${origin}/categories/${category.slug}`
    const title = `${category.name} AI Image Prompts | Better Prompts, Better Art`

    updateMetaTags({
      title,
      description: category.description,
      canonical: `/categories/${category.slug}`,
      og: {
        title,
        description: category.description,
        url: `/categories/${category.slug}`,
        image: '/og-image.png',
        type: 'website',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: category.description,
        image: '/og-image.png',
      },
    })

    upsertJsonLd('category-breadcrumb-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
        { '@type': 'ListItem', position: 2, name: 'Explore', item: `${origin}/explore` },
        { '@type': 'ListItem', position: 3, name: category.name, item: canonicalUrl },
      ],
    })

    upsertJsonLd('category-collection-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${category.name} AI Image Prompts`,
      description: category.description,
      url: canonicalUrl,
    })

    window.scrollTo(0, 0)

    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('prompts')
        .select('id,title,category,tags,preview_image_url,status,views,image_ratio,created_at,updated_at,rating_avg,rating_count,attribution,attribution_link,scheduled_at')
        .eq('status', 'Published')
        .eq('category', category!.name)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPrompts(data as PromptRecord[])
      }
      setLoading(false)
    }

    load()

    return () => {
      removeJsonLd('category-breadcrumb-jsonld')
      removeJsonLd('category-collection-jsonld')
    }
  }, [slug, category, navigate])

  const handleCopy = async (prompt: PromptRecord) => {
    // Fetch full prompt text for copying
    const { data } = await supabase
      .from('prompts')
      .select('prompt')
      .eq('id', prompt.id)
      .single()

    const text = data?.prompt || prompt.title
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(prompt.id)
      toast.success('Prompt copied!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const otherCategories = categories
    .filter((c: CategoryEntry) => c.slug !== slug)
    .slice(0, 8)

  if (!category) return null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white font-sans">
      <FloatingNavbar />

      {/* Hero */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <Link to="/explore" className="hover:text-black dark:hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={14} />
              All Prompts
            </Link>
            <span>/</span>
            <span className="text-black dark:text-white font-medium">{category.name}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
            {category.name} <span className="text-[#FFDE1A]">AI Prompts</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
            {category.description}
          </p>
          {!loading && (
            <p className="mt-3 text-sm text-zinc-500">
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} available
            </p>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-[#FFDE1A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-zinc-500 mb-6">No prompts in this category yet.</p>
            <Link to="/explore" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDE1A] text-black font-bold rounded-full hover:bg-[#F8BE00] transition-colors">
              Browse all prompts <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        )}

        {/* Other categories */}
        {!loading && (
          <section className="mt-20 pt-10 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Explore Other Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {otherCategories.map((c: CategoryEntry) => (
                <Link
                  key={c.slug}
                  to={`/categories/${c.slug}`}
                  className="block px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:border-[#FFDE1A] hover:bg-[#FFDE1A]/5 transition-colors text-center"
                >
                  {c.name}
                </Link>
              ))}
              <Link
                to="/explore"
                className="block px-4 py-3 border-2 border-[#FFDE1A] bg-[#FFDE1A]/10 rounded-xl text-sm font-bold hover:bg-[#FFDE1A]/20 transition-colors text-center"
              >
                View All →
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
