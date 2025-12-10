import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, Lock, Cookie, Shield, Server, UserCheck, CircleHelp } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | AI Image Prompts'
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    { id: 'collection', title: '1. Information We Collect', icon: Eye },
    { id: 'usage', title: '2. How We Use Information', icon: UserCheck },
    { id: 'cookies', title: '3. Cookies', icon: Cookie },
    { id: 'security', title: '4. Data Security', icon: Lock },
    { id: 'third-party', title: '5. Third-Party Services', icon: Server },
    { id: 'rights', title: '6. Your Rights', icon: Shield },
    { id: 'contact', title: '7. Contact', icon: CircleHelp },
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
            Privacy Policy
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            We value your privacy. This policy explains how we collect, use, and protect your personal information when you use our service.
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
            <div id="collection" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">1</span>
                Information We Collect
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                Aiimageprompts.xyz collects minimal information to provide our service:
              </p>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  <span><strong>Usage Data:</strong> Anonymous analytics about page views and prompt interactions to help us understand what content is popular.</span>
                </li>
                <li className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                  <span><strong>Technical Data:</strong> Browser type, device information, and screen resolution to ensure compatibility and optimal performance.</span>
                </li>
              </ul>
            </div>

            <div id="usage" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">2</span>
                How We Use Your Information
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use collected information solely to improve our service, understand usage patterns,
                and ensure platform stability. We do not sell, rent, or share personal data with third parties for marketing purposes.
              </p>
            </div>

            <div id="cookies" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">3</span>
                Cookies
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use essential cookies for basic functionality like remembering your theme preferences (light/dark mode).
                No tracking cookies are used without your explicit consent. You can control cookie settings through your browser preferences.
              </p>
            </div>

            <div id="security" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">4</span>
                Data Security
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We implement industry-standard security measures to protect any data we collect.
                Our infrastructure is hosted on secure, encrypted servers, and we regularly review our security practices to ensure your data remains safe.
              </p>
            </div>

            <div id="third-party" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">5</span>
                Third-Party Services
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use Supabase for our backend infrastructure. Their privacy practices are governed
                by their own privacy policy. We encourage you to review their policies if you have concerns about how your data is handled on their servers.
              </p>
            </div>

            <div id="rights" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">6</span>
                Your Rights
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You have the right to access, correct, or delete any personal data we may have.
                Since we collect minimal personal data, this is mostly relevant if you have contacted us directly. Contact us to exercise these rights.
              </p>
            </div>

            <div id="contact" className="mb-16 scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm">7</span>
                Contact
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                For privacy-related inquiries, please contact us at{' '}
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

