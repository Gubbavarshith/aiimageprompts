import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useState, useEffect } from 'react';


interface AITool {
  id: string;
  name: string;
  logo: string;
  affiliateLink: string;
  color: string;
}

const AI_TOOLS: AITool[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: '🤖',
    affiliateLink: 'https://chat.openai.com',
    color: '#10A37F',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '💎',
    affiliateLink: 'https://gemini.google.com',
    color: '#4285F4',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    logo: '🎨',
    affiliateLink: 'https://www.midjourney.com',
    color: '#2D2D2D',
  },
  {
    id: 'dalle',
    name: 'DALL·E',
    logo: '🖼️',
    affiliateLink: 'https://openai.com/dall-e-3',
    color: '#000000',
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    logo: '⚡',
    affiliateLink: 'https://stability.ai',
    color: '#FF6B6B',
  },
  {
    id: 'leonardo',
    name: 'Leonardo',
    logo: '🦁',
    affiliateLink: 'https://leonardo.ai',
    color: '#FF6B35',
  },
  {
    id: 'runway',
    name: 'Runway',
    logo: '🎬',
    affiliateLink: 'https://runwayml.com',
    color: '#FF006E',
  },
  {
    id: 'nanobanana',
    name: 'NanoBanana',
    logo: '🍌',
    affiliateLink: 'https://nanobanana.ai',
    color: '#FFD700',
  },
  {
    id: 'flux',
    name: 'Flux',
    logo: '🌊',
    affiliateLink: 'https://blackforestlabs.ai',
    color: '#6366F1',
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    logo: '💭',
    affiliateLink: 'https://ideogram.ai',
    color: '#8B5CF6',
  },
  {
    id: 'firefly',
    name: 'Firefly',
    logo: '🔥',
    affiliateLink: 'https://firefly.adobe.com',
    color: '#FF0000',
  },
  {
    id: 'civitai',
    name: 'Civitai',
    logo: '🎭',
    affiliateLink: 'https://civitai.com',
    color: '#9333EA',
  },
];



// Predefined safe zones to strictly avoid the center text area 
// We push items to the sides (Left < 25%, Right > 75%) to leave the center largely empty for text.
const MovingLogo = ({ tool, index, direction, total, side }: { tool: AITool, index: number, direction: 'up' | 'down', total: number, side: 'left' | 'right' }) => {
  // Randomize duration and horizontal drift for a less "organized" feel
  const baseDuration = 15;
  const duration = baseDuration + (index % 7); // Cards move at slightly different speeds
  const stagger = duration / total;
  const initialDelay = index * stagger - duration;

  // Random horizontal offset within the side column area
  const xOffset = (index % 3) * 20 - 20; // Varied central offset
  const driftX = side === 'left' ? [xOffset, xOffset + 40, xOffset] : [xOffset, xOffset - 40, xOffset];

  return (
    <motion.div
      className="absolute"
      style={{
        left: side === 'left' ? `${5 + (index % 3) * 5}%` : `${85 + (index % 3) * 5}%`,
        x: '-50%',
      }}
      initial={{ y: direction === 'down' ? '-20vh' : '120vh', opacity: 0.8 }}
      animate={{
        y: direction === 'down' ? ['-20vh', '120vh'] : ['120vh', '-20vh'],
        x: driftX,
        rotate: [index % 10 - 5, (index % 10 - 5) * -1, index % 10 - 5],
      }}
      transition={{
        y: {
          duration,
          repeat: Infinity,
          ease: "linear",
          delay: initialDelay,
        },
        x: {
          duration: duration * 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }
      }}
    >
      <motion.a
        href={tool.affiliateLink}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(255,255,255,0.03)] border border-gray-100 dark:border-zinc-800 transition-all pointer-events-auto cursor-pointer group backdrop-blur-sm overflow-hidden"
        whileHover={{
          scale: 1.1,
          zIndex: 50,
          rotate: 0,
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Floating Indicator Icon */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
          <ArrowUpRight size={14} />
        </div>

        <div className="w-10 h-10 mb-1 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 bg-gray-50 dark:bg-zinc-900">
          {tool.logo}
        </div>

        <span className="text-[10px] font-bold text-gray-400 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-wider text-center px-1 truncate w-full transition-colors">
          {tool.name}
        </span>
      </motion.a>
    </motion.div>
  );
};

// More controlled floating logos
const FloatingLogos = () => {
  const [shuffledTools, setShuffledTools] = useState<AITool[]>([]);

  useEffect(() => {
    // Randomize tools on mount
    const shuffled = [...AI_TOOLS].sort(() => Math.random() - 0.5);
    setShuffledTools(shuffled);
  }, []);

  if (shuffledTools.length === 0) return null;

  const leftTools = shuffledTools.slice(0, Math.ceil(shuffledTools.length / 2));
  const rightTools = shuffledTools.slice(Math.ceil(shuffledTools.length / 2));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Left Column - Moving Down */}
      {leftTools.map((tool: AITool, index: number) => (
        <MovingLogo key={tool.id} tool={tool} index={index} direction="down" total={leftTools.length} side="left" />
      ))}

      {/* Right Column - Moving Up */}
      {rightTools.map((tool: AITool, index: number) => (
        <MovingLogo key={tool.id} tool={tool} index={index} direction="up" total={rightTools.length} side="right" />
      ))}
    </div>
  );
};


export const AnimatedAIToolsHero = () => {

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] dark:bg-black pt-20 pb-20">

      {/* Background Dot Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-60 dark:opacity-10" />

      {/* Floating Logos Background */}
      <FloatingLogos />

      {/* Content container - Centered */}
      <div className="relative z-10 container mx-auto px-4 pointer-events-none">
        <div className="max-w-4xl mx-auto text-center">

          {/* Hero Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-gray-200 dark:border-zinc-800 pointer-events-auto"
          >
            <Sparkles size={12} className="text-[#F8BE00] fill-[#F8BE00]" />
            <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
              Powering Next-Gen Creativity
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-black dark:text-white mb-8 leading-[0.9]">
              Explore <br className="md:hidden" />
              <div className="relative inline-block mt-2 sm:mt-0">
                <span className="relative z-10 text-white dark:text-black mix-blend-difference">
                  Image Prompts
                </span>
                <span className="absolute -inset-1 sm:-inset-2 bg-black dark:bg-white transform -skew-x-6 -rotate-1 rounded-lg" />
              </div>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            Discover thousands of curated prompts for
            <span className="mx-2 text-black dark:text-white font-bold decoration-2 underline-offset-4 decoration-wavy">Midjourney, DALL-E 3, Stable Diffusion</span>
            & other leading AI image generation tools.
          </motion.p>

        </div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400">Scroll to Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 border-2 border-gray-400 rounded-full flex justify-center p-1"
        >
          <div className="w-1 h-2 bg-gray-400 rounded-full" />
        </motion.div>
      </motion.div>

      {/* Gradient fade at bottom to blend with content */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAFAFA] dark:from-black to-transparent pointer-events-none" />
    </section>
  );
};
