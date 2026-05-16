import { Fragment } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, Star } from 'lucide-react';

export type BadgeItem = {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
  width?: number;
  height?: number;
  imageUrlDark?: string;
};

const JUST_GOT_FOUND_URL = 'https://justgotfound.com/product?slug=ai-image-prompts';

const badges: BadgeItem[] = [
  {
    id: 'just-got-found',
    name: 'Just Got Found',
    url: JUST_GOT_FOUND_URL,
    imageUrl: '',
    imageAlt: 'AI Image Prompts on Just Got Found'
  },
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
    url: 'https://fazier.com/launches/ai-image-prompts',
    imageUrl: 'https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=8998&badge_type=featured&theme=light',
    imageAlt: 'Fazier badge',
    width: 270
  }
];

const cardOuter =
  'relative rounded-lg border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover/badge:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:border-white dark:bg-zinc-900 dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] dark:group-hover/badge:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]';

const badgeLinkClass =
  'group/badge relative inline-block shrink-0 transition-transform duration-300 hover:-translate-y-1';

function JustGotFoundBadge() {
  return (
    <div className={badgeLinkClass}>
      <div className={cardOuter}>
        {/* Inner strip matches Fazier-style badges: slim row + colored inner border */}
        <div className="flex h-[46px] w-[270px] max-w-[min(270px,calc(100vw-3rem))] items-center gap-2 rounded-md border-2 border-blue-600 bg-white px-2 dark:border-blue-400 dark:bg-zinc-950">
          <a
            href={JUST_GOT_FOUND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left no-underline"
            aria-label="Just Got Found — AI Image Prompts"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFDE1A] ring-2 ring-black/10 dark:ring-white/15">
              <Star className="h-4 w-4 fill-white text-white" aria-hidden strokeWidth={2} />
            </span>
            <span className="truncate font-semibold text-[13px] leading-snug tracking-tight text-zinc-900 dark:text-white">
              Featured on JustGotFound
            </span>
          </a>
          <a
            href={JUST_GOT_FOUND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            aria-label="Vote on Just Got Found"
          >
            <ChevronUp className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
            Vote
          </a>
        </div>
      </div>
    </div>
  );
}



function TinyStartupsBadge() {
  return (
    <div className={badgeLinkClass}>
      <a
        href="https://www.tinystartups.com/startup/aiimageprompts"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 24px 16px 20px',
          borderRadius: '14px',
          textDecoration: 'none',
          fontFamily: "'Inter', system-ui, sans-serif",
          background: 'linear-gradient(135deg, #3525E6, #D81FE0, #22B8F0)',
          color: '#fff'
        }}
      >
        <svg width="56" height="56" viewBox="0 0 100 100">
          <path d="M50 6C52 32 68 48 94 50C68 52 52 68 50 94C48 68 32 52 6 50C32 48 48 32 50 6Z" fill="#ffffff" />
        </svg>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.15' }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.75)'
            }}
          >
            Launched on
          </span>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.025em', color: '#fff' }}>
            Tiny Startups
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>tinystartups.com</span>
        </span>
      </a>
    </div>
  );
}

function ImageBadge({ badge }: { badge: BadgeItem }) {
  return (
    <a
      href={badge.url}
      target="_blank"
      rel="noopener noreferrer"
      className={badgeLinkClass}
      aria-label={`Visit ${badge.name}`}
    >
      <div className={cardOuter}>
        <img
          src={badge.imageUrl}
          alt={badge.imageAlt}
          width={badge.width || 210}
          height={badge.height || 46}
          className="block dark:hidden"
          loading="lazy"
        />
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
  );
}

function MarqueeSegment({ segmentIndex }: { segmentIndex: number }) {
  const suffix = segmentIndex === 0 ? 'a' : 'b';
  return (
    <Fragment>
      {badges.map((badge) =>
        badge.id === 'just-got-found' ? (
          <JustGotFoundBadge key={`${suffix}-${badge.id}`} />
        ) : (
          <ImageBadge key={`${suffix}-${badge.id}`} badge={badge} />
        )
      )}
      <TinyStartupsBadge key={`${suffix}-tiny-startups`} />
    </Fragment>
  );
}

export const BadgesSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <style>
        {`
          @keyframes badges-scroll {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(-50%, 0, 0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .badges-marquee-track {
              animation: none !important;
            }
          }
        `}
      </style>
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-black dark:text-white mb-4">
            FEATURED ON <span className="text-[#FFDE1A]">PLATFORMS</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Discover where AI Image Prompts has been recognized and featured.
          </p>
        </motion.div>

        <div className="group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent dark:from-black" />

          {/*
            Two identical segments → translateX(-50%) loops forever with no visible seam.
            Tiny Startups is inside each segment (previously appended once, which broke the loop).
          */}
          <div className="badges-marquee-track flex w-max items-center gap-5 py-2 will-change-transform animate-[badges-scroll_50s_linear_infinite] group-hover:[animation-play-state:paused]">
            <MarqueeSegment segmentIndex={0} />
            <MarqueeSegment segmentIndex={1} />
          </div>
        </div>
      </div>
    </section>
  );
};
