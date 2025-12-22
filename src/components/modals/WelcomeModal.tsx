import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Rocket, Palette, Zap } from 'lucide-react';

export const WelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcomePopup');
        if (!hasSeenWelcome) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500); // Show after 1.5 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsOpen(false);
        localStorage.setItem('hasSeenWelcomePopup', 'true');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => handleClose()}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border-2 border-black dark:border-white rounded-[2.5rem] shadow-[24px_24px_0px_0px_rgba(248,190,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(248,190,0,0.4)] overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => handleClose()}
                            className="absolute top-6 right-6 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-[#F8BE00] hover:text-black transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 sm:p-12">
                            {/* Icon Header */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-4 bg-gradient-to-tr from-[#F8BE00] to-yellow-200 rounded-full blur-2xl opacity-30"
                                    />
                                    <div className="relative h-20 w-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center shadow-xl">
                                        <Sparkles size={32} className="text-[#F8BE00] fill-[#F8BE00]" />
                                    </div>
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl sm:text-4xl font-display font-black text-black dark:text-white leading-tight">
                                    Welcome to <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-zinc-500">
                                        Aiimageprompts
                                    </span>
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed font-medium">
                                    Your destination for the world's most creative AI image generation prompts. Let's create something extraordinary.
                                </p>
                            </div>

                            {/* Feature Pills */}
                            <div className="grid grid-cols-2 gap-3 mt-10 mb-8">
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                    <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl flex items-center justify-center text-[#F8BE00]">
                                        <Rocket size={16} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider dark:text-gray-300">Fast Setup</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                    <div className="h-8 w-8 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600">
                                        <Palette size={16} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider dark:text-gray-300">Pro Prompts</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => handleClose()}
                                className="w-full py-5 bg-black dark:bg-white text-white dark:text-black font-black text-lg rounded-2xl shadow-[8px_8px_0px_0px_rgba(248,190,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95 group flex items-center justify-center gap-3"
                            >
                                Get Started
                                <Zap size={18} className="transition-transform group-hover:scale-125" />
                            </button>

                            <p className="text-center mt-6 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                Proudly powering 1,000+ creators
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
