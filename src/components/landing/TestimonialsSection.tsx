import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    author: 'Sarah Jenkins',
    role: 'Visual Designer',
    quote: "Every prompt here feels intentional. It’s like having an art director whispering ideas into Midjourney.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Sarah'
  },
  {
    id: 2,
    author: 'Mike Thompson',
    role: 'Freelance 3D Artist',
    quote: "These prompts helped me break out of generic “AI look” renders and find a more cinematic, moody style.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Mike'
  },
  {
    id: 3,
    author: 'Elena Rodriguez',
    role: 'Creative Director',
    quote: "I save so much time now. Instead of wrestling with wording, I just tweak one of these prompts and focus on direction.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Elena'
  },
  {
    id: 4,
    author: 'David Chen',
    role: 'Indie Game Dev',
    quote: "The consistency I get for character sheets using these prompts is unreal. A total game-changer for my workflow.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=David'
  },
  {
    id: 5,
    author: 'Jessica Lee',
    role: 'Social Media Manager',
    quote: "Finally, prompts that actually work for marketing assets. No more weird hallucinations, just clean, usable images.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Jessica'
  },
  {
    id: 6,
    author: 'Marcus Johnson',
    role: 'Concept Artist',
    quote: "I use this library as a starting point for all my daily sketches. The 'Cinematic' category is gold.",
    avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Marcus'
  }
];

export const TestimonialsSection = () => {
  // Duplicate lists for seamless loop
  const marqueeList = [...testimonials, ...testimonials];

  return (
    <section className="py-32 bg-zinc-50 dark:bg-black border-t border-black dark:border-white overflow-hidden transition-colors duration-300">

      <div className="container mx-auto px-4 mb-20 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-black dark:text-white mb-6">
          LOVED BY <span className="text-[#FFDE1A]">CREATORS</span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Hear from artists, developers, and content creators who achieve professional results with our prompts.
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden py-12">
        {/* Left Gradient Fade - wider for smoothness */}
        <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-zinc-50 dark:from-black to-transparent z-10 pointer-events-none" />
        {/* Right Gradient Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-zinc-50 dark:from-black to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-8 w-max pl-8"
          animate={{ x: "-50%" }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {marqueeList.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="w-[450px] flex-shrink-0 flex flex-col p-8 rounded-xl bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 hover:-translate-y-1"
            >
              {/* Header: Avatar, Name, Rating */}
              <div className="flex items-start gap-4 mb-6 border-b pb-6 border-black/5 dark:border-white/10">
                <img
                  src={item.avatar}
                  alt={item.author}
                  className="w-14 h-14 rounded-full border-2 border-black bg-gray-100 object-cover"
                />
                <div className="flex-1 min-w-0 text-left pt-1">
                  <h4 className="font-bold text-lg text-black dark:text-white truncate leading-tight">{item.author}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.role}</p>
                </div>
                <div className="flex gap-0.5 text-[#FFDE1A] pt-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={16} fill="#FFDE1A" strokeWidth={0} />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium text-left">
                "{item.quote}"
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
