import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, useScroll, useMotionValueEvent, Easing } from 'framer-motion';

// --- Scroll Direction Hook ---
function useScrollDirection() {
  const { scrollY } = useScroll();
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const diff = latest - lastScrollY.current;
    if (Math.abs(diff) > 5) { // Threshold to avoid jitter
      setDirection(diff > 0 ? 'down' : 'up');
    }
    lastScrollY.current = latest;
  });

  return direction;
}

// --- Card Component ---
interface SEOInfoCardProps {
  title: ReactNode;
  children: ReactNode;
  delay?: number;
}

const customEase: Easing = [0.22, 1, 0.36, 1];

const SEOInfoCard = ({ title, children, delay = 0 }: SEOInfoCardProps) => {
  const direction = useScrollDirection();

  // Animation variants based on scroll direction
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'down' ? 50 : -50 // Enter from bottom if scrolling down, top if scrolling up
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: customEase, // Custom easing
        delay: delay
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-10%" }} // Re-trigger when re-entering
      variants={variants}
      className="group relative flex flex-col rounded-xl bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      {/* Header - mimics PromptCard header style */}
      <div className="p-6 bg-white dark:bg-zinc-900 border-b-2 border-black/5 dark:border-white/10">
        <h3 className="font-display font-bold text-2xl text-black dark:text-white leading-tight">
          {title}
        </h3>
      </div>

      {/* Body - mimics PromptCard body style */}
      <div className="p-6 bg-gray-50 dark:bg-zinc-950 flex-grow">
        <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4 font-normal">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export const SEOContentSection = () => {
  return (
    <section className="relative py-32 bg-zinc-50 dark:bg-black border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300 overflow-hidden">

      {/* Subtle Background Lighting - Updated to #FFDE1A */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFDE1A]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">

        {/* Main Heading & Intro */}
        <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-zinc-900 dark:text-white tracking-tight">
            WHAT ARE <span className="text-[#FFDE1A]">AI IMAGE PROMPTS?</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            AI Image Prompts are carefully crafted text instructions that guide artificial intelligence image generators to produce specific visual outputs. These prompts serve as the bridge between your creative vision and the AI's interpretation.
          </p>
        </div>

        {/* 3-Column Card Layout - Masonry-ish via items-start */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

          {/* Card 1 */}
          <SEOInfoCard
            title={<span>How <span className="text-[#FFDE1A]">Prompts</span> Improve <span className="text-[#FFDE1A]">Image Generation</span></span>}
            delay={0}
          >
            <p>
              The difference between generic and exceptional AI-generated images lies in prompt engineering. Professional AI Image Prompts incorporate proven techniques that dramatically enhance output quality.
            </p>
            <p>
              High-quality AI Image Prompts reduce the trial-and-error cycle by providing clear, actionable instructions. They help you achieve consistent results, maintain brand identity, and explore creative directions with confidence.
            </p>
          </SEOInfoCard>

          {/* Card 2 */}
          <SEOInfoCard
            title={<span>Who Is This <span className="text-[#FFDE1A]">Library For?</span></span>}
            delay={0.1}
          >
            <p>
              This AI Image Prompts library serves creators across industries and skill levels. Visual designers use our prompts to rapidly prototype concepts and explore visual directions.
            </p>
            <p>
              Marketing teams leverage them for campaign imagery. Independent artists and freelancers rely on our collection to expand their creative capabilities without extensive prompt engineering knowledge.
            </p>
          </SEOInfoCard>

          {/* Card 3 */}
          <SEOInfoCard
            title={<span>Our <span className="text-[#FFDE1A]">Mission</span></span>}
            delay={0.2}
          >
            <p>
              Our mission is to democratize access to high-quality AI Image Prompts, making professional-grade prompt engineering available to everyone.
            </p>
            <p>
              Whether you're a seasoned AI artist looking for inspiration or a newcomer exploring AI image generation, our free library provides the foundation you need designed to work across major AI image generation platforms.
            </p>
          </SEOInfoCard>

        </div>
      </div>
    </section>
  );
};

