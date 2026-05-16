import React, { useState, useEffect, useRef } from 'react';
import { Search, User, CreditCard, Activity, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const QuickSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        try {
          const res = await api.get(`/search?q=${query}`);
          setResults(res.data.results);
          setShowResults(true);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (result) => {
    setQuery('');
    setShowResults(false);
    switch (result.type) {
      case 'MEMBER':
        navigate(`/members/profile/${result.id}`);
        break;
      case 'PLAN':
        navigate('/plans');
        break;
      case 'PAYMENT':
        navigate('/payments');
        break;
      default:
        break;
    }
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User size={14} />;
      case 'CreditCard': return <CreditCard size={14} />;
      case 'Activity': return <Activity size={14} />;
      default: return <Search size={14} />;
    }
  };

  return (
    <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
      <div className={`
        flex items-center bg-white/[0.04] border px-4 py-2.5 rounded-xl gap-3 group transition-all duration-300
        ${showResults && results.length > 0 ? 'border-earth-clay/40 bg-white/[0.06] rounded-b-none' : 'border-white/[0.07] focus-within:border-earth-clay/30'}
      `}>
        {isSearching ? (
          <Loader2 size={14} className="text-earth-clay animate-spin flex-shrink-0" />
        ) : (
          <Search size={14} className="text-slate-600 group-focus-within:text-earth-clay transition-colors flex-shrink-0" />
        )}
        <input
          type="text"
          placeholder="Search members, plans, payments..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="bg-transparent border-none focus:ring-0 text-xs font-medium w-full placeholder:text-slate-700 text-ivory outline-none"
        />
        <kbd className="text-[9px] text-slate-700 font-mono border border-white/[0.06] rounded px-1.5 py-0.5 hidden lg:block uppercase">⌘K</kbd>
      </div>

      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-[#0d0d0d] border-x border-b border-earth-clay/20 rounded-b-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-2xl"
          >
            <div className="max-h-[350px] overflow-y-auto premium-scrollbar py-2">
              {results.map((result, idx) => (
                <button
                  key={`${result.type}-${result.id}-${idx}`}
                  onClick={() => handleSelect(result)}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/[0.04] group transition-colors text-left border-b border-white/[0.02] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/[0.03] border border-white/[0.05] rounded-lg flex items-center justify-center text-slate-500 group-hover:text-earth-clay group-hover:border-earth-clay/20 transition-all">
                      {getIcon(result.icon)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-ivory tracking-tight group-hover:text-earth-clay transition-colors">
                        {result.title}
                      </p>
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                        {result.subtitle} • {result.type}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-slate-800 opacity-0 group-hover:opacity-100 group-hover:text-earth-clay -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
            
            <div className="p-3 bg-white/[0.02] border-t border-white/[0.05] flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
                {results.length} results found
              </span>
              <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">
                Press Enter to select
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickSearch;
