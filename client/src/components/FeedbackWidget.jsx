import React, { useState } from 'react';
import { MessageSquare, Send, X, Smile, Frown, Meh, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Modal, Card } from './ui';
import { submitFeedback } from '../services/analytics';
import toast from 'react-hot-toast';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    category: 'FEATURE',
    rating: 5,
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitFeedback({
        feedback: feedback.message,
        category: feedback.category,
        rating: feedback.rating
      });
      toast.success('System Intelligence Captured. Thank you.');
      setIsOpen(false);
      setFeedback({ category: 'FEATURE', rating: 5, message: '' });
    } catch (err) {
      toast.error('Feedback uplink failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-cyber-cyan text-obsidian rounded-2xl flex items-center justify-center shadow-[0_10px_30px_rgba(6,182,212,0.4)] z-[60] border-2 border-white/20"
      >
        <MessageSquare size={24} />
      </motion.button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Product Intelligence" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">How is your experience?</label>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFeedback({ ...feedback, rating: num })}
                  className={`flex-1 py-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    feedback.rating === num 
                    ? 'bg-cyber-cyan/10 border-cyber-cyan text-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  <Star size={18} fill={feedback.rating >= num ? 'currentColor' : 'none'} />
                  <span className="text-[10px] font-black">{num}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Feedback Category</label>
            <div className="grid grid-cols-2 gap-2">
              {['FEATURE', 'BUG', 'UX', 'SPEED'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFeedback({ ...feedback, category: cat })}
                  className={`py-2 rounded-lg text-[10px] font-black border transition-all ${
                    feedback.category === cat ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Report Details</label>
            <textarea
              required
              rows={4}
              placeholder="Tell us what's working or what's bothering you..."
              className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-cyber-cyan/50 transition-all placeholder:text-slate-700"
              value={feedback.message}
              onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
            />
          </div>

          <Button variant="primary" className="w-full" type="submit" loading={loading} icon={Send}>
            Submit Feedback
          </Button>
        </form>
      </Modal>
    </>
  );
};

export default FeedbackWidget;
