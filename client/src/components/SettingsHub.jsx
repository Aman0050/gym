import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, Shield, Bell, CreditCard, 
  UserCheck, Save, RefreshCcw, Info, Check
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { transitions } from './ui';

const TABS = [
  { id: 'general',  label: 'Branch Info', icon: Info },
  { id: 'membership', label: 'Memberships', icon: UserCheck },
  { id: 'billing',  label: 'Billing & Tax', icon: CreditCard },
  { id: 'alerts',   label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security',      icon: Shield },
];

const SettingsHub = ({ isOpen, onClose }) => {
  const { settings, fetchSettings, updateSettings, isLoading } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen, fetchSettings]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'membership':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text mb-2 block">Expiry Reminders (Days)</label>
                <input
                  type="number"
                  value={formData.expiry_reminder_days}
                  onChange={(e) => setFormData({ ...formData, expiry_reminder_days: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">Grace Period (Days)</label>
                <input
                  type="number"
                  value={formData.grace_period_days}
                  onChange={(e) => setFormData({ ...formData, grace_period_days: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
              <div>
                <p className="text-xs font-black text-ivory uppercase tracking-wider">Auto-Freeze Expired Plans</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Automatically restrict access when plan expires.</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, auto_freeze_enabled: !formData.auto_freeze_enabled })}
                className={`w-12 h-6 rounded-full transition-all relative ${formData.auto_freeze_enabled ? 'bg-earth-clay' : 'bg-slate-800'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.auto_freeze_enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text mb-2 block">Invoice Prefix</label>
                <input
                  type="text"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="label-text mb-2 block">Tax Percentage (%)</label>
                <input
                  type="number"
                  value={formData.tax_percentage}
                  onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        );
      case 'alerts':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {[
              { id: 'whatsapp_enabled', label: 'WhatsApp Automations', desc: 'Send automated renewal links via WhatsApp.' },
              { id: 'email_enabled', label: 'Email Reports', desc: 'Receive daily performance summaries via email.' },
              { id: 'realtime_alerts_enabled', label: 'Real-time Dash Alerts', desc: 'Show desktop notifications for new events.' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05]">
                <div>
                  <p className="text-xs font-black text-ivory uppercase tracking-wider">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">{item.desc}</p>
                </div>
                <button
                  onClick={() => setFormData({ ...formData, [item.id]: !formData[item.id] })}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData[item.id] ? 'bg-earth-clay' : 'bg-slate-800'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData[item.id] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <Settings size={40} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Configuration Module</p>
            <p className="text-[10px] font-bold mt-2 text-center max-w-[200px]">General branch settings are managed in the Profile section.</p>
          </div>
        );
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed inset-0 m-auto w-full max-w-4xl h-[600px] bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/[0.08] z-[210] flex rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-white/[0.06] bg-white/[0.01] p-8">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-earth-clay/10 rounded-xl flex items-center justify-center border border-earth-clay/20">
                  <Settings size={20} className="text-earth-clay" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-ivory tracking-tight uppercase">System Hub</h2>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">v5.0 Enterprise</p>
                </div>
              </div>

              <div className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                      ${activeTab === tab.id 
                        ? 'bg-earth-clay text-white shadow-lg shadow-earth-clay/20' 
                        : 'text-slate-500 hover:text-ivory hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <tab.icon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-10 py-8 border-b border-white/[0.05] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-black text-ivory tracking-tight uppercase">
                    {TABS.find(t => t.id === activeTab).label}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">FitVibe OS Configuration</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-xl text-slate-500 hover:text-ivory transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto premium-scrollbar p-10">
                {renderContent()}
              </div>

              <div className="p-8 border-t border-white/[0.05] flex justify-end gap-4 bg-white/[0.01]">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-ivory transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-earth-clay rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-earth-clay/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsHub;
