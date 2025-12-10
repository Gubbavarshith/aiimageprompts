import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
    {
        question: "Is this service free?",
        answer: "Yes! Our core library of AI image prompts is completely free to use. You can browse, copy, and use them for your own creations without any cost."
    },
    {
        question: "Do I need an account to use the prompts?",
        answer: "No, you do not need an account to browse or copy prompts. We believe in removing friction so you can get started immediately."
    },
    {
        question: "Which AI models do these prompts work with?",
        answer: "Our prompts are designed to be versatile. While many are optimized for Midjourney v5/v6, they often work well with DALL-E 3 and Stable Diffusion XL with minor tweaks."
    },
    {
        question: "Can I use the generated images commercially?",
        answer: "The images you generate using our prompts are subject to the terms of service of the AI tool you use (e.g., Midjourney, OpenAI). Generally, if you have a paid plan with those services, you own the commercial rights."
    },
    {
        question: "How can I submit my own prompts?",
        answer: "We are currently working on a submission system! For now, you can contact us via email if you have a collection of high-quality prompts you'd like to share."
    },
    {
        question: "Why do my results look different from the preview?",
        answer: "AI generation is non-deterministic, meaning it produces different results every time, even with the same prompt. The preview images serve as a guide to the style and composition you can expect."
    }
]

export default function FAQPage() {
    useEffect(() => {
        document.title = 'FAQ | AI Image Prompts'
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
                        Back to Home
                    </Link>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                        Have questions? We're here to help. If you can't find what you're looking for, feel free to contact us.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-3xl py-16">
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className="font-bold text-lg pr-8">{faq.question}</span>
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
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-8">
                    <CircleHelp className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                    <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                        Can't find the answer you're looking for? Please chat to our friendly team.
                    </p>
                    <Link to="/contact">
                        <button className="bg-black dark:bg-white text-white dark:text-black font-bold py-2 px-6 rounded-full hover:opacity-90 transition-opacity">
                            Get in Touch
                        </button>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    )
}
