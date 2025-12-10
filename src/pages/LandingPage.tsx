import { useEffect } from 'react';
import { FloatingNavbar } from '../components/landing/FloatingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturedPrompts } from '../components/landing/FeaturedPrompts';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

const LandingPage = () => {
  useEffect(() => {
    document.title = 'AI Image Prompts - Free AI Prompt Library';
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-[#F8BE00] selection:text-black transition-colors duration-300">
      <FloatingNavbar />
      <HeroSection />
      <FeaturedPrompts />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;

