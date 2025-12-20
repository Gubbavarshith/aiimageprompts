import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTheme } from '@/components/use-theme';

// Inline critical text for LCP
const HERO_TEXT = {
  titleLine1: 'Better Prompts',
  titleLine2: 'Better Art',
  subtitle: 'Master the art of AI generation. Thousands of pro-level prompts ready for your next masterpiece.',
  searchPlaceholder: "Search for 'cyberpunk city' or 'watercolor cat'...",
  tags: {
    portraits: 'Portraits',
    anime: 'Anime',
    logos: 'Logos',
    uiux: 'UI/UX',
    cinematic: 'Cinematic',
  },
};

// Performance optimization: defer canvas animation until after LCP
const DotGridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Defer canvas rendering until after LCP (100ms delay)
  useEffect(() => {
    const hasIdleCallback = 'requestIdleCallback' in window;
    const timer = hasIdleCallback ? 
      window.requestIdleCallback(() => setIsReady(true), { timeout: 200 }) :
      window.setTimeout(() => setIsReady(true), 100);
    
    return () => {
      if (hasIdleCallback) {
        window.cancelIdleCallback(timer as number);
      } else {
        window.clearTimeout(timer as number);
      }
    };
  }, []);

  // Use Intersection Observer to pause animation when not visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isVisible || !isReady) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let isAnimating = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const baseDotSize = 1.5;
    const gridSpacing = 40;
    const repelRadius = 150;
    const repelStrength = 100;

    const draw = () => {
      if (!isAnimating) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = theme === 'dark' ? '#ffffffff' : '#000000';

      const rows = Math.ceil(canvas.height / gridSpacing);
      const cols = Math.ceil(canvas.width / gridSpacing);

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const originX = j * gridSpacing + (gridSpacing / 2);
          const originY = i * gridSpacing + (gridSpacing / 2);

          const dx = mouseX - originX;
          const dy = mouseY - originY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let x = originX;
          let y = originY;

          if (distance < repelRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (repelRadius - distance) / repelRadius;
            const moveDist = force * repelStrength;

            x = originX - Math.cos(angle) * moveDist;
            y = originY - Math.sin(angle) * moveDist;
          }

          ctx.beginPath();
          ctx.arc(x, y, baseDotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isAnimating = false;
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isVisible, isReady]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ willChange: isReady ? 'contents' : 'auto' }}
      />
    </div>
  );
};

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const heroTags = [
    { slug: 'Portraits', label: HERO_TEXT.tags.portraits },
    { slug: 'Anime', label: HERO_TEXT.tags.anime },
    { slug: 'Logos', label: HERO_TEXT.tags.logos },
    { slug: 'UI/UX', label: HERO_TEXT.tags.uiux },
    { slug: 'Cinematic', label: HERO_TEXT.tags.cinematic },
  ] as const;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/explore?category=${encodeURIComponent(categorySlug)}`);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-black pt-20 transition-colors duration-300">
      <DotGridBackground />

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        {/* LCP ELEMENT - No animation, renders immediately for fast LCP */}
        <h1
          style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
          className="hero-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal mb-8 max-w-5xl text-black dark:text-white leading-[0.9]"
        >
          {HERO_TEXT.titleLine1} <br />{HERO_TEXT.titleLine2}
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl animate-hero-fade-in animation-delay-100">
          {HERO_TEXT.subtitle}
        </p>

        <div className="w-full max-w-2xl relative animate-hero-fade-in animation-delay-200">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={HERO_TEXT.searchPlaceholder}
              className="w-full h-16 pl-6 pr-16 rounded-full border border-black dark:border-white text-lg focus:outline-none focus:ring-2 focus:ring-[#F8BE00] transition-all bg-white dark:bg-black dark:text-white shadow-sm group-hover:shadow-md dark:shadow-white/10"
            />
            <button
              type="submit"
              aria-label="Search prompts"
              className="absolute right-2 top-2 h-12 w-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:bg-[#F8BE00] dark:hover:bg-[#F8BE00] hover:text-black dark:hover:text-black transition-colors"
            >
              <Search size={24} />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {heroTags.map((tag) => (
              <button
                key={tag.slug}
                onClick={() => handleCategoryClick(tag.slug)}
                aria-label={`Filter by ${tag.label} category`}
                className="px-3 py-1 border border-gray-200 dark:border-gray-800 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white cursor-pointer transition-colors bg-white dark:bg-black"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

