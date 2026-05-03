import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Zap, ShieldCheck } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { updateMetaTags } from '@/lib/seo'

export default function DonatePage() {
  useEffect(() => {
    const title = 'Support AI Image Prompts | Donate'
    const description = 'Support AI Image Prompts to help keep the free AI image prompt library open and improve creator tools for everyone.'
    updateMetaTags({
      title,
      description,
      canonical: '/donate',
      og: {
        title,
        description,
        url: '/donate',
        image: '/og-image.png',
        type: 'website',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: '/og-image.png',
      },
    })
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#FFDE1A] selection:text-black overflow-x-hidden">
      <FloatingNavbar />

      {/* Ambient Spotlight Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/5 rounded-[100%] blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[150px] opacity-40" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFDE1A]/10 text-[#FFDE1A] text-sm font-bold mb-6 border border-[#FFDE1A]/20">
              <Heart size={14} className="fill-[#FFDE1A]" />
              <span>Community Supported</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Help us keep prompts <br />
              <span className="text-[#FFDE1A]">free and accessible</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Your support keeps AI Image Prompts free for thousands of creators who rely on it every day.
            </p>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-[1.8fr_1fr] gap-12 lg:gap-20 items-start">

            {/* Left: Story Narrative */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8 text-lg md:text-xl leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              <div className="space-y-2">
                <p className="text-2xl font-medium text-black dark:text-white">
                  Sometimes creativity feels effortless.
                </p>
                <p className="text-2xl font-medium text-black dark:text-white opacity-60">
                  And sometimes it feels impossible.
                </p>
              </div>

              <p>
                You sit with an idea in your head for days — maybe weeks — knowing exactly what you want to create, but never quite getting there. The prompt doesn't work. The result feels off. You try again. And again. And again.
              </p>

              <p>
                <span className="font-medium text-black dark:text-white">We've been there.</span> That feeling is the reason this library exists. Not as a product. Not as a business experiment. But as a small attempt to make the creative process feel lighter, clearer, and a little less lonely.
              </p>

              <p>
                This place was built for the in-between moments: Late nights. Half-finished ideas. Sudden sparks of inspiration. For students learning. Artists exploring. Founders dreaming. Creators simply trying.
              </p>

              <div className="bg-gradient-to-br from-[#FFDE1A]/10 to-orange-500/10 dark:from-[#FFDE1A]/5 dark:to-orange-500/5 border-l-4 border-[#FFDE1A] pl-8 py-6 my-10 rounded-r-2xl">
                <p className="font-medium text-black dark:text-white text-xl italic">
                  "From the beginning, we made a simple promise to ourselves — and to you: This will always be free. No locked features. No hidden upgrades. And that won't change."
                </p>
              </div>

              <p>
                But behind something that feels simple on the surface, there's a lot happening quietly in the background — servers running, images loading, prompts being curated, tested, refined, and organized. All of it so that when you arrive here, everything just works.
              </p>

              <p>
                We don't believe creativity should depend on a credit card. And we don't believe support should ever feel like an obligation.
              </p>

              <p>
                If this library has helped you even once — saved you time, sparked an idea, or made creating feel easier — that already means the world to us.
              </p>

              <div className="space-y-4 pt-4">
                <p>
                  And if someday you feel like giving back, even in a small way, that's beautiful. Not because you have to. Not because you owe anything. But because you want to be part of keeping this space open for the next person who needs it.
                </p>
                <p className="italic text-neutral-600 dark:text-neutral-400 font-medium">
                  Whether you support us with a coffee or simply by being here, you're already part of this story. And that's more than enough.
                </p>
              </div>
            </motion.div>

            {/* Right: CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:sticky lg:top-32"
            >
              <div className="bg-white dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl w-full max-w-sm mx-auto group hover:border-[#FFDE1A]/30 transition-colors duration-500">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-[#FFDE1A]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Heart className="w-8 h-8 text-[#FFDE1A] fill-[#FFDE1A]" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Support the project</h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Every contribution helps keep this free for everyone
                  </p>
                </div>

                <a
                  href="https://www.buymeacoffee.com/aiimageprompts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="donate-pay-btn mb-6 mx-auto hover:shadow-lg hover:shadow-[#FFDE1A]/20 transition-all duration-300"
                >
                  <span className="donate-pay-btn-text">Support Us</span>
                  <div className="donate-icon-container" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="donate-icon donate-card-icon">
                      <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="donate-icon donate-payment-icon">
                      <path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="donate-icon donate-dollar-icon">
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="donate-icon donate-wallet-icon donate-default-icon">
                      <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor" />
                    </svg>
                    <svg viewBox="0 0 24 24" className="donate-icon donate-check-icon">
                      <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" fill="currentColor" />
                    </svg>
                  </div>
                </a>

                {/* Trust Signals */}
                <div className="space-y-3 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center justify-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      Secure checkout
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap size={12} className="text-[#FFDE1A]" />
                      Instant impact
                    </span>
                  </div>
                  <p className="text-center">
                    Processed securely by Buy Me a Coffee. We don't store payment info.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
