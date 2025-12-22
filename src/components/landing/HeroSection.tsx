import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/use-theme';
import { fetchUniqueCategories } from '@/lib/services/categories';

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
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  // Load top categories (limit to 5 most popular)
  useEffect(() => {
    const loadTopCategories = async () => {
      try {
        const categories = await fetchUniqueCategories();
        // Take top 5 categories
        setTopCategories(categories.slice(0, 5));
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Fallback to default categories
        setTopCategories(['Portraits', 'Anime', 'Logos', 'UI/UX', 'Cinematic']);
      }
    };

    loadTopCategories();
  }, []);

  // Map categories to hero tags format
  const heroTags = topCategories.length > 0
    ? topCategories.map((cat) => ({
        slug: cat,
        label: cat,
      }))
    : [
        { slug: 'Portraits', label: HERO_TEXT.tags.portraits },
        { slug: 'Anime', label: HERO_TEXT.tags.anime },
        { slug: 'Logos', label: HERO_TEXT.tags.logos },
        { slug: 'UI/UX', label: HERO_TEXT.tags.uiux },
        { slug: 'Cinematic', label: HERO_TEXT.tags.cinematic },
      ];

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
        {/* Social Proof Pill */}
        <div className="animate-fade-in mb-8 group relative z-20">
          <div className="flex items-center gap-3 p-1.5 pr-5 bg-gray-50/80 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer">
            <div className="flex -space-x-2.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-black bg-gray-200 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-wave"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <img
                    src={`https://api.dicebear.com/9.x/micah/svg?seed=${i + 15}`}
                    alt={`Community Member ${i}`}
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100">
                <span>Loved by 15,000+ creators</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="relative">
                      {/* Background Empty/Gray Star */}
                      <Star size={12} className="text-gray-300 dark:text-gray-600" />

                      {/* Foreground Filled/Yellow Star - Animates Width */}
                      {/* Specific logic for the 5th star to animate to 90% instead of 100% via inline styles injection for hover state isn't trivial with Tailwind alone, using a nested approach */}
                      {i === 4 && (
                        <style>
                          {`
                            .group:hover .star-fill-4 {
                              width: 90% !important;
                            }
                          `}
                        </style>
                      )}
                      <div
                        className={`absolute top-0 left-0 overflow-hidden h-full transition-all duration-700 ease-out w-0 ${i === 4 ? 'star-fill-4' : 'group-hover:w-full'}`}
                        style={{ transitionDelay: `${i * 100}ms` }}
                      >
                        <Star
                          size={12}
                          className="text-[#FFDE1A] fill-[#FFDE1A]"
                          strokeWidth={0}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Rated 4.9/5</span>
              </div>
            </div>
          </div>
        </div>

        {/* LCP ELEMENT - No animation, renders immediately for fast LCP */}
        <h1
          style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
          className="hero-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal mb-8 max-w-5xl text-black dark:text-white leading-[0.9]"
        >
          {HERO_TEXT.titleLine1} <br />{HERO_TEXT.titleLine2}
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl animate-hero-fade-in animation-delay-100">
          {HERO_TEXT.subtitle}
        </p>

        <div className="flex flex-wrap gap-5 mb-12 animate-hero-fade-in animation-delay-150 justify-center items-center">
          {/* Primary Button - Solid Yellow Brand Color */}
          <button
            onClick={() => navigate('/explore')}
            className="group relative h-12 px-8 rounded-full bg-[#FFDE1A] text-black font-extrabold text-base tracking-wide hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_25px_-5px_#FFDE1A] active:scale-95 active:shadow-none overflow-hidden"
          >
            {/* Diagonal shine effect */}
            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] group-hover:animate-shimmer" />

            <div className="relative flex items-center gap-2">
              <span className="uppercase">Start Exploring</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </div>
          </button>

          {/* Secondary Button - Glassmorphism */}
          <button
            onClick={() => navigate('/submit')}
            className="group relative h-12 px-8 rounded-full bg-transparent hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 font-bold text-sm tracking-wide transition-all duration-300 active:scale-95 hover:scale-105 hover:border-[#FFDE1A] dark:hover:border-[#FFDE1A] hover:shadow-[0_0_20px_-5px_#FFDE1A] backdrop-blur-sm"
          >
            <div className="relative flex items-center gap-2">
              <span className="uppercase">Submit Prompt</span>
              <Sparkles className="w-4 h-4 text-zinc-400 group-hover:text-[#FFDE1A] transition-colors duration-300 group-hover:rotate-12" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        <div className="w-full max-w-2xl relative animate-hero-fade-in animation-delay-200">
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={HERO_TEXT.searchPlaceholder}
              className="w-full h-16 pl-6 pr-16 rounded-full border border-black dark:border-white text-lg focus:outline-none focus:ring-2 focus:ring-[#FFDE1A] transition-all bg-white dark:bg-black dark:text-white shadow-sm group-hover:shadow-md dark:shadow-white/10"
            />
            <button
              type="submit"
              aria-label="Search prompts"
              className="absolute right-2 top-2 h-12 w-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:bg-[#FFDE1A] dark:hover:bg-[#FFDE1A] hover:text-black dark:hover:text-black transition-colors"
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

