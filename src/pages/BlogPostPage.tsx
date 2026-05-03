import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle, BookOpenText, Check, Clock3, Copy, ListTree, Sparkles, Tags, Twitter } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { FloatingNavbar } from '../components/landing/FloatingNavbar'
import { Footer } from '../components/landing/Footer'
import { formatDate, getPublishedBlogPostBySlug } from '../lib/services/blogs'
import { useToast } from '../contexts/ToastContext'
import { cn } from '../lib/utils'
import { updateMetaTags } from '../lib/seo'

gsap.registerPlugin(ScrollTrigger, useGSAP)

interface TOCHeading {
  level: number
  text: string
  id: string
}

interface InsightCard {
  title: string
  value: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const extractTOCHeadings = (html: string): TOCHeading[] => {
  const headings: TOCHeading[] = []
  const regex = /<h([2-4])(?:\s+id="([^"]*)")?[^>]*>(.*?)<\/h\1>/gi

  let match
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const existingId = match[2]
    const text = match[3].replace(/<[^>]*>/g, '').trim()

    const id = existingId || text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    if (text && id) {
      headings.push({ level, text, id })
    }
  }

  return headings
}

function TableOfContents({ headings, activeHeadingId }: { headings: TOCHeading[]; activeHeadingId: string | null }) {
  if (headings.length === 0) return null

  return (
    <section className="js-reveal rounded-none border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/65">
      <div className="mb-4 flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
        <ListTree className="h-4 w-4 text-[#FFDE1A]" />
        On this page
      </div>
      <nav className="space-y-2.5">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              'group relative block border-l border-transparent px-2 py-1.5 text-sm leading-snug text-zinc-700 transition-all duration-300 hover:border-[#FFDE1A]/80 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white',
              activeHeadingId === heading.id && 'border-[#FFDE1A] bg-[#FFDE1A]/10 text-zinc-950 dark:text-white',
              heading.level === 2 && 'font-semibold',
              heading.level === 3 && 'ml-3 font-medium text-zinc-600 dark:text-[#B4BDD2]',
              heading.level === 4 && 'ml-6 text-zinc-500 dark:text-[#9CA5BC]',
            )}
          >
            <span
              className={cn(
                'absolute bottom-0 left-2 h-[2px] w-0 bg-[#FFDE1A] transition-all duration-300 group-hover:w-8',
                activeHeadingId === heading.id && 'w-10',
              )}
            />
            {heading.text}
          </a>
        ))}
      </nav>
    </section>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const toast = useToast()
  const pageRef = useRef<HTMLDivElement>(null)

  const [imageError, setImageError] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  const post = useMemo(() => (slug ? getPublishedBlogPostBySlug(slug) : null), [slug])
  const tocHeadings = useMemo(() => (post ? extractTOCHeadings(post.content) : []), [post])

  const insightCards = useMemo<InsightCard[]>(() => {
    if (!post) return []
    const firstSection = tocHeadings[0]?.text || 'Opening section'
    return [
      {
        title: 'Reading pace',
        value: post.readTime,
        description: 'Compact depth with high practical density.',
        icon: Clock3,
      },
      {
        title: 'Craft lens',
        value: post.category,
        description: 'Focused viewpoint for this article.',
        icon: Sparkles,
      },
      {
        title: 'Section depth',
        value: `${Math.max(tocHeadings.length, 1)} blocks`,
        description: firstSection,
        icon: BookOpenText,
      },
      {
        title: 'Tag cluster',
        value: `${post.tags.length} topics`,
        description: post.tags[0] ? `Leading with #${post.tags[0]}` : 'Keyword-focused article architecture.',
        icon: Tags,
      },
    ]
  }, [post, tocHeadings])

  useEffect(() => {
    if (!post) {
      document.title = 'Article not found | Better Prompts, Better Art'
      return
    }

    const canonicalPath = `/blog/${post.slug}`
    const seoTitle = post.metaTitle || `${post.title} | Better Prompts, Better Art`
    const seoDescription = post.metaDescription || post.excerpt

    updateMetaTags({
      title: seoTitle,
      description: seoDescription,
      canonical: canonicalPath,
      og: {
        title: seoTitle,
        description: seoDescription,
        url: canonicalPath,
        image: post.imageUrl || '/og-image.png',
        type: 'article',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title: seoTitle,
        description: seoDescription,
        image: post.imageUrl || '/og-image.png',
      },
    })
  }, [post])

  useEffect(() => {
    const scriptId = 'blog-article-jsonld'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    if (!post) return

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      articleSection: post.category,
      keywords: post.tags?.join(', '),
      image: post.imageUrl ? [post.imageUrl] : undefined,
      description: post.metaDescription || post.excerpt,
      mainEntityOfPage: `https://aiimageprompts.xyz/blog/${post.slug}`,
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jsonLd)
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [post])

  useEffect(() => {
    if (!post) return

    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('.blog-content h2[id], .blog-content h3[id], .blog-content h4[id]')
      headings.forEach((heading) => {
        if (heading.querySelector('.anchor-link')) return

        const link = document.createElement('a')
        link.className = 'anchor-link'
        link.innerHTML = '#'
        link.href = `#${heading.id}`
        link.onclick = (e) => {
          e.preventDefault()
          const url = `${window.location.origin}${window.location.pathname}#${heading.id}`
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success('Section link copied'))
            .catch(() => toast.error('Failed to copy section link'))
        }
        heading.prepend(link)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [post, toast])

  useEffect(() => {
    if (!tocHeadings.length) {
      setActiveHeadingId(null)
      return
    }

    const headingElements = tocHeadings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null)

    if (!headingElements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length > 0) {
          setActiveHeadingId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: [0.2, 0.45, 0.7],
      },
    )

    headingElements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [tocHeadings, post?.slug])

  useGSAP(
    () => {
      if (!post) return
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) return

      const intro = gsap.timeline({
        defaults: { ease: 'power3.out', duration: 0.85 },
      })
      intro
        .from('.js-hero-kicker', { y: 22, opacity: 0 })
        .from('.js-hero-title', { y: 26, opacity: 0 }, '-=0.45')
        .from('.js-hero-meta', { y: 18, opacity: 0, stagger: 0.08 }, '-=0.45')
        .from('.js-feature-frame', { y: 30, opacity: 0, rotateX: 3 }, '-=0.58')

      ScrollTrigger.batch('.js-reveal', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'power2.out', overwrite: true },
          )
        },
      })

      if (post.imageUrl && !imageError) {
        gsap.to('.js-feature-image', {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: '.js-feature-frame',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.9,
          },
        })
      }

      const progressTarget = document.querySelector('.js-reading-progress')
      if (progressTarget) {
        gsap.set(progressTarget, { scaleX: 0 })
        ScrollTrigger.create({
          trigger: '.js-article-shell',
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            gsap.to(progressTarget, {
              scaleX: self.progress,
              duration: 0.12,
              ease: 'none',
              overwrite: true,
            })
          },
        })
      }
    },
    { scope: pageRef, dependencies: [post?.slug, imageError], revertOnUpdate: true },
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setHasCopied(true)
      toast.success('Link copied to clipboard')
      setTimeout(() => setHasCopied(false), 1600)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    if (!post) return
    const shareUrl = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`${post.title} by ${post.author}`)
    window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank', 'noopener,noreferrer')
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#0B0E14] dark:text-[#F3F0E7]">
        <FloatingNavbar />
        <main className="flex min-h-[80vh] items-center justify-center px-4">
          <div className="w-full max-w-md border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-[#131826]/80">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#FFDE1A]/20 text-[#8b6800] dark:bg-[#FFDE1A]/15 dark:text-[#FFDE1A]">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-[#F3F0E7]">Article not found</h1>
            <p className="mb-8 text-zinc-600 dark:text-[#A9B0C3]">The article may have moved, been removed, or is still in draft.</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-md border border-[#FFDE1A]/60 bg-[#FFDE1A]/25 px-5 py-2.5 font-semibold text-zinc-900 transition-colors hover:bg-[#FFDE1A]/40 dark:bg-[#FFDE1A]/20 dark:text-[#FFDE1A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-x-clip bg-[#f5f5f7] text-[#1d1d1f] dark:bg-[#0B0E14] dark:text-[#F3F0E7]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(29,29,31,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(29,29,31,0.14)_1px,transparent_1px)] [background-size:56px_56px] dark:opacity-[0.05] dark:[background-image:linear-gradient(rgba(169,176,195,0.11)_1px,transparent_1px),linear-gradient(90deg,rgba(169,176,195,0.11)_1px,transparent_1px)]" />
      </div>

      <div className="fixed left-0 right-0 top-0 z-[70] h-[2px] bg-zinc-900/10 dark:bg-white/10">
        <div className="js-reading-progress h-full origin-left bg-[#FFDE1A]" />
      </div>

      <FloatingNavbar />

      <main className="relative z-10 pb-20 pt-24">
        <article className="js-article-shell mx-auto w-full max-w-[1920px] px-0">
          <div className="mx-auto mb-6 w-full max-w-[1780px] px-4 sm:px-6 lg:px-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-700 transition-colors hover:border-[#FFDE1A] hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 dark:hover:border-[#FFDE1A] dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Journal
            </Link>
          </div>

          <header className="border-y border-zinc-200 bg-white py-14 dark:border-zinc-800 dark:bg-[#131826]">
            <div className="mx-auto grid w-full max-w-[1780px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-10">
              <div className="lg:col-span-7">
                <div className="js-hero-kicker mb-4 inline-flex items-center gap-2 border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FFDE1A]" />
                  {formatDate(post.date)}
                </div>
                <p className="mb-2 text-[0.78rem] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{post.category}</p>
                <h1 className="js-hero-title text-balance font-['Fraunces',serif] text-[clamp(2.1rem,4.2vw,4.85rem)] leading-[1.04] text-zinc-900 dark:text-white">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-[60ch] text-[1.06rem] leading-[1.7] text-zinc-600 dark:text-zinc-300">{post.excerpt}</p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="js-hero-meta border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">Published</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{formatDate(post.date)}</div>
                  </div>
                  <div className="js-hero-meta border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">Read time</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{post.readTime}</div>
                  </div>
                  <div className="js-hero-meta border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="text-[0.68rem] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">Author</div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">{post.author}</div>
                  </div>
                  <div className="js-hero-meta flex items-center gap-2 border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition-colors hover:border-[#FFDE1A] hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#FFDE1A] dark:hover:text-[#FFDE1A]"
                      aria-label="Copy blog link"
                    >
                      {hasCopied ? <Check className="h-4 w-4 text-[#37D3A6]" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleShareTwitter}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition-colors hover:border-[#FFDE1A] hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#FFDE1A] dark:hover:text-[#FFDE1A]"
                      aria-label="Share on Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="js-feature-frame relative overflow-hidden border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  {!imageError && post.imageUrl ? (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        onError={() => setImageError(true)}
                        className="js-feature-image h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">Feature image unavailable</div>
                  )}
                  <div className="border-t border-zinc-200 bg-white px-4 py-3 text-xs uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    16:9 feature stage
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="mx-auto mt-10 grid w-full max-w-[1780px] grid-cols-1 gap-6 px-4 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:grid-cols-[340px_minmax(0,1fr)_340px] lg:px-10">
            <aside className="space-y-5">
              {post.showToc && <TableOfContents headings={tocHeadings} activeHeadingId={activeHeadingId} />}
              {!post.showToc && tocHeadings.length > 0 && (
                <TableOfContents headings={tocHeadings} activeHeadingId={activeHeadingId} />
              )}

              <div className="js-reveal border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/65">
                <p className="mb-3 text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Share this article</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-[#FFDE1A] hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#FFDE1A] dark:hover:text-[#FFDE1A]"
                  >
                    <Copy className="h-4 w-4" />
                    Copy link
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="inline-flex items-center gap-2 border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-[#FFDE1A] hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-[#FFDE1A] dark:hover:text-[#FFDE1A]"
                  >
                    <Twitter className="h-4 w-4" />
                    Tweet
                  </button>
                </div>
              </div>
            </aside>

            <div>
              <div className="js-reveal border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#131826]/92 sm:p-6 lg:p-8">
                <div className="blog-content mx-auto max-w-[96ch]">
                  <div className="text-[1.045rem] leading-[1.85]" dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <section className="js-reveal border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/65">
                <h2 className="mb-4 text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Micro insights</h2>
                <div className="space-y-3">
                  {insightCards.map((card) => {
                    const Icon = card.icon
                    return (
                      <article
                        key={card.title}
                        className="group border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-[#FFDE1A]/80 hover:bg-[#fffbe7] dark:border-zinc-800 dark:bg-[#0f1420] dark:hover:border-[#FFDE1A]/70"
                      >
                        <div className="mb-2 flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                          <Icon className="h-4 w-4 text-[#a88300] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 dark:text-[#FFDE1A]" />
                          <span className="text-[0.7rem] uppercase tracking-[0.12em]">{card.title}</span>
                        </div>
                        <p className="font-['Fraunces',serif] text-xl text-zinc-900 dark:text-white">{card.value}</p>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{card.description}</p>
                      </article>
                    )
                  })}
                </div>
              </section>

              {post.tags.length > 0 && (
                <section className="js-reveal border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/65">
                  <h2 className="mb-3 text-[0.72rem] uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Tag index</h2>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#FFDE1A]/60 bg-[#FFDE1A]/12 px-2.5 py-1 text-xs font-medium text-[#7f6200] dark:border-[#FFDE1A]/60 dark:bg-[#FFDE1A]/14 dark:text-[#FFDE1A]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}
