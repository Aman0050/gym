import React, { useState } from 'react';
import { 
  Users, Snowflake, Sun, Trash2, Mail, 
  AlertCircle, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';
import { Modal, Button } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BulkActionModal = ({ isOpen, onClose, selectedIds, onComplete }) => {
  const [step, setStep] = useState('select'); // select | confirm | processing | result
  const [selectedAction, setSelectedAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const actions = [
    { 
      id: 'FREEZE', 
      label: 'Freeze Memberships', 
      icon: Snowflake, 
      color: 'text-sky-400', 
      bg: 'bg-sky-500/10',
      description: 'Stop membership validity and attendance for selected members.'
    },
    { 
      id: 'UNFREEZE', 
      label: 'Reactivate Memberships', 
      icon: Sun, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/10',
      description: 'Resume membership validity and allow attendance for selected members.'
    },
    { 
      id: 'DELETE', 
      label: 'Delete Records', 
      icon: Trash2, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10',
      description: 'Permanently remove selected members and their history. This cannot be undone.',
      critical: true
    },
  ];

  const handleStart = async () => {
    setIsProcessing(true);
    setStep('processing');
    try {
      const res = await api.post('/members/bulk-action', {
        memberIds: selectedIds,
        action: selectedAction.id
      });
      setResult({ success: true, count: res.data.count });
      setStep('result');
      onComplete();
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || 'Batch operation failed' });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedAction(null);
    setResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isProcessing) { onClose(); reset(); } }}
      title="Bulk Operations Hub"
      subtitle={`${selectedIds.length} members selected`}
      maxWidth="max-w-2xl"
    >
      {step === 'select' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => { setSelectedAction(action); setStep('confirm'); }}
                className="group flex items-start gap-5 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-earth-clay/30 hover:bg-white/[0.05] transition-all text-left"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${action.bg} ${action.color}`}>
                  <action.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-ivory tracking-tight group-hover:text-earth-clay transition-colors">{action.label}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{action.description}</p>
                </div>
                <ArrowRight size={16} className="text-slate-600 group-hover:text-earth-clay mt-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-8 py-4">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center ${selectedAction.bg} ${selectedAction.color} shadow-2xl`}>
              <selectedAction.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-ivory tracking-tight">Confirm Batch Action</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                You are about to <span className={selectedAction.color}>{selectedAction.label.toLowerCase()}</span> for <span className="text-ivory font-bold">{selectedIds.length} members</span>.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('select')}>Back</Button>
            <Button 
              variant={selectedAction.critical ? 'danger' : 'primary'} 
              className="flex-1 h-14" 
              onClick={handleStart}
            >
              Start Batch Processing
            </Button>
          </div>
        </div>
      )}

      {step === 'processing' && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <Loader2 size={48} className="text-earth-clay animate-spin" />
            <div className="absolute inset-0 bg-earth-clay/20 blur-2xl rounded-full" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-ivory">Processing Batch...</h3>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Do not close this window</p>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-8">
          <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center ${result.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {result.success ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-ivory">
              {result.success ? 'Batch Operation Complete' : 'Operation Failed'}
            </h3>
            <p className="text-sm text-slate-500">
              {result.success 
                ? `Successfully processed ${result.count} members.` 
                : result.error}
            </p>
          </div>
          <Button variant="primary" className="w-full h-14" onClick={() => { onClose(); reset(); }}>
            Return to Directory
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default BulkActionModal;
