
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
      error('Please enter your email to subscribe.');
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
      success('You’re in! Check your inbox for a confirmation.');
      setEmail('');
    } else {
      error(result.error || 'Something went wrong. Please try again in a moment.');
    }
  };

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-8 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.svg" alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-xl tracking-tight">Aiimageprompts</span>
            </Link>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-xs">
              Curated prompts for image models – crafted to help you create sharper, stranger, and more intentional visuals.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Follow us on Twitter" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Twitter size={18} aria-hidden="true" />
              </a>
              <a href="#" aria-label="Follow us on Instagram" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Instagram size={18} aria-hidden="true" />
              </a>
              <a href="#" aria-label="View our GitHub repository" className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#FFDE1A] hover:text-black transition-all duration-300">
                <Github size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6">Explore</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/explore" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Browse prompts
                </Link>
              </li>
              <li>
                <Link to="/explore?category=portraits" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Portrait prompts
                </Link>
              </li>
              <li>
                <Link to="/explore?category=landscapes" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Landscape prompts
                </Link>
              </li>
              <li>
                <Link to="/explore?category=anime" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Anime-style prompts
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="font-bold text-lg mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Terms of use
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Refund policy
                </Link>
              </li>
              <li>
                <Link to="/guidelines" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  Community guidelines
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-6">Stay in the loop</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
              Fresh prompts, trends, and experiments in your inbox. No spam, just genuinely useful inspiration.
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <Input
                  type="email"
                  placeholder="you@example.com"
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
                {isSubmitting ? 'Subscribing…' : 'Subscribe'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            © {new Date().getFullYear()} Aiimageprompts.xyz. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              Terms
            </Link>
            <Link to="/refund" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              Refund
            </Link>
            <a href="/sitemap.xml" className="text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

