import { motion, type Variants } from 'framer-motion';

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
  }
  // Add more badges here as needed
];

const badgeVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as any
    }
  })
};

export const BadgesSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
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

        {/* Badges Grid */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {badges.map((badge, index) => (
            <motion.a
              key={badge.id}
              href={badge.url}
              target="_blank"
              rel="noopener noreferrer"
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
              variants={badgeVariants}
              className="group relative inline-block transition-transform duration-300 hover:-translate-y-2"
              aria-label={`Visit ${badge.name}`}
            >
              <div className="relative p-4 rounded-lg bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300">
                {/* Light theme image */}
                <img
                  src={badge.imageUrl}
                  alt={badge.imageAlt}
                  width={badge.width || 250}
                  height={badge.height || 54}
                  className="block dark:hidden"
                  loading="lazy"
                />
                {/* Dark theme image (if provided) */}
                {badge.imageUrlDark ? (
                  <img
                    src={badge.imageUrlDark}
                    alt={badge.imageAlt}
                    width={badge.width || 250}
                    height={badge.height || 54}
                    className="hidden dark:block"
                    loading="lazy"
                  />
                ) : (
                  <img
                    src={badge.imageUrl}
                    alt={badge.imageAlt}
                    width={badge.width || 250}
                    height={badge.height || 54}
                    className="hidden dark:block"
                    loading="lazy"
                  />
                )}
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};
