import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react';
import { useTheme } from '@/components/use-theme';
import { cn } from '@/lib/utils';

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
    ];

    // Only show Submit and Saved for signed-in users
    if (isLoaded && isSignedIn) {
      baseItems.push(
        { to: '/submit', label: 'Submit' },
        { to: '/saved', label: 'Saved' }
      );
    }

    baseItems.push({ to: '/contact', label: 'Contact' });
    
    return baseItems;
  }, [isSignedIn, isLoaded]);

  // Responsive dimensions
  const expandedWidth = 850;
  const collapsedWidth = 60;

  // Calculate dynamic width and height
  const currentWidth = isOpen
    ? (isMobile ? "calc(100vw - 32px)" : expandedWidth)
    : collapsedWidth;

  const currentHeight = showMobileMenu ? "auto" : 60;
  const currentRadius = showMobileMenu ? 24 : (isOpen ? 32 : 30);

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center items-start pointer-events-none">
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
          "pointer-events-auto relative flex flex-col items-center overflow-hidden", // Added flex-col and overflow-hidden
          "bg-white/85 dark:bg-black/85 backdrop-blur-xl",
          "border border-black/8 dark:border-white/10",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Ambient glow - synced with container */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          animate={{
            opacity: isOpen ? 0.06 : 0,
            scale: isOpen ? 1 : 0.9,
          }}
          transition={gentleSpring}
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(248,190,0,0.25) 0%, transparent 70%)',
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
              className="w-full flex flex-col" // Changed to flex-col to support mobile drop
            >
              {/* Top Bar Section */}
              <div className="w-full h-[60px] flex items-center justify-between px-5">
                {/* LEFT: Favicon + Logo */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2.5 flex-shrink-0"
                >
                  {/* Favicon */}
                  <svg width="30" height="30" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <rect width="64" height="64" rx="32" fill="#FFDE1A" />
                    <path d="M32 12L36.5 27.5L52 32L36.5 36.5L32 52L27.5 36.5L12 32L27.5 27.5L32 12Z" fill="white" />
                    <path d="M32 12L36.5 27.5L52 32L36.5 36.5L32 52L27.5 36.5L12 32L27.5 27.5L32 12Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                  </svg>

                  {/* Logo text */}
                  <Link
                    to="/"
                    style={{ fontFamily: "'Kaushan Script', cursive" }}
                    className="text-2xl tracking-normal text-black dark:text-white hidden sm:block pt-1"
                    aria-label="Go to homepage"
                  >
                    AI Image Prompts
                  </Link>
                </motion.div>

                {/* CENTER: Navigation Links */}
                <motion.nav
                  variants={itemVariants}
                  className="hidden md:flex items-center gap-5"
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
                        className="text-sm font-medium text-black/65 dark:text-white/65 hover:text-black dark:hover:text-white transition-colors duration-200 whitespace-nowrap"
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
                  <motion.button
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    className="w-9 h-9 rounded-full border border-black/8 dark:border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={snappySpring}
                  >
                    {/* Hover background */}
                    <motion.div
                      className="absolute inset-0 bg-[#F8BE00]/12 rounded-full"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={snappySpring}
                    />

                    <AnimatePresence mode="popLayout" initial={false}>
                      {theme === 'dark' ? (
                        <motion.div
                          key="sun"
                          initial={{ rotate: -45, opacity: 0, scale: 0.5 }}
                          animate={{ rotate: 0, opacity: 1, scale: 1 }}
                          exit={{ rotate: 45, opacity: 0, scale: 0.5 }}
                          transition={snappySpring}
                        >
                          <Sun size={16} className="text-white relative z-10" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="moon"
                          initial={{ rotate: 45, opacity: 0, scale: 0.5 }}
                          animate={{ rotate: 0, opacity: 1, scale: 1 }}
                          exit={{ rotate: -45, opacity: 0, scale: 0.5 }}
                          transition={snappySpring}
                        >
                          <Moon size={16} className="text-black relative z-10" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Sign In / Sign Up Button or User Button */}
                  <SignedOut>
                    <Link to="/auth" className="relative group">
                      <motion.button
                        className="relative px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap overflow-hidden
                                 bg-gradient-to-br from-[#F8BE00] via-[#FFD700] to-[#F8BE00]
                                 text-black
                                 shadow-[0_4px_16px_rgba(248,190,0,0.3)] dark:shadow-[0_4px_20px_rgba(248,190,0,0.4)]
                                 border border-[#FFD700]/20"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 6px 24px rgba(248, 190, 0, 0.5)"
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={snappySpring}
                      >
                        {/* Shimmer effect overlay */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          initial={{ x: "-100%", opacity: 0 }}
                          animate={{
                            x: ["100%", "-100%"],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            repeat: Infinity,
                            duration: 3,
                            ease: "linear",
                            repeatDelay: 1
                          }}
                        />

                        {/* Hover glow effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-white"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 0.2 }}
                          transition={snappySpring}
                        />

                        {/* Button text - responsive */}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <span className="hidden sm:inline">Sign In / Sign Up</span>
                          <span className="sm:hidden">Sign In</span>
                        </span>
                      </motion.button>

                      {/* Subtle rotating glow behind button */}
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-[#F8BE00] to-[#FFD700] rounded-full opacity-0 blur-lg -z-10"
                        initial={{ opacity: 0, rotate: 0 }}
                        whileHover={{ opacity: 0.4, rotate: 180 }}
                        transition={{ ...snappySpring, duration: 0.6 }}
                      />
                    </Link>
                  </SignedOut>
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
                            avatarBox: 'w-11 h-11 border-2 border-black/10 dark:border-white/10 flex-shrink-0 rounded-full',
                            userButtonPopoverCard: 'bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-black/10 dark:border-white/10',
                            userButtonPopoverActionButton: 'hover:bg-black/5 dark:hover:bg-white/5',
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
                      className="ml-2 w-9 h-9 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-black dark:text-white"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Menu size={20} />
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
