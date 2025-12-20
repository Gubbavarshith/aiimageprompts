import { useEffect, lazy, Suspense } from 'react';
import { HeroSection } from '../components/landing/HeroSection';

// Lazy load non-critical components (below the fold)
const FloatingNavbar = lazy(() => import('../components/landing/FloatingNavbar').then(m => ({ default: m.FloatingNavbar })));
const FeaturedPrompts = lazy(() => import('../components/landing/FeaturedPrompts').then(m => ({ default: m.FeaturedPrompts })));
const TestimonialsSection = lazy(() => import('../components/landing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const CTASection = lazy(() => import('../components/landing/CTASection').then(m => ({ default: m.CTASection })));
const Footer = lazy(() => import('../components/landing/Footer').then(m => ({ default: m.Footer })));

// Minimal placeholder for below-fold content
const BelowFoldPlaceholder = () => (
  <div className="min-h-[200px]" />
);

const LandingPage = () => {
  useEffect(() => {
    // Set document title - static for fast LCP
    document.title = 'AI Image Prompts - Free AI Prompt Library';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-[#F8BE00] selection:text-black transition-colors duration-300">
      {/* Navbar loads async but doesn't block LCP */}
      <Suspense fallback={null}>
        <FloatingNavbar />
      </Suspense>
      
      {/* Hero Section - critical for LCP, loads immediately */}
      <HeroSection />
      
      {/* Below-the-fold content - lazy loaded */}
      <Suspense fallback={<BelowFoldPlaceholder />}>
        <FeaturedPrompts />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;

