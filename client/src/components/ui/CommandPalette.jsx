import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, IndianRupee, Activity, Settings, 
  Plus, Fingerprint, Receipt, ChevronRight, Command
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Static Navigation/Actions
  const staticCommands = [
    { id: 'nav-dash',   title: 'Go to Dashboard',  icon: Activity,    action: () => navigate('/dashboard'), category: 'Navigation' },
    { id: 'nav-members', title: 'Member Directory', icon: Users,       action: () => navigate('/members'), category: 'Navigation' },
    { id: 'nav-pay',     title: 'Payment Ledger',   icon: IndianRupee, action: () => navigate('/payments'), category: 'Navigation' },
    { id: 'act-enroll',  title: 'Enroll New Member', icon: Plus,        action: () => navigate('/members/create'), category: 'Actions' },
    { id: 'act-scan',    title: 'Check-in Station', icon: Fingerprint, action: () => navigate('/attendance'), category: 'Actions' },
    { id: 'act-record',  title: 'Record Payment',   icon: Receipt,     action: () => navigate('/payments', { state: { autoOpen: true } }), category: 'Actions' },
    { id: 'nav-settings', title: 'System Settings', icon: Settings,    action: () => navigate('/settings'), category: 'Navigation' },
  ];

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!query) {
      setResults(staticCommands);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/members?search=${query}&limit=5`);
        const memberResults = (res.data.members || []).map(m => ({
          id: `mem-${m.id}`,
          title: m.name,
          subtitle: `Member • ${m.phone}`,
          icon: Users,
          action: () => navigate(`/members/profile/${m.id}`),
          category: 'Members'
        }));

        const filteredStatic = staticCommands.filter(c => 
          c.title.toLowerCase().includes(query.toLowerCase())
        );

        setResults([...filteredStatic, ...memberResults]);
        setSelectedIndex(0);
      } catch (err) {
        setResults(staticCommands.filter(c => c.title.toLowerCase().includes(query.toLowerCase())));
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const onSelect = (cmd) => {
    cmd.action();
    setIsOpen(false);
    setQuery('');
  };

  const handleNavigation = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) onSelect(results[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl aura-glass-heavy shadow-[0_32px_128px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden pointer-events-auto border border-white/[0.08]"
            >
              {/* Search Bar */}
              <div className="relative border-b border-white/[0.06]">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-earth-clay" size={20} />
                <input
                  autoFocus
                  placeholder="Search members, actions, or pages..."
                  className="w-full bg-transparent py-7 pl-16 pr-24 text-lg text-ivory placeholder:text-slate-500 outline-none font-medium"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleNavigation}
                />
                <div className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 bg-white/[0.05] border border-white/[0.08] px-2 py-1 rounded-md uppercase tracking-widest">ESC</span>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-[50vh] overflow-y-auto premium-scrollbar py-4">
                {results.length > 0 ? (
                  <div className="space-y-1 px-3">
                    {/* Categories Grouping */}
                    {['Navigation', 'Actions', 'Members'].map(category => {
                      const catResults = results.filter(r => r.category === category);
                      if (catResults.length === 0) return null;

                      return (
                        <div key={category} className="mb-4 last:mb-0">
                          <p className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{category}</p>
                          {catResults.map((cmd) => {
                            const globalIndex = results.indexOf(cmd);
                            const isActive = selectedIndex === globalIndex;
                            return (
                              <button
                                key={cmd.id}
                                onClick={() => onSelect(cmd)}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={`
                                  w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all group
                                  ${isActive ? 'bg-earth-clay shadow-lg shadow-earth-clay/20' : 'hover:bg-white/[0.03]'}
                                `}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                  isActive ? 'bg-white/20 border-white/20 text-white' : 'bg-white/[0.05] border-white/[0.08] text-earth-clay'
                                }`}>
                                  <cmd.icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-black tracking-tight ${isActive ? 'text-white' : 'text-ivory'}`}>
                                    {cmd.title}
                                  </p>
                                  {cmd.subtitle && (
                                    <p className={`text-[10px] font-bold ${isActive ? 'text-white/60' : 'text-slate-500'}`}>
                                      {cmd.subtitle}
                                    </p>
                                  )}
                                </div>
                                {isActive && <ChevronRight size={16} className="text-white/60" />}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-3 opacity-30">
                    <Command className="mx-auto" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">No matching commands found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-black/40 px-7 py-4 border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-black text-slate-500">↵</kbd>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-black text-slate-500">↑↓</kbd>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Navigate</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Command size={10} className="text-earth-clay" />
                  <span className="text-[9px] font-black text-earth-clay uppercase tracking-widest">Aura Intelligence Hub</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
