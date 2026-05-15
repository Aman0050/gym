import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus, Trash2, Package, Clock,
  IndianRupee, ShieldCheck, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Modal } from '../components/ui';
import { FadeIn, PageTransition, StaggeredList } from '../components/Animations';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', duration_days: '', price: '' });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/plans', newPlan);
      setShowModal(false);
      setNewPlan({ name: '', duration_days: '', price: '' });
      fetchPlans();
      toast.success('Membership plan created successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (id, name) => {
    const confirmed = window.confirm(
      `Remove the "${name}" plan? Members currently on this plan will not be affected, but new enrollments will no longer be possible.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/plans/${id}`);
      fetchPlans();
      toast.success('Plan removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove plan');
    }
  };

  // Duration label helper
  const getDurationLabel = (days) => {
    if (days >= 365) return `${Math.round(days / 365)} Year${days >= 730 ? 's' : ''}`;
    if (days >= 30)  return `${Math.round(days / 30)} Month${days >= 60 ? 's' : ''}`;
    return `${days} Days`;
  };

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="page-header shadow-xl">
            <div className="page-header-meta">
              <div className="flex items-center gap-3">
                <span className="status-dot-live" />
                <span className="label-text">Plan Configuration</span>
              </div>
              <h1 className="page-title text-ivory">
                Membership{' '}
                <span className="text-earth-clay italic">Plans</span>
              </h1>
              <p className="body-text text-sm opacity-70">
                {plans.length > 0
                  ? `${plans.length} active plan${plans.length !== 1 ? 's' : ''} available for enrollment.`
                  : 'Configure membership durations, pricing, and access tiers.'}
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowModal(true)}
              className="self-start lg:self-center"
            >
              Create New Plan
            </Button>
          </div>
        </FadeIn>

        {/* ── Plans Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aura-glass p-8 h-56 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <FadeIn>
            <div className="aura-glass p-20 text-center border-dashed border-white/[0.08]">
              <div className="w-20 h-20 bg-white/[0.04] rounded-full flex items-center justify-center mb-6 mx-auto border border-white/[0.06]">
                <Package size={32} className="text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-slate-400 mb-3 tracking-tight">No Plans Yet</h3>
              <p className="text-sm text-slate-600 font-medium mb-8 max-w-xs mx-auto leading-relaxed">
                Create your first membership plan to start enrolling members and tracking payments.
              </p>
              <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
                Create First Plan
              </Button>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <FadeIn key={plan.id} direction="up" delay={idx * 0.05} duration={0.4}>
                <Card
                  variant="default"
                  className="p-8 lg:p-10 relative group overflow-hidden h-full flex flex-col hover:border-earth-clay/20 transition-colors duration-500"
                >
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-earth-clay/30 group-hover:bg-earth-clay/60 transition-colors duration-500" />

                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 bg-white/[0.05] rounded-2xl flex items-center justify-center border border-white/[0.07] group-hover:border-earth-clay/25 group-hover:rotate-6 transition-all duration-500">
                      <Package className="text-earth-clay" size={22} />
                    </div>
                    <button
                      onClick={() => handleDeletePlan(plan.id, plan.name)}
                      className="w-9 h-9 text-slate-600 hover:text-red-400 hover:bg-red-500/[0.08] rounded-xl transition-all border border-transparent hover:border-red-500/20 flex items-center justify-center"
                      aria-label="Delete plan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-ivory mb-5 tracking-tight">{plan.name}</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-3xl font-serif italic text-earth-clay">₹</span>
                    <span className="text-5xl font-black text-white tracking-tighter leading-none">
                      {Number(plan.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-6 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-earth-clay" />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wide">
                        {getDurationLabel(plan.duration_days)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </Card>
              </FadeIn>
            ))}
          </div>
        )}

        {/* ── Add Plan Modal ── */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setNewPlan({ name: '', duration_days: '', price: '' }); }}
          title="Create Membership Plan"
          subtitle="This plan will be immediately available for enrollment"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAddPlan} className="space-y-6">
            <Input
              label="Plan Name"
              placeholder="e.g. Platinum Annual"
              icon={Tag}
              required
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Duration (Days)"
                type="number"
                placeholder="30"
                icon={Clock}
                required
                min="1"
                value={newPlan.duration_days}
                onChange={(e) => setNewPlan({ ...newPlan, duration_days: e.target.value })}
              />
              <Input
                label="Price (₹)"
                type="number"
                placeholder="1500"
                icon={IndianRupee}
                required
                min="0"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              />
            </div>

            {newPlan.duration_days && (
              <div className="bg-earth-clay/5 border border-earth-clay/10 p-4 rounded-2xl flex items-center gap-3">
                <Clock size={14} className="text-earth-clay flex-shrink-0" />
                <p className="text-xs text-slate-400 font-medium">
                  Members will have access for{' '}
                  <span className="text-earth-clay font-black">
                    {getDurationLabel(parseInt(newPlan.duration_days) || 0)}
                  </span>{' '}
                  from their payment date.
                </p>
              </div>
            )}

            <div className="bg-earth-clay/5 border border-earth-clay/10 p-5 rounded-2xl flex items-start gap-4">
              <ShieldCheck size={17} className="text-earth-clay flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Adding a new plan will make it immediately available for member subscriptions.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                loading={submitting}
              >
                Save Plan
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Plans;
