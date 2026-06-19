import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Send, MessageSquare, Twitter, Github, CircleCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { FloatingNavbar } from '@/components/landing/FloatingNavbar'
import { Footer } from '@/components/landing/Footer'
import { useToast } from '@/contexts/ToastContext'
import { updateMetaTags } from '@/lib/seo'
import { createContactMessage, isValidEmail } from '@/lib/services/contactMessages'
import { isSupabaseReady } from '@/lib/supabaseClient'
import { getUserLocation, type LocationData } from '@/lib/utils/location'

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  { value: '',                        label: 'Select a subject…' },
  { value: 'General Inquiry',         label: '💬  General Inquiry' },
  { value: 'Bug Report',              label: '🐛  Bug Report' },
  { value: 'Feature Request',         label: '✨  Feature Request' },
  { value: 'Prompt Question',         label: '🖼️  Prompt Question' },
  { value: 'Partnership',             label: '🤝  Partnership / Collaboration' },
  { value: 'Other',                   label: '📌  Other' },
]

const MAX_MESSAGE = 2000

// ── Component ─────────────────────────────────────────────────────────────────

type FormState = {
  name:     string
  email:    string
  subject:  string
  message:  string
  honeypot: string   // bot-trap – never shown to users
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '', honeypot: '' }

export default function ContactPage() {
  const [form, setForm]           = useState<FormState>(EMPTY)
  const [touched, setTouched]     = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const toast = useToast()

  // ── Derived validation ─────────────────────────────────────────────────────
  const errors: Partial<Record<keyof FormState, string>> = {}
  if (touched.name    && !form.name.trim())        errors.name    = 'Name is required.'
  if (touched.email) {
    if (!form.email.trim())                         errors.email   = 'Email address is required.'
    else if (!isValidEmail(form.email))             errors.email   =
      'Enter a valid email — e.g. you@gmail.com or you@company.co.in'
  }
  if (touched.subject && !form.subject)             errors.subject = 'Please select a subject.'
  if (touched.message && !form.message.trim())      errors.message = 'Message is required.'

  const hasErrors = Object.keys(errors).length > 0
  const allFilled = !!form.name.trim() && !!form.email.trim() && !!form.subject && !!form.message.trim()

  // ── Real-time email validation ─────────────────────────────────────────────
  // 4 visual states so the user gets instant feedback as they type:
  //   idle       → neutral  (empty, not yet interacted)
  //   incomplete → amber    (has @ but TLD not finished — still typing)
  //   valid      → green    (regex passes — show checkmark immediately)
  //   invalid    → red      (blurred and still wrong, OR clearly malformed)
  type EmailState = 'idle' | 'valid' | 'incomplete' | 'invalid'

  const emailVal     = form.email.trim()
  const emailBlurred = !!touched.email
  const emailHasAt   = emailVal.includes('@')
  const emailIsValid = emailVal.length > 0 && isValidEmail(emailVal)

  const emailState: EmailState = (() => {
    if (!emailVal)                              return 'idle'
    if (emailIsValid)                           return 'valid'
    if (emailHasAt && !emailBlurred)            return 'incomplete'   // still typing after @
    return 'invalid'
  })()

  // Contextual hint — shown only in `invalid` state
  const emailErrorMsg: string | null = (() => {
    if (emailState !== 'invalid') return null
    if (!emailVal)       return 'Email address is required.'
    if (!emailHasAt)     return 'Missing @ — did you mean you@gmail.com?'
    const [local, domain = ''] = emailVal.split('@')
    if (!local)          return 'Enter a username before the @ sign.'
    if (!domain)         return 'Enter a domain after @ (e.g. gmail.com)'
    if (!domain.includes('.')) return 'Add a domain extension — e.g. .com or .co.in'
    const tld = domain.split('.').pop() ?? ''
    if (tld.length < 2)  return 'Domain extension needs at least 2 characters (.com, .in, .io)'
    return 'Enter a valid email — e.g. you@gmail.com or you@company.co.in'
  })()

  const emailBorderClass: Record<EmailState, string> = {
    idle:       'border-neutral-200 dark:border-neutral-800 focus:border-[#FFDE1A] focus:ring-[#FFDE1A]',
    incomplete: 'border-amber-400  dark:border-amber-500  focus:border-amber-400  focus:ring-amber-400',
    valid:      'border-green-500  dark:border-green-500  focus:border-green-500  focus:ring-green-500',
    invalid:    'border-red-500    dark:border-red-500    focus:border-red-500    focus:ring-red-500',
  }

  // ── SEO ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const title       = 'Contact AI Image Prompts | Better Prompts, Better Art'
    const description = 'Get in touch with AI Image Prompts for support, feedback, and collaboration.'
    updateMetaTags({
      title,
      description,
      canonical: '/contact',
      og:      { title, description, url: '/contact', image: '/og-image.png', type: 'website', siteName: 'AI Image Prompts' },
      twitter: { card: 'summary_large_image', title, description, image: '/og-image.png' },
    })
    window.scrollTo(0, 0)
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const blur = (field: keyof FormState) => () =>
    setTouched(prev => ({ ...prev, [field]: true }))

  const focus = (field: string) => () => setFocusedField(field)
  const unfocus = () => setFocusedField(null)

  const fieldClass = (field: keyof FormState, base: string) =>
    `${base} ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-neutral-200 dark:border-neutral-800 focus:border-[#FFDE1A] focus:ring-[#FFDE1A]'}`

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Mark all fields touched so errors show
    setTouched({ name: true, email: true, subject: true, message: true })

    // Client-side gate
    if (!form.name.trim() || !form.subject || !form.message.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      // Honeypot – silent success for bots
      if (form.honeypot) {
        setSubmitted(true)
        setForm(EMPTY)
        return
      }

      if (!isSupabaseReady()) {
        throw new Error('Service is temporarily unavailable. Please email us at team@aiimageprompts.xyz')
      }

      // Fetch geo data non-blocking
      let locationData: LocationData = {}
      try { locationData = await getUserLocation() } catch { /* silent */ }

      const result = await createContactMessage({
        name:       form.name,
        email:      form.email,
        subject:    form.subject,
        message:    form.message,
        user_agent: navigator.userAgent,
        ip_address: locationData.ip_address,
        country:    locationData.country,
        region:     locationData.region,
        city:       locationData.city,
        timezone:   locationData.timezone,
      })

      if (result.success) {
        setSubmitted(true)
        setForm(EMPTY)
        setTouched({})
        toast.success("Message sent! We'll get back to you soon.")
      } else {
        throw new Error(result.error ?? 'Failed to send message.')
      }
    } catch (err) {
      console.error('[ContactPage] submit error:', err)
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Social links ───────────────────────────────────────────────────────────
  const socialLinks = [
    { icon: Twitter,      label: 'Twitter',  href: '#' },
    { icon: Github,       label: 'GitHub',   href: '#' },
    { icon: MessageSquare,label: 'Discord',  href: '#' },
    { icon: Mail,         label: 'Email',    href: 'mailto:team@aiimageprompts.xyz' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-[#FFDE1A] selection:text-black overflow-x-hidden">
      <FloatingNavbar />

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#FFDE1A]/10 dark:bg-[#FFDE1A]/5 rounded-[100%] blur-[120px] opacity-60" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] opacity-40" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
            >
              Let's talk.{' '}
              <span className="text-[#FFDE1A]">We're listening.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto"
            >
              Whether you've hit a bug, want a new feature, or just want to say hi — fill in the form and we'll get back to you.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-[1fr_360px] gap-12 items-start">

            {/* ── Form card ───────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-neutral-900/50 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl dark:shadow-2xl"
            >
              <AnimatePresence mode="popLayout">

                {/* ── Success state ──────────────────────────────────────── */}
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                      <CircleCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Message sent!</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
                      We've received your message and will reply as soon as we can.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm(EMPTY); setTouched({}) }}
                      className="px-6 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Send another message
                    </button>
                  </motion.div>

                ) : (

                  /* ── Form ─────────────────────────────────────────────── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5"
                  >
                    {/* Honeypot – hidden from real users */}
                    <input
                      type="text"
                      name="honeypot"
                      value={form.honeypot}
                      onChange={set('honeypot')}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />

                    {/* Row 1: Name + Email */}
                    <div className="grid sm:grid-cols-2 gap-5">

                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Name <span className="text-[#FFDE1A]">*</span>
                        </label>
                        <div className={`transition-transform duration-200 ${focusedField === 'name' ? 'scale-[1.01]' : ''}`}>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={set('name')}
                            onFocus={focus('name')}
                            onBlur={blur('name')}
                            placeholder="Your full name"
                            className={fieldClass('name',
                              'w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border focus:ring-1 outline-none transition-all text-sm'
                            )}
                          />
                        </div>
                        {errors.name && (
                          <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                            <AlertCircle size={12} /> {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email — real-time validated */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Email <span className="text-[#FFDE1A]">*</span>
                        </label>
                        <div className={`relative transition-transform duration-200 ${focusedField === 'email' ? 'scale-[1.01]' : ''}`}>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => {
                              setForm(prev => ({ ...prev, email: e.target.value }))
                              // Activate real-time validation as soon as @ is typed
                              if (e.target.value.includes('@')) {
                                setTouched(prev => ({ ...prev, email: true }))
                              }
                            }}
                            onFocus={focus('email')}
                            onBlur={() => { blur('email')(); unfocus() }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            aria-invalid={emailState === 'invalid'}
                            aria-describedby="email-feedback"
                            className={`w-full pl-4 pr-10 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border focus:ring-1 outline-none transition-all text-sm ${emailBorderClass[emailState]}`}
                          />
                          {/* Right-side state icon */}
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {emailState === 'valid' && (
                              <CheckCircle2 size={16} className="text-green-500" />
                            )}
                            {emailState === 'invalid' && (
                              <AlertCircle size={16} className="text-red-500" />
                            )}
                            {emailState === 'incomplete' && (
                              <span className="block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            )}
                          </span>
                        </div>

                        {/* Feedback line — height is reserved so layout doesn't jump */}
                        <div id="email-feedback" className="min-h-[18px]">
                          {emailState === 'valid' && (
                            <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle2 size={12} /> Looks good!
                            </p>
                          )}
                          {emailState === 'incomplete' && (
                            <p className="flex items-center gap-1 text-xs text-amber-500">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Keep going — add a domain like .com or .co.in
                            </p>
                          )}
                          {emailState === 'invalid' && emailErrorMsg && (
                            <p role="alert" className="flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle size={12} /> {emailErrorMsg}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Subject <span className="text-[#FFDE1A]">*</span>
                      </label>
                      <div className={`relative transition-transform duration-200 ${focusedField === 'subject' ? 'scale-[1.005]' : ''}`}>
                        <select
                          required
                          value={form.subject}
                          onChange={set('subject')}
                          onFocus={focus('subject')}
                          onBlur={blur('subject')}
                          className={fieldClass('subject',
                            'w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border focus:ring-1 outline-none transition-all appearance-none cursor-pointer text-sm'
                          )}
                        >
                          {SUBJECT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white dark:bg-neutral-900">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 text-xs">▼</span>
                      </div>
                      {errors.subject && (
                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                          <AlertCircle size={12} /> {errors.subject}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          Message <span className="text-[#FFDE1A]">*</span>
                        </label>
                        <span className={`text-xs tabular-nums transition-colors ${
                          form.message.length > MAX_MESSAGE * 0.9
                            ? 'text-amber-500 font-medium'
                            : 'text-neutral-400'
                        }`}>
                          {form.message.length} / {MAX_MESSAGE}
                        </span>
                      </div>
                      <div className={`transition-transform duration-200 ${focusedField === 'message' ? 'scale-[1.005]' : ''}`}>
                        <textarea
                          required
                          rows={6}
                          maxLength={MAX_MESSAGE}
                          value={form.message}
                          onChange={set('message')}
                          onFocus={focus('message')}
                          onBlur={blur('message')}
                          placeholder="Tell us what you're working on, what you need, or what's not working."
                          className={fieldClass('message',
                            'w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-black/40 border focus:ring-1 outline-none transition-all resize-none text-sm'
                          )}
                        />
                      </div>
                      {errors.message && (
                        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                          <AlertCircle size={12} /> {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting || (Object.keys(touched).length > 0 && (hasErrors || !allFilled))}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-4 rounded-xl bg-[#FFDE1A] text-black font-bold text-base shadow-lg shadow-[#FFDE1A]/20 hover:shadow-[#FFDE1A]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>Send message <Send size={18} /></>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-neutral-100 dark:bg-neutral-900/50 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-xl font-bold mb-4">Other ways to connect</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                  Prefer social? Reach out on any of these channels.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map(link => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 hover:border-[#FFDE1A] hover:bg-[#FFDE1A]/5 transition-all group"
                    >
                      <link.icon className="w-6 h-6 mb-2 text-neutral-400 group-hover:text-[#FFDE1A] transition-colors" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-[#FFDE1A] rounded-3xl p-8 text-black relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700" />
                <h3 className="text-xl font-bold mb-2 relative z-10">Need something quick?</h3>
                <p className="opacity-80 mb-4 relative z-10 text-sm">
                  Fill in the form on the left with your question and we'll unblock you fast.
                </p>
                <button
                  onClick={() => {
                    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-black/80 transition-colors relative z-10"
                >
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
