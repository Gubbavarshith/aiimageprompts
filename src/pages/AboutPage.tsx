import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Users, Zap, Heart, Globe, ShieldCheck, Lightbulb, ArrowRight } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { motion } from 'framer-motion'

export default function AboutPage() {
    useEffect(() => {
        document.title = 'About Us | AI Image Prompts'
        window.scrollTo(0, 0)
    }, [])

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    }

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white font-sans transition-colors duration-300 selection:bg-[#FFDE1A] selection:text-black">
            <FloatingNavbar />

            {/* Hero Section */}
            <div className="relative bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFDE1A]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="container mx-auto px-4 max-w-6xl relative z-10">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-3xl"
                    >
                        <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
                            Empowering the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFDE1A] to-yellow-600">Next Generation</span> of Creators
                        </motion.h1>
                        <motion.p variants={fadeIn} className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            We are building the world's largest open library of AI image generation prompts. Our mission is to democratize AI art creation and make professional-grade prompting accessible to everyone.
                        </motion.p>
                    </motion.div>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-6xl py-20 space-y-32">

                {/* Our Story Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFDE1A]/10 text-[#FFDE1A] text-sm font-bold mb-6 border border-[#FFDE1A]/20">
                            <Sparkles size={14} />
                            <span>Our Story</span>
                        </div>
                        <h2 className="text-4xl font-bold mb-6">Bridging the Gap Between Imagination and Reality</h2>
                        <div className="space-y-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            <p>
                                It started with a simple observation: AI art tools are incredibly powerful, but getting exactly what you want out of them is an art form in itself. The "blank canvas" problem has shifted to a "blank prompt" problem.
                            </p>
                            <p>
                                We realized that while millions of people have access to tools like Midjourney, DALL-E, and Stable Diffusion, only a fraction know how to speak their language fluently.
                            </p>
                            <p>
                                Aiimageprompts.xyz was born to solve this. We curate, test, and share high-quality prompts that serve as recipes for your imagination. We believe that technical know-how shouldn't be a barrier to creativity.
                            </p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#FFDE1A] to-purple-500 rounded-3xl blur-2xl opacity-20 -rotate-6" />
                        <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-3xl p-8 aspect-square flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="relative text-center p-8">
                                <p className="text-3xl font-bold text-white mb-2">10,000+</p>
                                <p className="text-zinc-300">Curated Prompts</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Core Values */}
                <section>
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Why We Do What We Do</h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400">
                            Our values guide every decision we make, from the features we build to the prompts we curate.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Users,
                                color: "text-blue-500",
                                bg: "bg-blue-500/10",
                                title: "Community First",
                                desc: "We believe in the power of sharing. Our platform is built for the community, by the community. Every contribution helps someone else create."
                            },
                            {
                                icon: Zap,
                                color: "text-[#FFDE1A]",
                                bg: "bg-[#FFDE1A]/10",
                                title: "Quality Over Quantity",
                                desc: "We don't just dump prompts. Every prompt in our library is tested to ensure it generates high-quality, consistent results across different models."
                            },
                            {
                                icon: Heart,
                                color: "text-pink-500",
                                bg: "bg-pink-500/10",
                                title: "Open & Accessible",
                                desc: "Creativity should be free. We are committed to keeping our core library open and accessible to everyone, everywhere, forever."
                            },
                            {
                                icon: Globe,
                                color: "text-green-500",
                                bg: "bg-green-500/10",
                                title: "Global Inspiration",
                                desc: "Art transcends borders. We curate styles and cultural influences from around the world to foster a diverse creative ecosystem."
                            },
                            {
                                icon: ShieldCheck,
                                color: "text-purple-500",
                                bg: "bg-purple-500/10",
                                title: "Ethical AI",
                                desc: "We advocate for responsible AI usage. We actively filter harmful content and promote prompts that respect copyright and ethical guidelines."
                            },
                            {
                                icon: Lightbulb,
                                color: "text-orange-500",
                                bg: "bg-orange-500/10",
                                title: "Continuous Learning",
                                desc: "AI is evolving fast, and so are we. We constantly update our library with the latest techniques, models, and prompting strategies."
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-[#FFDE1A]/50 dark:hover:border-[#FFDE1A]/50 transition-colors group"
                            >
                                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon className={`w-7 h-7 ${item.color}`} />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Stats Section */}
                <section className="bg-zinc-900 dark:bg-white rounded-[3rem] p-12 md:p-20 text-white dark:text-black overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#FFDE1A]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
                        {[
                            { number: "50K+", label: "Active Users" },
                            { number: "100K+", label: "Prompts Generated" },
                            { number: "15+", label: "AI Models Supported" },
                            { number: "24/7", label: "Community Support" }
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl md:text-6xl font-black mb-2 text-[#FFDE1A] dark:text-black">{stat.number}</div>
                                <div className="text-zinc-400 dark:text-zinc-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: "Is this platform free to use?",
                                a: "Yes! Our core prompt library is completely free to browse and use. We believe in open access to creative tools."
                            },
                            {
                                q: "Can I contribute my own prompts?",
                                a: "Absolutely. We encourage community contributions. You can submit your best prompts, and once reviewed by our team, they will be added to the library."
                            },
                            {
                                q: "Which AI models do these prompts work with?",
                                a: "Our prompts are designed to be versatile, but many are optimized for Midjourney v6, DALL-E 3, and Stable Diffusion XL. We provide specific tags for model-specific optimizations."
                            },
                            {
                                q: "Do you offer an API?",
                                a: "We are currently working on a public API for developers. Join our newsletter to get notified when it launches."
                            }
                        ].map((faq, index) => (
                            <div key={index} className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
                                <h3 className="text-lg font-bold mb-2">{faq.q}</h3>
                                <p className="text-zinc-600 dark:text-zinc-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="text-center py-20">
                    <h2 className="text-3xl md:text-4xl md:text-5xl font-black mb-6">Ready to Start Creating?</h2>
                    <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
                        Join thousands of creators who are already using our library to bring their ideas to life.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <Link to="/explore">
                            <button className="px-8 py-4 bg-[#FFDE1A] hover:bg-[#ffe64d] text-black font-bold rounded-full text-lg transition-all hover:scale-105 shadow-[0_0_30px_-10px_#FFDE1A] flex items-center gap-2">
                                Explore Prompts <ArrowRight size={20} />
                            </button>
                        </Link>
                        <Link to="/auth">
                            <button className="px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white font-bold rounded-full text-lg transition-all hover:scale-105">
                                Create Account
                            </button>
                        </Link>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    )
}
