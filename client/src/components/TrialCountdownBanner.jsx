import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const TrialCountdownBanner = () => {
  const { accessToken } = useAuthStore();
  const [trialStatus, setTrialStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscription/status`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'TRIAL') {
            setTrialStatus(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch trial status', err);
      }
    };
    fetchStatus();
  }, [accessToken]);

  if (!trialStatus) return null;

  const { trial_days_remaining, trial_end_date } = trialStatus;
  const isUrgent = trial_days_remaining <= 1;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        className={`w-full ${isUrgent ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-earth-clay/10 border-b border-earth-clay/20'}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-earth-clay/20 text-earth-clay'}`}>
                {isUrgent ? <AlertTriangle size={18} /> : <Clock size={18} />}
              </div>
              <div>
                <p className={`text-sm font-medium ${isUrgent ? 'text-red-400' : 'text-earth-clay'}`}>
                  {trial_days_remaining} {trial_days_remaining === 1 ? 'day' : 'days'} remaining in Free Trial
                </p>
                <p className="text-xs text-slate-400">
                  Trial expires on {new Date(trial_end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link to="/">
              <button className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
                isUrgent 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                  : 'bg-earth-clay hover:bg-earth-clay/90 text-white shadow-[0_0_15px_rgba(205,92,92,0.3)]'
              }`}>
                Upgrade Now
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrialCountdownBanner;
