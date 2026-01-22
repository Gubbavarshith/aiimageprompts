import { Link, useLocation } from 'react-router-dom'

const FAQButton = () => {
  const location = useLocation()

  // Routes where the button should not be visible
  const isHidden =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/auth')

  if (isHidden) return null

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
      <Link
        to="/faq"
        aria-label="Go to FAQ page"
        className="group relative block"
      >
        <button className="faq-button w-[42px] h-[42px] rounded-full border-none flex items-center justify-center cursor-pointer shadow-[0px_8px_8px_rgba(0,0,0,0.151)] relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
            className="h-5 fill-black"
          >
            <path d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
          </svg>
          
          {/* Tooltip */}
          <span className="tooltip">
            FAQ
          </span>
        </button>
      </Link>
    </div>
  )
}

export default FAQButton
