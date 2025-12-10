import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const CTASection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/explore');
  };

  const handleSubmitPrompt = () => {
    navigate('/submit');
  };

  return (
    <section className="py-32 bg-black text-[#F8BE00] overflow-hidden relative border-t border-black dark:border-white">
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter"
        >
          Start Creating Today.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xl md:text-2xl text-white mb-12 max-w-2xl mx-auto"
        >
          Join thousands of creators using our prompts to build the future of digital art.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#F8BE00] text-black text-lg md:text-2xl font-bold py-4 px-8 md:py-6 md:px-12 rounded-full inline-flex items-center gap-4 hover:bg-white transition-colors"
          >
            Explore Prompts <ArrowRight size={24} className="md:w-7 md:h-7" />
          </motion.button>
          <motion.button
            onClick={handleSubmitPrompt}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-transparent border-2 border-[#F8BE00] text-[#F8BE00] text-lg md:text-2xl font-bold py-4 px-8 md:py-6 md:px-12 rounded-full inline-flex items-center gap-4 hover:bg-[#F8BE00] hover:text-black transition-colors"
          >
            Submit Your Prompt <Sparkles size={24} className="md:w-7 md:h-7" />
          </motion.button>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F8BE00] rounded-full blur-[120px]" />
      </div>
    </section>
  );
};

