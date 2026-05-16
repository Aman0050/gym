import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, HelpCircle, Search, BookOpen, 
  MessageSquare, ChevronRight, Send, LifeBuoy
} from 'lucide-react';
import { useSupportStore } from '../store/useSupportStore';
import { transitions } from './ui';

const HelpHub = ({ isOpen, onClose }) => {
  const { faqs, fetchFAQs, createTicket, isLoading } = useSupportStore();
  const [activeTab, setActiveTab] = useState('faq');
  const [search, setSearch] = useState('');
  const [ticket, setTicket] = useState({ title: '', issue_type: 'TECHNICAL', priority: 'NORMAL', description: '' });

  useEffect(() => {
    if (isOpen) fetchFAQs();
  }, [isOpen, fetchFAQs]);

  const filteredFAQs = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    const success = await createTicket(ticket);
    if (success) {
      setTicket({ title: '', issue_type: 'TECHNICAL', priority: 'NORMAL', description: '' });
      setActiveTab('faq');
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
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={transitions.normal}
            className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-[#0a0a0a]/95 backdrop-blur-3xl border-l border-white/[0.08] z-[210] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-earth-clay/10 rounded-xl flex items-center justify-center border border-earth-clay/20">
                    <HelpCircle size={20} className="text-earth-clay" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-black text-ivory tracking-tight uppercase">Support Hub</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">Enterprise Assistance</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-ivory transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'faq' ? 'bg-earth-clay text-white shadow-lg shadow-earth-clay/20' : 'text-slate-500 hover:text-ivory hover:bg-white/[0.04]'}`}
                >
                  <BookOpen size={14} />
                  Knowledge Base
                </button>
                <button
                  onClick={() => setActiveTab('ticket')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ticket' ? 'bg-earth-clay text-white shadow-lg shadow-earth-clay/20' : 'text-slate-500 hover:text-ivory hover:bg-white/[0.04]'}`}
                >
                  <MessageSquare size={14} />
                  Submit Ticket
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto premium-scrollbar p-8">
              {activeTab === 'faq' ? (
                <div className="space-y-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-earth-clay transition-colors" size={16} />
                    <input
                      type="text"
                      placeholder="Search for articles, guides..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-field w-full pl-12 !py-4"
                    />
                  </div>

                  <div className="space-y-4">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:border-white/10 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-earth-clay/70">{faq.category}</span>
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-earth-clay transition-all" />
                        </div>
                        <h4 className="text-xs font-black text-ivory uppercase tracking-wider mb-2">{faq.question}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitTicket} className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="p-6 bg-earth-clay/5 border border-earth-clay/10 rounded-2xl mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <LifeBuoy className="text-earth-clay" size={18} />
                      <h4 className="text-[11px] font-black text-ivory uppercase tracking-widest">Open Support Request</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-wider">
                      Our enterprise engineering team typically resolves operational tickets within 4 hours.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label-text mb-2 block">Issue Title</label>
                      <input
                        type="text"
                        required
                        value={ticket.title}
                        onChange={(e) => setTicket({ ...ticket, title: e.target.value })}
                        placeholder="e.g., Attendance sync failing in North branch"
                        className="input-field w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-text mb-2 block">Type</label>
                        <select
                          value={ticket.issue_type}
                          onChange={(e) => setTicket({ ...ticket, issue_type: e.target.value })}
                          className="input-field w-full"
                        >
                          <option value="TECHNICAL">Technical Issue</option>
                          <option value="BILLING">Billing Issue</option>
                          <option value="WORKFLOW">Workflow Help</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="label-text mb-2 block">Priority</label>
                        <select
                          value={ticket.priority}
                          onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
                          className="input-field w-full"
                        >
                          <option value="LOW">Low</option>
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label-text mb-2 block">Description</label>
                      <textarea
                        required
                        value={ticket.description}
                        onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                        className="input-field w-full h-32 resize-none"
                        placeholder="Describe the problem in detail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-earth-clay rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-earth-clay/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
                      Submit Enterprise Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/[0.05] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em]">FitVibe Intelligence v5.0</p>
                <div className="flex gap-4">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Support Systems Online</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpHub;
