import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found – Aiimageprompts'
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans flex items-center justify-center transition-colors duration-300">
      <div className="text-center px-4">
        <h1 className="text-[150px] md:text-[200px] font-bold leading-none tracking-tighter text-[#F8BE00]">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 -mt-4">
          This page wandered off.
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The link you followed doesn’t exist (or no longer does). You can head back home and keep exploring prompts.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#F8BE00] text-black font-bold rounded-full hover:bg-black hover:text-[#F8BE00] border border-black transition-colors"
          >
            <Home size={18} />
            Go to homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-black dark:border-white font-bold rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}

