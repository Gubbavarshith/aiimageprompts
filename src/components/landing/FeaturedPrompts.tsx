import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { fetchFeaturedPrompts, type PromptRecord } from '@/lib/services/prompts';

interface PromptCardProps {
  prompt: PromptRecord;
  index: number;
  onCopy: (prompt: PromptRecord) => void;
  copiedId: string | null;
}

const PromptCard = ({ prompt, index, onCopy, copiedId }: PromptCardProps) => {
  const navigate = useNavigate();
  const isCopied = copiedId === prompt.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1] // Custom ease curve
      }}
      className="group relative flex flex-col h-full"
    >
      {/* Visual Component - The Image */}
      <div className="relative aspect-[4/3] overflow-hidden border-2 border-black dark:border-white rounded-t-xl bg-gray-100 dark:bg-zinc-800 z-10">
        <img
          src={prompt.preview_image_url || 'https://placehold.co/400x400/1a1a1a/F8BE00?text=AI+Prompt'}
          alt={prompt.title}
          loading="lazy"
          width="400"
          height="300"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Category Tag - Absolute positioned */}
        <div className="absolute top-3 left-3">
          <span className="bg-[#F8BE00] border-2 border-black text-black text-xs font-bold px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {prompt.category}
          </span>
        </div>
      </div>

      {/* Info Component - The Details */}
      <div className="flex flex-col flex-grow bg-white dark:bg-black border-2 border-t-0 border-black dark:border-white rounded-b-xl overflow-hidden relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] group-hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-300 group-hover:-translate-y-1">

        {/* Header Section */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
          <h3 className="font-display font-bold text-xl leading-tight text-black dark:text-white mb-1 group-hover:text-[#F8BE00] transition-colors">
            {prompt.title}
          </h3>
        </div>

        {/* Prompt Teaser */}
        <div className="p-4 flex-grow bg-gray-50 dark:bg-zinc-950">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#F8BE00] opacity-50"></div>
            <p className="pl-3 text-sm font-mono text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {prompt.prompt}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="grid grid-cols-[1fr_auto] border-t-2 border-black dark:border-white divide-x-2 divide-black dark:divide-white">
          <button
            onClick={() => onCopy(prompt)}
            aria-label={isCopied ? 'Copied!' : `Copy prompt: ${prompt.title}`}
            className="py-3 px-4 bg-white dark:bg-black text-black dark:text-white hover:bg-[#F8BE00] hover:text-black dark:hover:bg-[#F8BE00] dark:hover:text-black transition-colors flex items-center justify-center gap-2 font-bold uppercase text-sm tracking-widest group/btn"
          >
            {isCopied ? (
              <>
                <Check size={16} className="stroke-[3px]" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/explore')}
            aria-label={`View details for ${prompt.title}`}
            className="w-14 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center justify-center"
          >
            <ExternalLink size={20} className="stroke-[2.5px]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const FeaturedPrompts = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const data = await fetchFeaturedPrompts(10);
        setPrompts(data);
      } catch (err) {
        console.error('Failed to load prompts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, []);

  const handleCopy = async (prompt: PromptRecord) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleViewAll = () => {
    navigate('/explore');
  };

  return (
    <section className="py-32 bg-white dark:bg-black transition-colors duration-300 border-b border-black/5 dark:border-white/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#F8BE00]/5 -skew-x-12 transform origin-top translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-6">
          <div className="relative">
            <span className="absolute -top-6 left-0 text-[#F8BE00] font-mono text-sm font-bold tracking-widest uppercase">
              // Weekly Selection
            </span>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-black dark:text-white tracking-tight">
              Featured <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F8BE00] to-yellow-600">
                Generations
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
              Curated selection of high-fidelity prompts. Copy the code, create the art.
            </p>
          </div>

          <button
            onClick={handleViewAll}
            aria-label="View all prompts"
            className="group hidden md:flex items-center gap-2 text-lg font-bold border-b-2 border-black dark:border-white pb-1 hover:text-[#F8BE00] hover:border-[#F8BE00] transition-all"
          >
            <span>View All Prompts</span>
            <ExternalLink size={18} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-black dark:border-white border-t-[#F8BE00] rounded-full animate-spin" />
          </div>
        ) : prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {prompts.map((prompt, index) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                index={index}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
            <p className="text-xl text-gray-500 dark:text-gray-400 font-mono">No featured prompts available yet.</p>
            <button
              onClick={() => navigate('/admin/prompts')}
              aria-label="Go to admin dashboard to add prompts"
              className="mt-4 text-sm text-[#F8BE00] hover:underline"
            >
              Add some in Admin Dashboard
            </button>
          </div>
        )}

        <div className="mt-16 text-center md:hidden">
          <button
            onClick={handleViewAll}
            aria-label="View all prompts"
            className="inline-flex items-center gap-2 text-lg font-bold border-2 border-black dark:border-white px-6 py-3 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            View All Prompts
          </button>
        </div>
      </div>
    </section>
  );
};
