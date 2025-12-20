import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { motion, AnimatePresence } from 'framer-motion'

const FAQ_ITEMS = [
  {
    question: 'What is Aiimageprompts?',
    answer:
      'Aiimageprompts is a curated library of image-generation prompts designed for tools like Midjourney, DALL·E, and Stable Diffusion. Instead of random prompt dumps, everything here is edited, organized, and tuned for creative use.',
  },
  {
    question: 'Is Aiimageprompts free to use?',
    answer:
      'Yes. Browsing, copying, and experimenting with prompts is completely free. Some advanced features and future tools may be paid, but the core library remains open.',
  },
  {
    question: 'Do I need coding or design skills to use these prompts?',
    answer:
      'No. If you can paste a prompt into your favorite model, you can use this site. Designers, marketers, founders, and hobbyists all use these prompts to move faster.',
  },
  {
    question: 'Which AI image models do these prompts work with?',
    answer:
      'Most prompts are written model-agnostic and work well with Midjourney, DALL·E, and Stable Diffusion. You may tweak syntax slightly per model, but the creative direction stays the same.',
  },
  {
    question: 'Can I submit my own prompts?',
    answer:
      'Yes. You can submit your own prompts from the Submit page. The best ones—original, clear, and visually interesting—get curated into the public library.',
  },
  {
    question: 'How often is the library updated?',
    answer:
      'We add and refine prompts regularly, focusing on quality over volume. When models evolve, we revisit older prompts so they still produce strong results.',
  },
] as const

export default function FAQPage() {
    useEffect(() => {
        document.title = 'FAQ – Aiimageprompts'
        window.scrollTo(0, 0)
    }, [])

    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">
            <FloatingNavbar />

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-32 pb-16">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
                        Frequently asked questions
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                        Answers to the most common questions about Aiimageprompts, prompts, and how to use the site effectively.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-3xl py-16">
                    <div className="space-y-4">
                    {FAQ_ITEMS.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className="font-bold text-lg pr-8">{item.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="shrink-0 text-zinc-400" />
                                ) : (
                                    <ChevronDown className="shrink-0 text-zinc-400" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                            <div className="px-6 pb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {item.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-8">
                    <CircleHelp className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                    <h3 className="text-xl font-bold mb-2">Still stuck on something?</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        If your question isn’t answered here, reach out and we’ll get back to you as soon as we can.
                    </p>
                    <Link to="/contact">
                            <button className="bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity">
                            Contact us
                        </button>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}
