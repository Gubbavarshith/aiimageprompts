import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, Lock, Cookie, Shield, Server, UserCheck, CircleHelp } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { updateCanonical } from '@/lib/seo'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy – AI Image Prompts'
    updateCanonical('/privacy')
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    { id: 'collection', icon: Eye },
    { id: 'usage', icon: UserCheck },
    { id: 'cookies', icon: Cookie },
    { id: 'security', icon: Lock },
    { id: 'third-party', icon: Server },
    { id: 'rights', icon: Shield },
    { id: 'contact', icon: CircleHelp },
  ] as const

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
            Back to home
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Privacy policy
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            How Aiimageprompts collects, uses, and protects information when you browse prompts, submit content, or contact us.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 max-w-5xl py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 px-3">
                On this page
              </p>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center gap-3"
                >
                  <section.icon size={14} />
                  {section.id === 'collection' && 'Information we collect'}
                  {section.id === 'usage' && 'How we use your information'}
                  {section.id === 'cookies' && 'Cookies & analytics'}
                  {section.id === 'security' && 'Data security'}
                  {section.id === 'third-party' && 'Third‑party services'}
                  {section.id === 'rights' && 'Your choices & rights'}
                  {section.id === 'contact' && 'Contacting us'}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-32">
            <div id="collection" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">1</span>
                Information we collect
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                We collect only the data we need to operate Aiimageprompts, improve the experience, and keep the platform secure.
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  <span>Usage data, such as pages visited, basic device details, and interactions with prompts.</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  <span>Technical information required to run the site (like IP address for security and rate‑limiting).</span>
                </li>
              </ul>
            </div>

            <div id="usage" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">2</span>
                How we use your information
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use this data to keep the site reliable, understand what people are using most, and improve the content and features over time. We do not sell your personal data.
              </p>
            </div>

            <div id="cookies" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">3</span>
                Cookies & analytics
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Aiimageprompts may use cookies and similar technologies to remember your preferences (like dark mode) and to measure anonymous usage trends. You can control or clear cookies in your browser at any time.
              </p>
            </div>

            <div id="security" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">4</span>
                Data security
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We take reasonable technical and organizational measures to protect your data, but no online service can guarantee absolute security. We continually review our stack and practices as the project evolves.
              </p>
            </div>

            <div id="third-party" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">5</span>
                Third‑party services
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We may use third‑party providers (for example, hosting, analytics, email delivery, or authentication). These services only receive the data necessary to perform their function and are bound by their own privacy policies.
              </p>
            </div>

            <div id="rights" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">6</span>
                Your choices & rights
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You can choose how much information you share with Aiimageprompts. If you ever want to ask about, update, or delete information associated with you, reach out using the contact information below.
              </p>
            </div>

            <div id="contact" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">7</span>
                Contacting us
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you have questions about this policy, data, or privacy on Aiimageprompts, email us at{' '}
                <a href="mailto:privacy@aiimageprompts.xyz" className="text-black dark:text-white font-bold hover:underline decoration-[#FFDE1A] decoration-2 underline-offset-2">
                  privacy@aiimageprompts.xyz
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

