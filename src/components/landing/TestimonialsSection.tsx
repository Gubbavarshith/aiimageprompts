
import { motion } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    quote: "This library completely changed my workflow. The quality of prompts is unmatched.",
    author: "Sarah J.",
    role: "Digital Artist"
  },
  {
    id: 2,
    quote: "Finally, a place where I can find consistent styles for my client projects.",
    author: "Mike T.",
    role: "UX Designer"
  },
  {
    id: 3,
    quote: "The copy-paste functionality is a lifesaver. No more guessing keywords.",
    author: "Elena R.",
    role: "Content Creator"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black border-t border-black dark:border-white transition-colors duration-300">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-black dark:text-white">Community Love</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, rotateX: 10, y: 30 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-black border border-black dark:border-white p-8 relative shadow-sm hover:shadow-md transition-all"
            >
              <div className="text-6xl text-[#F8BE00] font-serif absolute top-4 left-4 opacity-30">"</div>
              <p className="text-xl font-medium relative z-10 mb-6 text-black dark:text-white">{t.quote}</p>
              <div>
                <div className="font-bold text-black dark:text-white">{t.author}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

