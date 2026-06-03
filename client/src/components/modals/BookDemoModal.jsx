import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Mail, Phone, MessageSquare, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '../ui';

const BookDemoModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    gymName: '',
    email: '',
    phone: '',
    members: '0-500',
    branches: '1',
    contactMethod: 'Phone',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/demo/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 4000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone) => {
    const text = encodeURIComponent("Hello FitXeno Team,\n\nI would like a live demonstration of the platform for my gym.\n\nPlease contact me regarding pricing and onboarding.");
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden aura-glass-heavy max-h-[90vh] overflow-y-auto premium-scrollbar flex flex-col md:flex-row"
      >
        {/* Left Side: WhatsApp Quick Connect */}
        <div className="w-full md:w-1/3 bg-zinc-900 border-r border-white/5 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-serif font-black text-white mb-2">Instant Connect</h3>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">Skip the queue. Chat directly with the platform architects on WhatsApp.</p>
            
            <div className="space-y-4">
              <button 
                type="button"
                onClick={() => openWhatsApp('919310786512')}
                className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl p-4 flex flex-col items-start transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle size={16} />
                  <span className="font-bold text-sm">Sufyan Khan</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider opacity-80">Founder</span>
              </button>

              <button 
                type="button"
                onClick={() => openWhatsApp('917827392589')}
                className="w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl p-4 flex flex-col items-start transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle size={16} />
                  <span className="font-bold text-sm">Aman Naeem</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider opacity-80">Co-Founder</span>
              </button>
            </div>
          </div>
          
          <div className="hidden md:block mt-8 pt-8 border-t border-white/10">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Enterprise Grade SLA</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-2/3 flex flex-col relative">
          <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-white/5 bg-zinc-950/90 backdrop-blur-xl">
            <h2 className="text-xl font-serif font-black text-white">Book Live Demonstration</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X className="text-slate-400" size={20} />
            </button>
          </div>

          <div className="p-6 sm:p-8 flex-1">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center space-y-4 h-full"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                    <CheckCircle2 className="text-emerald-400 w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-serif font-black text-white">Request Received</h3>
                  <p className="text-slate-400 max-w-sm mx-auto text-sm">
                    Your demo request has been logged securely.<br/>
                    A FitXeno specialist will contact you shortly.
                  </p>
                </motion.div>
              ) : (
                <motion.form 
                  key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                >
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field pl-10 py-2.5 text-sm" placeholder="John Doe" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Gym Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input required type="text" name="gymName" value={formData.gymName} onChange={handleChange} className="input-field pl-10 py-2.5 text-sm" placeholder="Iron Paradise" />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field pl-10 py-2.5 text-sm" placeholder="admin@gym.com" />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-10 py-2.5 text-sm" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Members</label>
                      <select name="members" value={formData.members} onChange={handleChange} className="select-field py-2.5 text-sm">
                        <option value="0-500">0 - 500</option>
                        <option value="500-2000">500 - 2,000</option>
                        <option value="2000+">2,000+</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Branches</label>
                      <select name="branches" value={formData.branches} onChange={handleChange} className="select-field py-2.5 text-sm">
                        <option value="1">1</option>
                        <option value="2-5">2 - 5</option>
                        <option value="6+">6+</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="label-text !text-slate-400">Contact Via</label>
                      <select name="contactMethod" value={formData.contactMethod} onChange={handleChange} className="select-field py-2.5 text-sm">
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="label-text !text-slate-400">Additional Message (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                      <textarea name="message" value={formData.message} onChange={handleChange} rows="3" className="input-field pl-10 py-3 text-sm resize-none" placeholder="Any specific requirements or pain points?" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" variant="primary" className="w-full !py-3 text-sm flex items-center justify-center gap-2" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        <>
                          Submit Inquiry <Send size={16} />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookDemoModal;
