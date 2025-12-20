import { useLocation } from 'react-router-dom'

const BuyMeACoffee = () => {
    const location = useLocation()

    // Routes where the button should not be visible
    const isHidden =
        location.pathname.startsWith('/admin') ||
        location.pathname.startsWith('/auth')

    if (isHidden) return null

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-fade-in">
            <a
                href="https://www.buymeacoffee.com/aiimageprompts"
                target="_blank"
                rel="noreferrer"
                aria-label="Support us on Buy Me a Coffee"
                className="block transition-transform hover:scale-105 hover:-translate-y-1 duration-300"
            >
                <img
                    src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=🍵&slug=aiimageprompts&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                    alt="Buy me a coffee"
                    width="217"
                    height="60"
                    decoding="async"
                    className="h-12 w-auto drop-shadow-lg"
                    loading="lazy"
                />
            </a>
        </div>
    )
}

export default BuyMeACoffee
