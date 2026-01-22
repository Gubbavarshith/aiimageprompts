import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Cookie, Eye, Server, Shield, Settings, Clock, Lock } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { updateCanonical } from '@/lib/seo'

export default function CookiesPolicyPage() {
  useEffect(() => {
    document.title = 'Cookies Policy | Better Prompts, Better Art'
    updateCanonical('/cookies')
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    { id: 'what-are-cookies', icon: Cookie },
    { id: 'types-of-cookies', icon: Eye },
    { id: 'how-we-use', icon: Server },
    { id: 'third-party', icon: Settings },
    { id: 'manage-cookies', icon: Shield },
    { id: 'updates', icon: Clock },
    { id: 'contact', icon: Lock },
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
            Cookies Policy
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Learn about how we use cookies and similar technologies to enhance your experience on AI Image Prompts.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 max-w-5xl py-16">
        <div className="grid lg:grid-cols-[200px_1fr] gap-12">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <nav className="sticky top-32 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Icon size={16} />
                    <span className="capitalize">{section.id.replace(/-/g, ' ')}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <article className="prose prose-zinc dark:prose-invert max-w-none">
            <section id="what-are-cookies" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Cookie size={28} />
                What Are Cookies?
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Cookies allow a website to recognize your device and store some information about your preferences or past actions. This helps us provide you with a better, faster, and safer experience.
              </p>
            </section>

            <section id="types-of-cookies" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Eye size={28} />
                Types of Cookies We Use
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt-out of these cookies.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the way our website works.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Preference Cookies</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    These cookies allow our website to remember information that changes the way the site behaves or looks, such as your preferred language or the region you are in.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Functional Cookies</h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    These cookies enable enhanced functionality and personalization, such as remembering your login status and preferences.
                  </p>
                </div>
              </div>
            </section>

            <section id="how-we-use" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Server size={28} />
                How We Use Cookies
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                <li>To remember your preferences and settings</li>
                <li>To analyze how our website is used and improve its performance</li>
                <li>To provide personalized content and features</li>
                <li>To ensure security and prevent fraud</li>
                <li>To remember your authentication status</li>
                <li>To track your consent for cookie usage</li>
              </ul>
            </section>

            <section id="third-party" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Settings size={28} />
                Third-Party Cookies
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements, and so on. These third-party services may include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                <li><strong>Google Analytics:</strong> To understand how visitors use our website</li>
                <li><strong>Authentication Services:</strong> To manage user authentication and sessions</li>
                <li><strong>Content Delivery Networks:</strong> To deliver content efficiently</li>
              </ul>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mt-4">
                These third parties may use cookies to collect information about your online activities across different websites. We do not control these cookies, and you should check the third-party websites for more information about their cookies.
              </p>
            </section>

            <section id="manage-cookies" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Shield size={28} />
                Managing Your Cookie Preferences
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                You have the right to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.
              </p>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                However, if you choose to decline cookies, you may not be able to fully experience the interactive features of our website or some services may not function properly.
              </p>
              <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Browser Settings</h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-2">
                  You can control cookies through your browser settings. Here are links to help you manage cookies in popular browsers:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-zinc-700 dark:text-zinc-300">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Safari</a></li>
                  <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Microsoft Edge</a></li>
                </ul>
              </div>
            </section>

            <section id="updates" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Clock size={28} />
                Updates to This Policy
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please revisit this page periodically to stay informed about our use of cookies.
              </p>
            </section>

            <section id="contact" className="mb-16 scroll-mt-32">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <Lock size={28} />
                Contact Us
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookies Policy, please contact us through our <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">contact page</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  )
}

