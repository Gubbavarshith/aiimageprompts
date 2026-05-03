import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, CircleHelp, Search, X } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { getFaqs, getCategories, type FaqItem } from '@/lib/services/faqs'
import { updateMetaTags, upsertJsonLd, removeJsonLd } from '@/lib/seo'

export default function FAQPage() {
    const faqItems = useMemo(() => getFaqs(), [])
    const categories = useMemo(() => getCategories(), [])

    useEffect(() => {
        const title = 'AI Image Prompts FAQ | Better Prompts, Better Art'
        const description = 'Frequently asked questions about the AI image prompts library, supported models, pricing, and how to use prompts effectively.'
        updateMetaTags({
            title,
            description,
            canonical: '/faq',
            og: {
                title,
                description,
                url: '/faq',
                image: '/og-image.png',
                type: 'website',
                siteName: 'AI Image Prompts',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                image: '/og-image.png',
            },
        })

        const faqJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item: FaqItem) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                },
            })),
        }
        upsertJsonLd('faq-jsonld', faqJsonLd)
        window.scrollTo(0, 0)
        return () => removeJsonLd('faq-jsonld')
    }, [])

    const [openId, setOpenId] = useState<string | null>(null)
    const [activeCategory, setActiveCategory] = useState<string>('All')
    const [searchQuery, setSearchQuery] = useState<string>('')

    const handleToggle = useCallback((question: string) => {
        setOpenId(prev => prev === question ? null : question)
    }, [])

    const filteredFaqs = useMemo(() => {
        let results = activeCategory === 'All'
            ? faqItems
            : faqItems.filter((faq: FaqItem) => faq.category === activeCategory)

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim()
            results = results.filter((faq: FaqItem) =>
                faq.question.toLowerCase().includes(q) ||
                faq.answer.toLowerCase().includes(q)
            )
        }

        return results
    }, [faqItems, activeCategory, searchQuery])

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30">
            <FloatingNavbar />

            {/* Technical Header */}
            <div className="pt-32 pb-8 border-b border-zinc-200 dark:border-zinc-800/80">
                <div className="w-full px-6 lg:px-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-black dark:hover:text-white transition-colors uppercase"
                        >
                            <ArrowLeft size={14} />
                            cd /home
                        </Link>
                        <span className="text-zinc-300 dark:text-zinc-800">/</span>
                        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-300 uppercase">System Documentation</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
                        Frequently Asked Questions 
                    </h1>
                </div>
            </div>

            <main className="w-full px-6 lg:px-12 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-12 items-start">
                    
                    {/* Left Sidebar: Navigation */}
                    <aside className="hidden lg:block sticky top-32 p-4 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                        <h2 className="text-xs font-mono font-medium text-zinc-500 mb-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">CATEGORIES</h2>
                        <ul className="space-y-1 text-sm">
                            {categories.map((category: string) => (
                                <li key={category}>
                                    <button 
                                        onClick={() => {
                                            setActiveCategory(category)
                                            setOpenId(null)
                                            setSearchQuery('')
                                        }}
                                        className={`text-left w-full px-3 py-2 rounded-lg transition-colors ${
                                            activeCategory === category 
                                                ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white font-medium' 
                                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {/* Central Area: Data Grid */}
                    <section className="min-w-0">
                        {/* Search Bar */}
                        <div className="relative mb-6">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setOpenId(null)
                                }}
                                placeholder="Search questions..."
                                className="w-full pl-11 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 focus:border-transparent transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between mb-6 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                            <h2 className="text-xs font-mono font-medium text-zinc-500">DATA_RECORDS</h2>
                            {searchQuery && (
                                <span className="text-xs font-mono text-zinc-400">
                                    {filteredFaqs.length} result{filteredFaqs.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                            <AnimatePresence mode="popLayout">
                                {filteredFaqs.map((item: FaqItem) => {
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            key={item.question}
                                            className={`border bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl hover:bg-white dark:hover:bg-zinc-900/80 transition-all overflow-hidden self-start ${
                                                openId === item.question
                                                    ? 'border-zinc-300 dark:border-zinc-700 ring-1 ring-zinc-200/50 dark:ring-zinc-700/50'
                                                    : 'border-zinc-200 dark:border-zinc-800/80'
                                            }`}
                                        >
                                            <button
                                                onClick={() => handleToggle(item.question)}
                                                className="w-full text-left p-6 focus:outline-none flex flex-col gap-4"
                                            >
                                                <div className="flex items-start justify-between w-full gap-4">
                                                    <h3 className="text-base sm:text-lg font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                                                        {item.question}
                                                    </h3>
                                                    <motion.div 
                                                        animate={{ rotate: openId === item.question ? 180 : 0 }} 
                                                        transition={{ duration: 0.2 }}
                                                        className="mt-1 flex-shrink-0 text-zinc-400 dark:text-zinc-500"
                                                    >
                                                        <ChevronDown size={18} />
                                                    </motion.div>
                                                </div>
                                                <AnimatePresence initial={false}>
                                                    {openId === item.question && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                                                            className="overflow-hidden w-full"
                                                        >
                                                            <div 
                                                                className="faq-answer pt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed"
                                                                dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                                                            />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </button>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            {filteredFaqs.length === 0 && (
                                <div className="text-zinc-500 py-12 text-center col-span-full border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                    <p className="text-sm">No records found{searchQuery ? ` for "${searchQuery}"` : ' in this category'}.</p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline transition-colors"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right Sidebar: System Metadata */}
                    <aside className="sticky top-32 space-y-6">
                        <div className="border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl">
                            <h2 className="text-xs font-mono font-medium text-zinc-500 mb-6 border-b border-zinc-200 dark:border-zinc-800/80 pb-2">SYSTEM_METADATA</h2>
                            <div className="space-y-4 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                <div className="flex items-center justify-between">
                                    <span>Version</span>
                                    <span className="text-black dark:text-white">v1.0.4</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Total_Records</span>
                                    <span className="text-black dark:text-white">{faqItems.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Last_Sync</span>
                                    <span className="text-black dark:text-white">{new Date().toISOString().split('T')[0]}</span>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800/80">
                                    <span>Status</span>
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Operational
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80">
                            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <CircleHelp size={16} /> Data Not Found?
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                Query our team directly for unresolved issues or specific prompt engineering questions.
                            </p>
                            <Link to="/contact">
                                <button className="w-full bg-black dark:bg-white text-white dark:text-black text-sm font-medium py-2.5 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm">
                                    Submit Query
                                </button>
                            </Link>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    )
}
