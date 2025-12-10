import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Shield, Scale, CircleHelp } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Use | AI Image Prompts'
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms', icon: FileText },
    { id: 'usage', title: '2. Use of Service', icon: Shield },
    { id: 'conduct', title: '3. User Conduct', icon: Scale },
    { id: 'ip', title: '4. Intellectual Property', icon: FileText },
    { id: 'disclaimer', title: '5. Disclaimer', icon: CircleHelp },
    { id: 'contact', title: '6. Contact', icon: CircleHelp },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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
            Terms of Use
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Please read these terms carefully before using our service. They outline your rights and responsibilities when using Aiimageprompts.xyz.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-5xl py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-3">Contents</p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-3"
                >
                  <section.icon size={14} />
                  {section.title.split('. ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-32">
            <div id="acceptance" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">1</span>
                Acceptance of Terms
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                By accessing and using Aiimageprompts.xyz ("the Service"), you accept and agree to be bound by the terms and
                provisions of this agreement. If you do not agree to these terms, please do not use our service. We reserve the right to modify these terms at any time, and such modifications shall be effective immediately upon posting.
              </p>
            </div>

            <div id="usage" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">2</span>
                Use of Service
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                Our service provides AI image generation prompts for creative purposes. We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms. You may:
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  Browse and copy prompts for personal and commercial use
                </li>
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  Share prompts with attribution to our platform
                </li>
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  Use prompts with any AI image generation tool (Midjourney, DALL-E, Stable Diffusion, etc.)
                </li>
              </ul>
            </div>

            <div id="conduct" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">3</span>
                User Conduct
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You agree not to use the service to create content that is illegal, harmful, threatening,
                abusive, harassing, defamatory, or otherwise objectionable. You also agree not to scrape, harvest, or systematically collect data from our Service without express written permission.
              </p>
            </div>

            <div id="ip" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">4</span>
                Intellectual Property
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The prompts provided on this platform are free to use. However, the website design, logo, code,
                and other branding elements are the property of Aiimageprompts.xyz and are protected by copyright and other intellectual property laws.
              </p>
            </div>

            <div id="disclaimer" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">5</span>
                Disclaimer
              </h2>
              <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed m-0">
                  The service is provided "as is" without warranties of any kind. We do not guarantee the
                  quality or results of AI-generated images from our prompts, as results vary based on the specific AI model and version used.
                </p>
              </div>
            </div>

            <div id="contact" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">6</span>
                Contact
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@aiimageprompts.xyz" className="text-black dark:text-white font-bold hover:underline decoration-[#FFDE1A] decoration-2 underline-offset-2">
                  legal@aiimageprompts.xyz
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

