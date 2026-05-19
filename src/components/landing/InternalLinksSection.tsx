import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, Sparkles } from 'lucide-react'
import { getPublishedBlogPosts, formatDate } from '@/lib/services/blogs'

// --- Category Data ---
// Static list matching the categories in the database
// Using <Link> tags (not onClick navigation) so Googlebot can follow them
const CATEGORY_LINKS = [
  { name: 'Cinematic', emoji: '🎬', description: 'Film-quality dramatic scenes' },
  { name: 'Anime', emoji: '✨', description: 'Japanese animation styles' },
  { name: 'Photography', emoji: '📸', description: 'Photorealistic AI images' },
  { name: 'Illustration', emoji: '🎨', description: 'Digital art & concept work' },
  { name: 'Product', emoji: '📦', description: 'E-commerce & product shots' },
  { name: 'Fashion', emoji: '👗', description: 'Editorial & runway styles' },
  { name: 'Architecture', emoji: '🏛️', description: 'Buildings & interiors' },
  { name: 'Abstract', emoji: '🌀', description: 'Non-representational art' },
  { name: 'Fantasy', emoji: '🐉', description: 'Mythical & magical worlds' },
  { name: 'Landscape', emoji: '🏔️', description: 'Nature & environments' },
]

// --- Blog Post Card ---
const BlogPostCard = ({
  post,
  index,
}: {
  post: { title: string; slug: string; excerpt: string; date: string; category: string; readTime: string }
  index: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl border-2 border-black/5 dark:border-white/5 hover:border-[#FFDE1A]/50 dark:hover:border-[#FFDE1A]/30 overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-3">
          <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
            {post.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.date)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-black dark:text-white mb-2 leading-snug group-hover:text-[#F8BE00] transition-colors">
          {post.title}
        </h3>
        <p className="text-zinc-500 dark:text-zinc-500 text-sm leading-relaxed line-clamp-2 flex-1 mb-4">
          {post.excerpt}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F8BE00] group-hover:gap-2.5 transition-all">
          Read article <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  </motion.div>
)

// --- Category Link Card ---
const CategoryLinkCard = ({
  category,
  index,
}: {
  category: (typeof CATEGORY_LINKS)[number]
  index: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  >
    <Link
      to={`/explore?category=${encodeURIComponent(category.name)}`}
      className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 dark:border-white/5 hover:border-[#FFDE1A]/50 dark:hover:border-[#FFDE1A]/30 transition-all duration-300 hover:shadow-md"
    >
      <span className="text-2xl flex-shrink-0" role="img" aria-hidden="true">
        {category.emoji}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-black dark:text-white group-hover:text-[#F8BE00] transition-colors truncate">
          {category.name}
        </h3>
        <p className="text-xs text-zinc-400 truncate">{category.description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-[#F8BE00] flex-shrink-0 ml-auto transition-colors" />
    </Link>
  </motion.div>
)

// --- Main Section ---
export const InternalLinksSection = () => {
  const recentPosts = useMemo(() => {
    const posts = getPublishedBlogPosts()
    return posts.slice(0, 3)
  }, [])

  return (
    <section className="relative py-24 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      {/* Subtle background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFDE1A]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Recent Blog Posts */}
        {recentPosts.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFDE1A]/10 text-[#F8BE00]">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">
                    Latest from the Blog
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Guides, techniques, and prompt engineering tips
                  </p>
                </div>
              </div>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-[#F8BE00] hover:underline"
              >
                View all posts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.map((post, idx) => (
                <BlogPostCard key={post.slug} post={post} index={idx} />
              ))}
            </div>

            {/* Mobile "View all" link */}
            <div className="mt-6 text-center sm:hidden">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#F8BE00] hover:underline"
              >
                View all blog posts <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Browse by Category */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFDE1A]/10 text-[#F8BE00]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-black dark:text-white">
                Browse by Category
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Find prompts organized by visual style and use case
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CATEGORY_LINKS.map((cat, idx) => (
              <CategoryLinkCard key={cat.name} category={cat} index={idx} />
            ))}
          </div>

          {/* Full explore CTA */}
          <div className="mt-8 text-center">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFDE1A] text-black border-2 border-black font-bold rounded-xl hover:bg-black hover:text-[#F8BE00] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Sparkles className="w-4 h-4" />
              Explore all prompts
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InternalLinksSection
