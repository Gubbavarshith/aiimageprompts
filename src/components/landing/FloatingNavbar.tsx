import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react';
import { useTheme } from '@/components/use-theme';
import { cn } from '@/lib/utils';
import ThemeSwitch from '@/components/ui/ThemeSwitch';

// ============================================
// UNIFIED SPRING CONFIGURATIONS
// All animations use consistent physics for organic feel
// ============================================

// Primary spring - used for main container morphing
const smoothSpring = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 1,
};

// Snappy spring - used for micro-interactions (buttons, icons)
const snappySpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

// Gentle spring - used for opacity and subtle effects
const gentleSpring = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

// Container animation variants with coordinated stagger
const expandedContentVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      ...gentleSpring,
      staggerChildren: 0.04,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      ...gentleSpring,
      staggerChildren: 0.025,
      staggerDirection: -1,
    },
  },
};

// Individual item variants for staggered reveal
const itemVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: smoothSpring,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: {
      ...smoothSpring,
      stiffness: 350,
    },
  },
};

// Collapsed button variants
const collapsedVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...smoothSpring,
      ...smoothSpring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: {
      ...smoothSpring,
      stiffness: 400,
    },
  },
};

export const FloatingNavbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isSignedIn, isLoaded } = useAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > 50;
    if (scrolled !== isScrolled) {
      setIsScrolled(scrolled);
      if (!scrolled) setIsMobileMenuOpen(false);
    }
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isOpen = !isScrolled || isMobileMenuOpen;

  // Derive if we should show the full menu content (links)
  // On Desktop: Always show if open
  // On Mobile: Only show if manually opened (isMobileMenuOpen)
  const showMobileMenu = isMobile && isMobileMenuOpen;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Dynamic nav items based on authentication status
  const navItems = useMemo(() => {
    const baseItems = [
      { to: '/', label: 'Home' },
      { to: '/explore', label: 'Explore' },
      { to: '/blog', label: 'Blog' },
    ];

    // Only show Submit and Saved for signed-in users
    if (isLoaded && isSignedIn) {
      baseItems.push(
        { to: '/submit', label: 'Submit' },
        { to: '/saved', label: 'Saved' }
      );
    }

    return baseItems;
  }, [isSignedIn, isLoaded]);

  // Responsive dimensions
  const collapsedWidth = 60;

  // Calculate dynamic width and height
  const currentWidth = isOpen
    ? (isMobile ? "calc(100vw - 32px)" : "min(850px, 92vw)")
    : collapsedWidth;

  const currentHeight = showMobileMenu ? "auto" : 60;
  const currentRadius = showMobileMenu ? 24 : (isOpen ? 32 : 30);

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center items-start pointer-events-none">
      <motion.header
        layout
        initial={false}
        animate={{
          width: currentWidth,
          height: currentHeight,
          borderRadius: currentRadius,
        }}
        transition={smoothSpring}
        className={cn(
          "pointer-events-auto relative flex flex-col items-center overflow-visible",
          "bg-white/85 dark:bg-black/85 backdrop-blur-xl",
          "border border-black/8 dark:border-white/10",
          "shadow-[0_8px_32px_rgba(248,190,0,0.06)] dark:shadow-[0_8px_32px_rgba(248,190,0,0.1)]"
        )}
      >
        {/* Ambient glow - synced with container */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          animate={{
            opacity: isOpen ? 0.08 : 0,
            scale: isOpen ? 1 : 0.9,
          }}
          transition={gentleSpring}
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(248,190,0,0.15) 0%, transparent 70%)',
          }}
        />

        <AnimatePresence initial={false}>
          {isOpen ? (
            // ========== EXPANDED STATE ==========
            <motion.div
              key="expanded"
              variants={expandedContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col"
            >
              {/* Top Bar Section */}
              <div className="w-full h-[60px] flex items-center justify-between px-5">
                {/* LEFT: Favicon + Logo */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2.5 flex-shrink-0"
                >
                  {/* Favicon */}
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <rect width="64" height="64" rx="32" fill="#FFDE1A" />
                    <path d="M32 12L36.5 27.5L52 32L36.5 36.5L32 52L27.5 36.5L12 32L27.5 27.5L32 12Z" fill="white" />
                    <path d="M32 12L36.5 27.5L52 32L36.5 36.5L32 52L27.5 36.5L12 32L27.5 27.5L32 12Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                  </svg>

                  {/* Logo text */}
                  <Link
                    to="/"
                    style={{ fontFamily: "'Kaushan Script', cursive" }}
                    className="text-2xl tracking-normal text-black dark:text-white hidden sm:block"
                    aria-label="Go to homepage"
                  >
                    AI Image Prompts
                  </Link>
                </motion.div>

                {/* CENTER: Navigation Links */}
                <motion.nav
                  variants={itemVariants}
                  className="hidden md:flex items-center gap-6"
                  aria-label="Main navigation"
                >
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          ...smoothSpring,
                          delay: 0.12 + index * 0.04,
                        }
                      }}
                    >
                      <Link
                        to={item.to}
                        className="text-sm font-semibold text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors duration-200 whitespace-nowrap"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.nav>

                {/* RIGHT: Action Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-3 flex-shrink-0"
                >
                  {/* Theme Toggle */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-center flex-shrink-0"
                  >
                    <ThemeSwitch 
                      checked={theme === 'dark'} 
                      onChange={toggleTheme}
                    />
                  </motion.div>

                  {/* Sign In / Sign Up Button - visible when signed out (desktop/tablet only) */}
                  <SignedOut>
                    <Link to="/auth" className="relative group hidden md:block">
                      <button
                        className="border duration-300 relative cursor-pointer overflow-hidden
                        h-12 w-40 rounded-full p-2 font-extrabold
                        bg-black hover:bg-white
                        dark:bg-white dark:hover:bg-black
                        border-black/10 dark:border-white/10
                        transition-[background,box-shadow]"
                      >
                        {/* Accent bubbles with brand palette */}
                        <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-16 h-16 rounded-full group-hover:scale-150 duration-700 right-12 top-12 bg-[#FFF3B0]" />
                        <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-12 h-12 rounded-full group-hover:scale-150 duration-700 right-20 -top-6 bg-[#FFDE1A]" />
                        <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-8 h-8 rounded-full group-hover:scale-150 duration-700 right-32 top-6 bg-[#FFC527]" />
                        <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-4 h-4 rounded-full group-hover:scale-150 duration-700 right-2 top-12 bg-[#F29F05]" />

                        <p
                          className="z-10 absolute inset-0 flex items-center pl-4 text-sm font-extrabold
                          text-white group-hover:text-black
                          dark:text-black dark:group-hover:text-white"
                        >
                          Sign in / Sign up
                        </p>
                      </button>
                    </Link>
                  </SignedOut>

                  {/* User avatar (visible for signed-in users only) */}
                  <SignedIn>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={snappySpring}
                      className="flex items-center justify-center flex-shrink-0"
                    >
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox:
                              'w-10 h-10 border-2 border-black/10 dark:border-white/10 flex-shrink-0 rounded-full',
                            userButtonPopoverCard:
                              'bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-black/10 dark:border-white/10',
                            userButtonPopoverActionButton:
                              'hover:bg-black/5 dark:hover:bg-white/5',
                            userButtonTrigger: 'flex items-center justify-center',
                          },
                        }}
                      />
                    </motion.div>
                  </SignedIn>

                  {/* Mobile Menu Toggle (Visible only when links are hidden on mobile) */}
                  {isMobile && !isMobileMenuOpen && (
                    <motion.button
                      key="mobile-menu-trigger"
                      variants={itemVariants}
                      onClick={() => setIsMobileMenuOpen(true)}
                      aria-label="Open mobile navigation menu"
                      className="ml-2 w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-black dark:text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Menu size={22} />
                    </motion.button>
                  )}

                  {/* Close Button - (Visible when mobile menu is open OR scrolled desktop menu is open) */}
                  <AnimatePresence>
                    {(isScrolled || (isMobile && isMobileMenuOpen)) && (
                      <motion.button
                        key="close-button" // Added key
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Close navigation menu"
                        initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                        transition={snappySpring}
                        className="w-9 h-9 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-black dark:text-white flex-shrink-0 ml-1"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                      >
                        <X size={18} strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div> {/* End Top Bar */}

              {/* Mobile Navigation Links (Vertical List) */}
              <AnimatePresence>
                {showMobileMenu && (
                  <motion.nav
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={smoothSpring} // Use spring for height resize
                    className="w-full px-5 pb-6 flex flex-col gap-4 overflow-hidden"
                  >
                    <div className="h-px bg-black/5 dark:bg-white/5 w-full mb-2" />
                    {navItems.map((item, index) => (
                      <motion.div
                        key={`mobile-${item.to}`}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -10, opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-lg font-medium text-black dark:text-white block py-2"
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                    
                    {/* Sign In / Sign Up Button in Mobile Menu */}
                    <SignedOut>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -10, opacity: 0 }}
                        transition={{ delay: navItems.length * 0.05 }}
                        className="pt-2"
                      >
                        <Link
                          to="/auth"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="relative group block"
                        >
                          <button
                            className="border duration-300 relative cursor-pointer overflow-hidden
                            h-12 w-full rounded-full p-2 font-extrabold
                            bg-black hover:bg-white
                            dark:bg-white dark:hover:bg-black
                            border-black/10 dark:border-white/10
                            transition-[background,box-shadow]"
                          >
                            {/* Accent bubbles with brand palette */}
                            <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-16 h-16 rounded-full group-hover:scale-150 duration-700 right-12 top-12 bg-[#FFF3B0]" />
                            <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-12 h-12 rounded-full group-hover:scale-150 duration-700 right-20 -top-6 bg-[#FFDE1A]" />
                            <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-8 h-8 rounded-full group-hover:scale-150 duration-700 right-32 top-6 bg-[#FFC527]" />
                            <div className="absolute group-hover:-top-1 group-hover:-right-2 z-10 w-4 h-4 rounded-full group-hover:scale-150 duration-700 right-2 top-12 bg-[#F29F05]" />

                            <p
                              className="z-10 absolute inset-0 flex items-center pl-4 text-sm font-extrabold
                              text-white group-hover:text-black
                              dark:text-black dark:group-hover:text-white"
                            >
                              Sign in / Sign up
                            </p>
                          </button>
                        </Link>
                      </motion.div>
                    </SignedOut>
                  </motion.nav>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // ========== COLLAPSED STATE - Menu Button ==========
            <motion.button
              key="collapsed"
              variants={collapsedVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="absolute inset-0 flex items-center justify-center text-black dark:text-white rounded-full"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={snappySpring}
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ backgroundColor: "rgba(248, 190, 0, 0)" }}
                whileHover={{ backgroundColor: "rgba(248, 190, 0, 0.1)" }}
                transition={gentleSpring}
              />

              {/* Menu icon with rotation on hover */}
              <motion.div
                className="relative z-10"
                whileHover={{ rotate: 90 }}
                transition={snappySpring}
              >
                <Menu size={22} strokeWidth={2.2} />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
};
