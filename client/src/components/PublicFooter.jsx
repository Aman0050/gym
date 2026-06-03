import { Link } from 'react-router-dom';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';
import { Globe, Users, Activity, Target } from 'lucide-react';
import WhatsAppFAB from './WhatsAppFAB';

const PublicFooter = () => {
  return (
    <footer className="bg-obsidian border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-earth-clay/50 to-transparent" />
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-earth-clay/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center mb-6 group">
              <img src={lionIcon} alt="FitXeno Icon" className="h-10 w-10 object-contain scale-[1.30] lion-mask" />
              <img src={logo} alt="FitXeno" className="h-6 object-contain -ml-1" style={{ filter: 'brightness(0.95) contrast(1.05)' }} />
            </Link>
            <p className="body-text !text-[11px] mb-6">
              The enterprise-grade operating system for modern luxury fitness brands.
            </p>
            <div className="flex items-center gap-4 text-white/40">
               {/* Social placeholders if needed */}
               <Globe size={18} className="hover:text-earth-clay cursor-pointer transition-colors" />
               <Users size={18} className="hover:text-earth-clay cursor-pointer transition-colors" />
               <Target size={18} className="hover:text-earth-clay cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Product</h4>
            <ul className="space-y-4">
              <li><a href="/#performance" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Intelligence</a></li>
              <li><a href="/#membership" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Membership</a></li>
              <li><Link to="/login" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Client Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">About FitXeno</Link></li>
              <li><Link to="/contact" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-[12px] text-slate-400 hover:text-earth-clay transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} FitXeno. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black tracking-widest text-emerald-500/80 uppercase">All Systems Operational</span>
          </div>
        </div>
      </div>
      
      {/* Floating WhatsApp Quick Connect */}
      <WhatsAppFAB />
    </footer>
  );
};

export default PublicFooter;
