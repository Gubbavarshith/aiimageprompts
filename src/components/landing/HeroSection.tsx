import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useTheme } from '@/components/use-theme';

// Performance optimization: pause canvas animation when not visible

const DotGridBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);

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
    if (!canvas || !isVisible) return;
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
    const repelStrength = 100; // Force multiplier

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

          // Calculate distance to mouse
          const dx = mouseX - originX;
          const dy = mouseY - originY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let x = originX;
          let y = originY;

          if (distance < repelRadius) {
            const angle = Math.atan2(dy, dx);
            const force = (repelRadius - distance) / repelRadius;
            const moveDist = force * repelStrength;

            // Repel: move away from mouse
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
  }, [theme, isVisible]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none opacity-40"
      />
    </div>
  );
};

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/explore?category=${encodeURIComponent(category)}`);
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-black pt-20 transition-colors duration-300">
      <DotGridBackground />

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase tracking-normal mb-8 max-w-5xl text-black dark:text-white leading-[0.9]"
        >
          BETTER PROMPTS <br />BETTER ART
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl"
        >
          Master the art of AI generation. Thousands of pro-level prompts ready for your next masterpiece.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-2xl relative"
        >
          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for 'cyberpunk city' or 'watercolor cat'..."
              className="w-full h-16 pl-6 pr-16 rounded-full border border-black dark:border-white text-lg focus:outline-none focus:ring-2 focus:ring-[#F8BE00] transition-all bg-white dark:bg-black dark:text-white shadow-sm group-hover:shadow-md dark:shadow-white/10"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 h-12 w-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:bg-[#F8BE00] dark:hover:bg-[#F8BE00] hover:text-black dark:hover:text-black transition-colors"
            >
              <Search size={24} />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {["Portraits", "Anime", "Logos", "UI/UX", "Cinematic"].map((tag, i) => (
              <button
                key={i}
                onClick={() => handleCategoryClick(tag)}
                className="px-3 py-1 border border-gray-200 dark:border-gray-800 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white cursor-pointer transition-colors bg-white dark:bg-black"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

