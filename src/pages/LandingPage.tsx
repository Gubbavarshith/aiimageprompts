import { useEffect, lazy, Suspense } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { getPublicSiteOrigin } from '@/config/site';
import { updateMetaTags, upsertJsonLd, removeJsonLd } from '@/lib/seo';

// Lazy load non-critical components (below the fold)
const FloatingNavbar = lazy(() => import('../components/landing/FloatingNavbar').then(m => ({ default: m.FloatingNavbar })));
const FeaturedPrompts = lazy(() => import('../components/landing/FeaturedPrompts').then(m => ({ default: m.FeaturedPrompts })));
const SEOContentSection = lazy(() => import('../components/landing/SEOContentSection').then(m => ({ default: m.SEOContentSection })));
const SubmitPromptSection = lazy(() => import('../components/landing/SubmitPromptSection').then(m => ({ default: m.SubmitPromptSection })));
const TestimonialsSection = lazy(() => import('../components/landing/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const BadgesSection = lazy(() => import('../components/landing/BadgesSection').then(m => ({ default: m.BadgesSection })));

const Footer = lazy(() => import('../components/landing/Footer').then(m => ({ default: m.Footer })));

// Minimal placeholder for below-fold content
const BelowFoldPlaceholder = () => (
  <div className="min-h-[200px]" />
);

const LandingPage = () => {
  useEffect(() => {
    const title = 'AI Image Prompts Library | Better Prompts, Better Art';
    const description = 'Explore AI image prompts, AI photo prompts, and prompt ideas for Midjourney, DALL-E, and Stable Diffusion. Browse free prompts for better generated art.';

    updateMetaTags({
      title,
      description,
      canonical: '/',
      og: {
        title,
        description,
        url: '/',
        image: '/og-image.png',
        type: 'website',
        siteName: 'AI Image Prompts',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: '/og-image.png',
      },
    });

    const origin = getPublicSiteOrigin();
    const webSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AI Image Prompts',
      url: origin,
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/explore?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    const orgJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'AI Image Prompts',
      url: origin,
      logo: `${origin}/favicon.svg`,
    };

    upsertJsonLd('website-jsonld', webSiteJsonLd);
    upsertJsonLd('organization-jsonld', orgJsonLd);

    return () => {
      removeJsonLd('website-jsonld');
      removeJsonLd('organization-jsonld');
    };
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
        <SEOContentSection />
        <SubmitPromptSection />
        <TestimonialsSection />
        <BadgesSection />

        <Footer />
      </Suspense>
    </div>
  );
};

export default LandingPage;

