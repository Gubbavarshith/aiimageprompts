
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Github, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeEmail } from '@/lib/services/emailSubscriptions';
import { getUserLocation, getUserLocationBackup } from '@/lib/utils/location';
import { useToast } from '@/contexts/ToastContext';

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    
    // Try to get user location (non-blocking - will continue even if it fails)
    let locationData;
    try {
      locationData = await getUserLocation();
      // If primary service fails, try backup
      if (!locationData.ip_address) {
        locationData = await getUserLocationBackup();
      }
    } catch (err) {
      // Location is optional, continue without it
      console.warn('Could not fetch location:', err);
    }

    const result = await subscribeEmail(email.trim(), locationData);
    setIsSubmitting(false);

    if (result.success) {
      success('Successfully subscribed! Check your inbox for updates.');
      setEmail('');
    } else {
      error(result.error || 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFDE1A] flex items-center justify-center">
                <span className="font-bold text-black text-xl">A</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Aiimageprompts</span>
            </Link>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-xs">
              The ultimate library for AI image generation prompts. Discover, create, and share the best prompts for Midjourney, DALL-E, and Stable Diffusion.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Explore</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/explore" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Browse Prompts</Link>
              </li>
              <li>
                <Link to="/explore?category=portraits" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Portraits</Link>
              </li>
              <li>
                <Link to="/explore?category=landscapes" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Landscapes</Link>
              </li>
              <li>
                <Link to="/explore?category=anime" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Anime Style</Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Contact</Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/guidelines" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">Guidelines</Link>
              </li>
              <li>
                <Link to="/faq" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-lg mb-6">Stay Updated</h4>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              Get the latest prompts and AI art news delivered to your inbox.
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-[#FFDE1A]"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            © {new Date().getFullYear()} Aiimageprompts.xyz. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Terms</Link>
            <Link to="/sitemap" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

