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
                  AI Image Prompts offers both free and premium subscription plans. This policy outlines 
                  our approach to refunds, cancellations, and your rights regarding paid subscriptions and 
                  premium features.
                </p>
                <p>
                  By subscribing to any paid plan or purchasing premium features, you agree to the terms 
                  outlined in this policy. We are committed to providing fair and transparent refund 
                  processes for all our users.
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
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Subscription Cancellation Within Grace Period:</strong> If you cancel your 
                    subscription within 7 days of the initial purchase, you are eligible for a full refund. 
                    This grace period applies only to first-time subscribers.
                  </li>
                  <li>
                    <strong>Service Failure:</strong> If premium features or services fail to function 
                    as described due to technical issues on our end, and we are unable to resolve the 
                    issue within 48 hours of your report.
                  </li>
                  <li>
                    <strong>Duplicate Charges:</strong> If you are charged multiple times for the same 
                    subscription period or feature purchase.
                  </li>
                  <li>
                    <strong>Unauthorized Charges:</strong> If a charge appears on your account that you 
                    did not authorize, provided you report it within 30 days.
                  </li>
                  <li>
                    <strong>Billing Errors:</strong> If you are charged an incorrect amount due to a 
                    system error or pricing mistake on our part.
                  </li>
                </ul>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mt-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Refund eligibility is determined on a case-by-case basis. 
                    We reserve the right to request additional information to verify your claim.
                  </p>
                </div>
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
                    with the subject line "Refund Request" or use our{' '}
                    <Link to="/contact" className="text-[#FFDE1A] hover:underline">
                      contact form
                    </Link>
                  </li>
                  <li>
                    <strong>Provide Details:</strong> Include the following information:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Your account email address</li>
                      <li>Transaction ID or receipt number</li>
                      <li>Date of purchase</li>
                      <li>Subscription plan or feature purchased</li>
                      <li>Reason for the refund request</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Review Period:</strong> We will review your request within 3-5 business days 
                    and may contact you for additional information if needed.
                  </li>
                  <li>
                    <strong>Processing:</strong> If approved, refunds will be processed to your original 
                    payment method within 7-14 business days. You will receive a confirmation email 
                    once the refund has been processed.
                  </li>
                </ol>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> For faster processing, include screenshots of your receipt 
                    or transaction details when submitting your refund request.
                  </p>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section id="timeline" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Clock size={28} />
                Refund Timeline & Processing
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  Once your refund request is approved, processing times vary depending on your payment method:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Credit/Debit Cards:</strong> 7-14 business days after approval
                  </li>
                  <li>
                    <strong>PayPal:</strong> 3-7 business days after approval
                  </li>
                  <li>
                    <strong>Stripe:</strong> 5-10 business days after approval
                  </li>
                  <li>
                    <strong>Bank Transfers:</strong> 10-15 business days after approval
                  </li>
                </ul>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mt-4">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <strong>Important:</strong> Processing times begin after we approve your refund request, 
                    not from the date you submit it. The actual time it takes for funds to appear in your 
                    account depends on your financial institution's processing schedule. We will send you 
                    a confirmation email once the refund has been initiated.
                  </p>
                </div>
              </div>
            </section>

            {/* Non-Refundable */}
            <section id="non-refundable" className="mb-16 scroll-mt-24">
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <XCircle size={28} />
                Non-Refundable Items & Exceptions
              </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>
                  The following circumstances are generally not eligible for refunds:
                </p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>
                    <strong>Subscription Renewals:</strong> Refunds are not available for subscription 
                    renewals unless you cancel within the grace period of your first renewal payment. 
                    Once a subscription period has begun, refunds are prorated based on unused time.
                  </li>
                  <li>
                    <strong>Used Services:</strong> If you have actively used premium features or 
                    accessed premium content during the subscription period, refunds may be prorated 
                    or denied based on usage.
                  </li>
                  <li>
                    <strong>Late Cancellation:</strong> Subscriptions cancelled after the 7-day grace 
                    period are not eligible for full refunds. However, you can cancel at any time to 
                    prevent future charges.
                  </li>
                  <li>
                    <strong>Time Limit:</strong> Refund requests must be submitted within 30 days of 
                    the original purchase date. Requests made after this period will not be considered.
                  </li>
                  <li>
                    <strong>Terms of Service Violations:</strong> Accounts that have violated our Terms 
                    of Service are not eligible for refunds, regardless of the circumstances.
                  </li>
                  <li>
                    <strong>Change of Mind:</strong> Refunds are not available simply because you changed 
                    your mind about a subscription after the grace period, unless there are extenuating 
                    circumstances that we determine warrant consideration.
                  </li>
                </ul>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-4 mt-6">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    <strong>Subscription Cancellation:</strong> You can cancel your subscription at any 
                    time from your account settings. Cancellation will prevent future charges, but does 
                    not automatically entitle you to a refund for the current billing period unless 
                    cancelled within the grace period.
                  </p>
                </div>
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
                  If you have questions about refunds, cancellations, or need assistance with your 
                  subscription, please contact us through one of the following methods:
                </p>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl p-6 space-y-4">
                  <div>
                    <strong className="block mb-2">Email Support:</strong>
                    <a href="mailto:team@aiimageprompts.xyz" className="text-[#FFDE1A] hover:underline">
                      team@aiimageprompts.xyz
                    </a>
                  </div>
                  <div>
                    <strong className="block mb-2">Contact Form:</strong>
                    <Link to="/contact" className="text-[#FFDE1A] hover:underline">
                      https://aiimageprompts.xyz/contact
                    </Link>
                  </div>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      <strong>Response Times:</strong>
                    </p>
                    <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li>• Refund requests: Within 48 hours (business days)</li>
                      <li>• General inquiries: Within 24 hours (business days)</li>
                      <li>• Urgent issues: Within 12 hours (business days)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Business days are Monday through Friday, excluding holidays. 
                      For faster processing, please include all required information in your initial request.
                    </p>
                  </div>
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

