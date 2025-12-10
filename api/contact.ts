import { Resend } from 'resend'

// Serverless function to relay contact form submissions via Resend.
// Expects JSON: { name, email, message, honeypot }
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, message, honeypot } = req.body ?? {}

  // Basic bot trap
  if (honeypot) {
    return res.status(200).json({ ok: true })
  }

  const trimmedName = String(name ?? '').trim()
  const trimmedEmail = String(email ?? '').trim()
  const trimmedMessage = String(message ?? '').trim()

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (
    trimmedName.length > 120 ||
    trimmedEmail.length > 200 ||
    trimmedMessage.length > 5000
  ) {
    return res.status(400).json({ error: 'Payload too large' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM || 'team@aiimageprompts.xyz'
  const to = process.env.CONTACT_TO

  if (!resendApiKey || !to) {
    return res.status(500).json({ error: 'Email service not configured' })
  }

  const resend = new Resend(resendApiKey)

  try {
    await resend.emails.send({
      from,
      to,
      subject: `New contact — ${trimmedName}`,
      reply_to: trimmedEmail,
      text: `From: ${trimmedName} <${trimmedEmail}>\n\n${trimmedMessage}`,
      html: `<p><strong>From:</strong> ${trimmedName} &lt;${trimmedEmail}&gt;</p><p>${trimmedMessage}</p>`
    })

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Contact send error', error)
    return res.status(502).json({ error: 'Failed to send message' })
  }
}

