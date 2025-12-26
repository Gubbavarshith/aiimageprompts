import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, CreditCard, Clock, CheckCircle, XCircle, Mail } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { updateCanonical } from '@/lib/seo'

export default function RefundPolicyPage() {
  useEffect(() => {
    document.title = 'Refund & Cancellation Policy – AI Image Prompts'
    updateCanonical('/refund')
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    { id: 'overview', icon: RefreshCw },
    { id: 'eligibility', icon: CheckCircle },
    { id: 'process', icon: CreditCard },
    { id: 'timeline', icon: Clock },
    { id: 'non-refundable', icon: XCircle },
    { id: 'contact', icon: Mail },
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
            Refund & Cancellation Policy
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Our policy regarding refunds, cancellations, and your rights as a user of AI Image Prompts.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-5xl py-16">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors"
                >
                  <section.icon size={16} />
                  <span className="capitalize">{section.id.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* Overview */}
            <section id="overview" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <RefreshCw size={28} />
                Overview
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  AI Image Prompts is a free platform that provides AI image generation prompts and resources. 
                  This policy outlines our approach to refunds and cancellations for any paid services or 
                  premium features that may be offered in the future.
                </p>
                <p>
                  Currently, AI Image Prompts operates as a free service. If we introduce any paid features, 
                  subscriptions, or premium services, this policy will govern those transactions.
                </p>
              </div>
            </section>

            {/* Eligibility */}
            <section id="eligibility" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <CheckCircle size={28} />
                Refund Eligibility
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  Refunds may be considered under the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Service Failure:</strong> If a paid service fails to function as described 
                    due to technical issues on our end
                  </li>
                  <li>
                    <strong>Duplicate Charges:</strong> If you are charged multiple times for the same 
                    service or subscription
                  </li>
                  <li>
                    <strong>Unauthorized Charges:</strong> If a charge appears on your account that you 
                    did not authorize
                  </li>
                  <li>
                    <strong>Cancellation Within Grace Period:</strong> If you cancel a subscription within 
                    the specified grace period (typically 7-14 days)
                  </li>
                </ul>
              </div>
            </section>

            {/* Process */}
            <section id="process" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <CreditCard size={28} />
                Refund Process
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  To request a refund, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Contact Us:</strong> Send an email to{' '}
                    <a href="mailto:team@aiimageprompts.xyz" className="text-[#FFDE1A] hover:underline">
                      team@aiimageprompts.xyz
                    </a>{' '}
                    with the subject line "Refund Request"
                  </li>
                  <li>
                    <strong>Provide Details:</strong> Include your account email, transaction ID, 
                    date of purchase, and reason for the refund request
                  </li>
                  <li>
                    <strong>Review Period:</strong> We will review your request within 5-7 business days
                  </li>
                  <li>
                    <strong>Processing:</strong> If approved, refunds will be processed to your original 
                    payment method within 10-14 business days
                  </li>
                </ol>
              </div>
            </section>

            {/* Timeline */}
            <section id="timeline" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Clock size={28} />
                Refund Timeline
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  Refund processing times vary depending on your payment method:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Credit/Debit Cards:</strong> 5-10 business days after approval
                  </li>
                  <li>
                    <strong>PayPal:</strong> 3-5 business days after approval
                  </li>
                  <li>
                    <strong>Bank Transfers:</strong> 10-14 business days after approval
                  </li>
                </ul>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                  Note: Processing times may vary based on your financial institution.
                </p>
              </div>
            </section>

            {/* Non-Refundable */}
            <section id="non-refundable" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <XCircle size={28} />
                Non-Refundable Items
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  The following are generally not eligible for refunds:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Services that have been fully consumed or accessed
                  </li>
                  <li>
                    Subscriptions cancelled after the grace period
                  </li>
                  <li>
                    Charges for services that were used as intended
                  </li>
                  <li>
                    Refund requests made more than 30 days after the original purchase
                  </li>
                  <li>
                    Charges resulting from violation of our Terms of Service
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section id="contact" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Mail size={28} />
                Contact Us
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  If you have questions about refunds or cancellations, please contact us:
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-6 space-y-3">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:team@aiimageprompts.xyz" className="text-[#FFDE1A] hover:underline">
                      team@aiimageprompts.xyz
                    </a>
                  </p>
                  <p>
                    <strong>Contact Page:</strong>{' '}
                    <Link to="/contact" className="text-[#FFDE1A] hover:underline">
                      https://aiimageprompts.xyz/contact
                    </Link>
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    We aim to respond to all refund requests within 48 hours during business days.
                  </p>
                </div>
              </div>
            </section>

            {/* Last Updated */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-16">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

