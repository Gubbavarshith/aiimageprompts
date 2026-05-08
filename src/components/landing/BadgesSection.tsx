import { motion } from 'framer-motion';

export type BadgeItem = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
  width?: number;
  height?: number;
  imageUrlDark?: string; // Optional dark theme image URL
};

// Badge configuration - easily add more badges here
const badges: BadgeItem[] = [
  {
    id: 'product-hunt',
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/products/ai-image-prompts?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-ai-image-prompts',
    imageUrl: 'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1066574&theme=light&t=1769079402844',
    imageAlt: 'AI Image Prompts - Better Prompts, Better Art | Product Hunt',
    width: 250,
    height: 54
  },
  {
    id: 'good-ai-tools',
    name: 'Good AI Tools',
    url: 'https://goodaitools.com',
    imageUrl: 'https://goodaitools.com/assets/images/badge.png',
    imageUrlDark: 'https://goodaitools.com/assets/images/badge-dark.png',
    imageAlt: 'Good AI Tools',
    height: 54
  },
  {
    id: 'fazier',
    name: 'Fazier',
    url: 'https://fazier.com/launches/www.aiimageprompt.xyz',
    imageUrl: 'https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light',
    imageAlt: 'Fazier badge',
    width: 250
  }
  // Add more badges here as needed
];

const loopedBadges = [...badges, ...badges];

export const BadgesSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <style>
        {`
          @keyframes badges-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}
      </style>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-black dark:text-white mb-4">
            FEATURED ON <span className="text-[#FFDE1A]">PLATFORMS</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Discover where AI Image Prompts has been recognized and featured.
          </p>
        </motion.div>

        {/* Horizontal looping badges (pauses on hover) */}
        <div className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent dark:from-black" />

          <div className="flex w-max items-center gap-5 py-2 animate-[badges-scroll_30s_linear_infinite] group-hover:[animation-play-state:paused]">
            {loopedBadges.map((badge, index) => (
              <a
                key={`${badge.id}-${index}`}
                href={badge.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/badge relative inline-block shrink-0 transition-transform duration-300 hover:-translate-y-1"
                aria-label={`Visit ${badge.name}`}
              >
                <div className="relative rounded-lg border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover/badge:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] dark:group-hover/badge:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                  {/* Light theme image */}
                  <img
                    src={badge.imageUrl}
                    alt={badge.imageAlt}
                    width={badge.width || 210}
                    height={badge.height || 46}
                    className="block dark:hidden"
                    loading="lazy"
                  />
                  {/* Dark theme image (if provided) */}
                  {badge.imageUrlDark ? (
                    <img
                      src={badge.imageUrlDark}
                      alt={badge.imageAlt}
                      width={badge.width || 210}
                      height={badge.height || 46}
                      className="hidden dark:block"
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src={badge.imageUrl}
                      alt={badge.imageAlt}
                      width={badge.width || 210}
                      height={badge.height || 46}
                      className="hidden dark:block"
                      loading="lazy"
                    />
                  )}
                </div>
              </a>
            ))}

            {[0, 1].map((item) => (
              <a
                key={`tiny-startups-${item}`}
                href="https://www.tinystartups.com/startup/aiimageprompts"
                target="_blank"
                rel="noopener noreferrer"
                className="group/badge relative inline-block shrink-0 transition-transform duration-300 hover:-translate-y-1"
                aria-label="Visit Tiny Startups"
              >
                <div className="relative rounded-lg border-2 border-transparent bg-white p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover/badge:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:bg-zinc-900 dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] dark:group-hover/badge:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px 10px 12px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontFamily: "'Atkinson Hyperlegible', sans-serif",
                      background:
                        'linear-gradient(#fff,#fff) padding-box,linear-gradient(90deg,#3525E6,#D81FE0,#22B8F0) border-box',
                      border: '2px solid transparent',
                      color: '#0E0B1F'
                    }}
                  >
                    <svg width="42" height="42" viewBox="0 0 100 100" aria-hidden="true">
                      <defs>
                        <linearGradient id={`tsg-${item}`} x1=".1" y1="0" x2=".9" y2="1">
                          <stop offset="0%" stopColor="#3525E6" />
                          <stop offset="55%" stopColor="#D81FE0" />
                          <stop offset="100%" stopColor="#22B8F0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M50 6C52 32 68 48 94 50C68 52 52 68 50 94C48 68 32 52 6 50C32 48 48 32 50 6Z"
                        fill={`url(#tsg-${item})`}
                      />
                    </svg>
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.12 }}>
                      <span
                        style={{
                          fontFamily: 'IBM Plex Mono, monospace',
                          fontSize: '8px',
                          fontWeight: 600,
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: '#6A6585'
                        }}
                      >
                        Launched on
                      </span>
                      <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        Tiny Startups
                      </span>
                      <span style={{ fontSize: '10px', color: '#6A6585', marginTop: '3px' }}>
                        tinystartups.com
                      </span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
