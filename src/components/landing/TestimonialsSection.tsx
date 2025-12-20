
import { motion } from 'framer-motion';

const testimonialsBase = [
  {
    id: 1,
    author: 'Sarah J.',
    quote:
      'Every prompt here feels intentional. It’s like having an art director whispering ideas into Midjourney.',
    role: 'Visual designer exploring AI workflows',
  },
  {
    id: 2,
    author: 'Mike T.',
    quote:
      'These prompts helped me break out of generic “AI look” renders and find a more cinematic, moody style.',
    role: 'Freelance 3D artist',
  },
  {
    id: 3,
    author: 'Elena R.',
    quote:
      'I save so much time now. Instead of wrestling with wording, I just tweak one of these prompts and focus on direction.',
    role: 'Creative director & storyteller',
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-white dark:bg-black border-t border-black dark:border-white transition-colors duration-300">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-black dark:text-white">
          Artists actually using these prompts.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsBase.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, rotateX: 10, y: 30 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-black border border-black dark:border-white p-8 relative shadow-sm hover:shadow-md transition-all"
            >
                <div className="text-6xl text-[#F8BE00] font-serif absolute top-4 left-4 opacity-30">"</div>
              <p className="text-xl font-medium relative z-10 mb-6 text-black dark:text-white">
                  {item.quote}
              </p>
              <div>
                <div className="font-bold text-black dark:text-white">{item.author}</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {item.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

