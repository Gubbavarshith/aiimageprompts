import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, CircleX, TriangleAlert } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'

export default function GuidelinesPage() {
    useEffect(() => {
        document.title = 'Guidelines | AI Image Prompts'
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">
            <FloatingNavbar />

            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-32 pb-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                        Community Guidelines
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
                        To ensure a safe and creative environment for everyone, we have established these guidelines for using and contributing to our platform.
                    </p>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-5xl py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Do's */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CircleCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Encouraged</h2>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Share Creativity</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Use our prompts to explore new artistic styles and ideas. Feel free to modify them to suit your vision.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Give Credit</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                If you share prompts found here on other platforms, a link back to Aiimageprompts.xyz is appreciated!
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Report Issues</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                If you find a prompt that generates inappropriate content or doesn't work as described, please let us know.
                            </p>
                        </div>
                    </div>

                    {/* Don'ts */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <CircleX className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold">Prohibited</h2>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">NSFW Content</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                We do not host or support prompts designed to generate explicit, pornographic, or gore content.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Hate Speech</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Prompts intended to generate hate speech, discrimination, or harassment against any group are strictly forbidden.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Harmful Content</h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                Do not use our service to generate content that promotes self-harm, violence, or illegal activities.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Note */}
                <div className="mt-16 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 flex items-start gap-6">
                    <TriangleAlert className="w-8 h-8 text-yellow-600 dark:text-yellow-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-xl font-bold mb-2 text-yellow-800 dark:text-yellow-400">A Note on AI Safety</h3>
                        <p className="text-yellow-700 dark:text-yellow-300/80 leading-relaxed">
                            While we curate our prompts, AI models can sometimes be unpredictable. We cannot guarantee that every generation will be perfectly safe. Users are responsible for the content they generate and share. Please use AI tools responsibly.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
