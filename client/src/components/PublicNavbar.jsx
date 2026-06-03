import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';
import { Button } from './ui';

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => {
        if (e.key === 'Escape') setIsMenuOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Intelligence', href: '/#performance' },
    { name: 'Membership', href: '/#membership' },
    { name: 'About FitXeno', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleNavClick = (e, href) => {
    // If it's a hash link on the home page, and we are currently on home, scroll smoothly
    if (href.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const elem = document.getElementById(targetId);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        scrolled ? 'py-3 sm:py-4' : 'py-5 sm:py-8'
      }`}>
        <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
          scrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/5 opacity-100' : 'opacity-0'
        }`} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link to="/" className="flex items-center mr-6 group">
              <img src={lionIcon} alt="FitXeno Icon" className="h-16 sm:h-20 w-16 sm:w-20 object-contain scale-[1.30] group-hover:scale-[1.35] transition-transform lion-mask" />
              <img src={logo} alt="FitXeno" className="h-10 sm:h-12 object-contain -ml-2 sm:-ml-3" style={{ filter: 'brightness(0.95) contrast(1.05)' }} />
            </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleNavClick(e, link.href)}
                className="label-text !text-white/50 hover:!text-earth-clay transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop Action */}
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="primary" className="!py-2 sm:!py-3 !px-5 sm:!px-8 !text-[9px] shadow-xl">
                Get Started
              </Button>
            </Link>
            <div className="lg:hidden">
              <button 
                type="button"
                onClick={() => setIsMenuOpen(true)} 
                className="touch-target text-white relative z-[110] cursor-pointer"
                aria-label="Toggle Menu"
              >
                <Menu size={24} className="pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <div className="fixed inset-0 z-[9999] lg:hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                aria-hidden="true"
              />

              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute top-0 left-0 h-full w-[85%] max-w-[340px] bg-zinc-950 border-r border-white/10 shadow-2xl flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile Navigation"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                  <span className="text-white font-heading font-bold text-xl tracking-wide">FITXENO</span>
                  <button 
                    type="button"
                    onClick={() => setIsMenuOpen(false)} 
                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors cursor-pointer"
                    aria-label="Close Menu"
                  >
                    <X size={24} className="pointer-events-none" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {navLinks.map((link) => (
                    <a 
                      key={link.name} 
                      href={link.href} 
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="block text-3xl font-serif font-black text-white"
                    >
                      {link.name}
                    </a>
                  ))}
                  <div className="pt-8 border-t border-white/10 flex flex-col gap-4">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                      <Button variant="secondary" className="w-full py-5">Client Portal</Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default PublicNavbar;
