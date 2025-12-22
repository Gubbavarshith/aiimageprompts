import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * ProfilePage - Redirects to home since Clerk handles profile management via UserButton
 * This page is kept for backwards compatibility but immediately redirects
 */
export default function ProfilePage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Profile – AI Image Prompts'
    // Redirect to home - profile management is handled by Clerk's UserButton
    navigate('/', { replace: true })
  }, [navigate])

  return null
}
