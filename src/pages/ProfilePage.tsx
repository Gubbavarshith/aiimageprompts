import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateMetaTags } from '@/lib/seo'

/**
 * ProfilePage - Redirects to home since Clerk handles profile management via UserButton
 * This page is kept for backwards compatibility but immediately redirects
 */
export default function ProfilePage() {
  const navigate = useNavigate()

  useEffect(() => {
    updateMetaTags({
      title: 'Profile | AI Image Prompts',
      description: 'User profile page.',
      canonical: '/profile',
      robots: 'noindex, follow',
      og: {
        title: 'Profile | AI Image Prompts',
        description: 'User profile page.',
        url: '/profile',
        image: '/og-image.png',
        type: 'website',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Profile | AI Image Prompts',
        description: 'User profile page.',
        image: '/og-image.png',
      },
    })
    // Redirect to home - profile management is handled by Clerk's UserButton
    navigate('/', { replace: true })
  }, [navigate])

  return null
}
