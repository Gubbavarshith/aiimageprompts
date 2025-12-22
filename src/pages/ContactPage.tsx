import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Send, MessageSquare, Twitter, Github, CircleCheck } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { useToast } from '@/contexts/ToastContext'
import { updateCanonical } from '@/lib/seo'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '', honeypot: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    document.title = 'Contact – AI Image Prompts'
    updateCanonical('/contact')
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Failed to send message')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', message: '', honeypot: '' })
      toast.success('Message sent. We’ll get back to you soon.')
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong while sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const socialLinks = [
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Github, label: 'GitHub', href: '#' },
    { icon: MessageSquare, label: 'Discord', href: '#' },
    { icon: Mail, label: 'Email', href: 'mailto:team@aiimageprompts.xyz' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#F8BE00] selection:text-black overflow-x-hidden">
      <FloatingNavbar />

      {/* Ambient Spotlight Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#F8BE00]/10 dark:bg-[#F8BE00]/5 rounded-[100%] blur-[120px] opacity-60" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] opacity-40" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header Section */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
            >
              Let’s talk about your next image. <br />
              <span className="text-[#F8BE00]">Or your entire visual system.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
            >
              Whether you’re exploring prompts for the first time or building a serious visual workflow, we’d love to hear what you’re making.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-[1fr_380px] gap-12 items-start">

            {/* Left: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl"
            >
              <AnimatePresence mode="popLayout">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                      <CircleCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message sent</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
                      We’ve received your message and will get back to you as soon as we can.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Honeypot field to deter bots */}
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium ml-1 text-neutral-600 dark:text-neutral-400">Name</label>
                        <div className={`relative transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onFocus={() => setFocusedField('name')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 focus:border-[#F8BE00] focus:ring-1 focus:ring-[#F8BE00] outline-none transition-all"
                            placeholder="Your name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium ml-1 text-neutral-600 dark:text-neutral-400">Email</label>
                        <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 focus:border-[#F8BE00] focus:ring-1 focus:ring-[#F8BE00] outline-none transition-all"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1 text-neutral-600 dark:text-neutral-400">Message</label>
                      <div className={`relative transition-all duration-300 ${focusedField === 'message' ? 'scale-[1.02]' : ''}`}>
                        <textarea
                          required
                          rows={6}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          className="w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 focus:border-[#F8BE00] focus:ring-1 focus:ring-[#F8BE00] outline-none transition-all resize-none"
                          placeholder="Tell us what you’re working on, what you need, or what’s not working."
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-4 rounded-xl bg-[#F8BE00] text-black font-bold text-lg shadow-lg shadow-[#F8BE00]/20 hover:shadow-[#F8BE00]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          Send message
                          <Send size={20} />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right: Socials & Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Info Card */}
              <div className="bg-neutral-100 dark:bg-neutral-900/50 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-bold mb-4">Other ways to connect</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                  Prefer social? Reach out on any of these channels and share what you’re building, testing, or imagining.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 hover:border-[#F8BE00] hover:bg-[#F8BE00]/5 transition-all group"
                    >
                      <link.icon className="w-6 h-6 mb-2 text-neutral-400 group-hover:text-[#F8BE00] transition-colors" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ Mini Section */}
              <div className="bg-[#F8BE00] rounded-3xl p-8 text-black relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700" />
                <h3 className="text-xl font-bold mb-2 relative z-10">Need something quick?</h3>
                <p className="opacity-80 mb-4 relative z-10">Ask a short, specific question and we’ll do our best to unblock you fast.</p>
                <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-black/80 transition-colors relative z-10">
                  Open contact form
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
