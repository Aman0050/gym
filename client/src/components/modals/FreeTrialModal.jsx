import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, User, Mail, Phone, MapPin, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const FreeTrialModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    gymName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success
      setSuccess(true);
      
      // Auto-login after 2 seconds to show success message
      setTimeout(() => {
        setAuth({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
        navigate('/dashboard');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden aura-glass-heavy max-h-[90vh] overflow-y-auto premium-scrollbar"
      >
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
          <div>
            <h2 className="text-2xl font-serif font-black text-white">Initialize OS Trial</h2>
            <p className="text-xs text-slate-400 mt-1">Deploy your enterprise infrastructure in seconds.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="text-slate-400" size={24} />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="text-emerald-400 w-10 h-10" />
                </div>
                <h3 className="text-3xl font-serif font-black text-white">Welcome to FitXeno</h3>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your enterprise management portal is now active.<br/>
                  <span className="text-earth-clay italic">Redirecting to command center...</span>
                </p>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mt-8">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.5 }}
                    className="h-full bg-earth-clay"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Gym Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="text" name="gymName" value={formData.gymName} onChange={handleChange} className="input-field pl-12" placeholder="e.g. Iron Paradise" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Owner Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="input-field pl-12" placeholder="Your full name" />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="email" name="email" value={formData.email} onChange={handleChange} className="input-field pl-12" placeholder="admin@gym.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-12" placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-text !text-slate-400">City / Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="input-field pl-12" placeholder="Mumbai, Maharashtra" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Admin Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} className="input-field pl-12" placeholder="••••••••" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label-text !text-slate-400">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input required type="password" name="confirmPassword" minLength={6} value={formData.confirmPassword} onChange={handleChange} className="input-field pl-12" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="primary" className="w-full !py-4 text-sm flex items-center justify-center gap-2" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Provisioning Tenant...
                      </span>
                    ) : (
                      <>
                        Deploy Infrastructure <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-500 mt-4">
                    By starting this trial, you agree to FitXeno's Enterprise Terms of Service and Data Processing Agreement.
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default FreeTrialModal;
