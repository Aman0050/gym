import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  IndianRupee, Calendar, User, Download, Plus,
  Search, ShieldCheck, Filter, TrendingUp,
  History, CreditCard, Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import {
  Card, Button, Input, Select, Modal, Table, TableRow,
  StatusBadge, ConfirmDialog,
} from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [showDiscountConfirm, setShowDiscountConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const [newPayment, setNewPayment] = useState({
    memberId: '',
    planId: '',
    amount: '',
    validFrom: new Date().toISOString().split('T')[0],
    originalPrice: '',
    customDurationDays: '',
    discountReason: '',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, memRes, planRes] = await Promise.all([
        api.get('/payments'),
        api.get('/members?limit=200'),
        api.get('/plans'),
      ]);
      setPayments(payRes.data);
      setMembers(memRes.data.members || []);
      setPlans(planRes.data);
    } catch (err) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setUseCustomPricing(false);
    setNewPayment({
      memberId: '', planId: '', amount: '',
      validFrom: new Date().toISOString().split('T')[0],
      originalPrice: '', customDurationDays: '', discountReason: '',
    });
  };

  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setNewPayment({
        ...newPayment,
        planId,
        amount: plan.price,
        originalPrice: plan.price,
        customDurationDays: plan.duration_days,
      });
    }
  };

  const buildPayload = () => ({
    amount: newPayment.amount,
    memberId: newPayment.memberId,
    planId: newPayment.planId,
    pricingType: useCustomPricing ? 'CUSTOM' : 'STANDARD',
    originalPrice: newPayment.originalPrice,
    customDurationDays: useCustomPricing ? newPayment.customDurationDays : null,
    discountReason: useCustomPricing ? newPayment.discountReason : null,
    validFrom: newPayment.validFrom,
  });

  const processPayment = async (payload) => {
    try {
      const { data } = await api.post('/payments/create-order', payload);
      const { order, isMock } = data;

      const verifyData = {
        razorpay_order_id: order.id,
        razorpay_payment_id: isMock ? 'pay_mock_' + Date.now() : null,
        razorpay_signature: isMock ? 'mock_signature' : null,
        ...payload,
      };

      if (isMock) {
        const toastId = toast.loading('Processing payment...');
        await api.post('/payments/verify', verifyData);
        toast.success('Payment recorded successfully!', { id: toastId });
        setShowModal(false);
        resetModal();
        fetchData();
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'FitVibe Wellness',
        description: `Membership: ${useCustomPricing ? 'Custom Pricing' : 'Standard'}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', { ...verifyData, ...response });
            toast.success('Payment verified successfully!');
            setShowModal(false);
            resetModal();
            fetchData();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        theme: { color: '#a0522d' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process payment');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (useCustomPricing && newPayment.amount < newPayment.originalPrice * 0.5) {
      setPendingPayload(buildPayload());
      setShowDiscountConfirm(true);
      return;
    }

    await processPayment(buildPayload());
  };

  const filteredPayments = payments.filter((p) =>
    p.member_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const thisMonth = payments.filter((p) => {
    const d = new Date(p.payment_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">

        {/* ── Page Header ── */}
        <FadeIn direction="down" duration={0.4}>
          <div className="page-header shadow-xl">
            <div className="page-header-meta">
              <div className="flex items-center gap-3">
                <span className="status-dot-live" />
                <span className="label-text">Financial Ledger</span>
              </div>
              <h1 className="page-title text-ivory">
                Payments &{' '}
                <span className="text-earth-clay italic">Revenue</span>
              </h1>
              <p className="body-text text-sm opacity-70">
                Track payments and manage membership billing.
              </p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => { resetModal(); setShowModal(true); }}
              className="self-start lg:self-center"
            >
              Record Payment
            </Button>
          </div>
        </FadeIn>

        {/* ── Revenue Summary Cards ── */}
        <FadeIn delay={0.08} duration={0.4}>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: 'Total Revenue',   value: totalRevenue,  prefix: '₹', icon: TrendingUp },
              { label: 'This Month',      value: thisMonth,     prefix: '₹', icon: Receipt },
            ].map(({ label, value, prefix, icon: Icon }) => (
              <Card key={label} variant="flat" className="p-6 lg:p-8 flex items-center gap-5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-earth-clay flex-shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="label-text !text-[9px] !text-slate-500 mb-1">{label}</p>
                  <p className="text-2xl font-black text-ivory">
                    <span className="text-emerald-400 mr-0.5">₹</span>
                    <AnimatedCounter value={value} />
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </FadeIn>

        {/* ── Payments Table ── */}
        <FadeIn delay={0.15} duration={0.4}>
          <Card variant="flat" className="p-0 overflow-hidden shadow-xl">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-3">
                <History size={17} className="text-earth-clay" />
                <h3 className="label-text !text-ivory">Payment History</h3>
              </div>
              <div className="flex-1 md:max-w-sm">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search by member name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-11 !py-3 text-sm w-full"
                  />
                </div>
              </div>
            </div>

            <Table
              headers={[
                { label: 'Amount',  className: 'flex-1' },
                { label: 'Member',  className: 'flex-1' },
                { label: 'Plan',    className: 'flex-1' },
                { label: 'Status',  className: 'w-36' },
                { label: 'Invoice', className: 'w-20 text-right' },
              ]}
              isLoading={loading}
              emptyMessage="No payment records found."
              emptyIcon={<CreditCard size={22} className="text-slate-600" />}
            >
              {filteredPayments.map((p) => (
                <TableRow key={p.id}>
                  {/* Amount */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center border border-white/[0.07] flex-shrink-0">
                      <IndianRupee size={14} className="text-earth-clay" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-ivory">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </p>
                        {p.pricing_type === 'CUSTOM' && (
                          <span className="text-[8px] bg-earth-clay/10 text-earth-clay border border-earth-clay/20 px-2 py-0.5 rounded font-black tracking-widest">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Member */}
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-wide">{p.member_name}</p>
                  </div>

                  {/* Plan */}
                  <div className="flex-1">
                    <p className="text-xs font-black text-earth-clay">{p.plan_name}</p>
                    <p className="text-[9px] text-slate-600 font-semibold mt-0.5">
                      Until {new Date(p.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="w-36">
                    <StatusBadge status="ACTIVE" />
                  </div>

                  {/* Invoice */}
                  <div className="w-20 text-right">
                    <button
                      onClick={() => generateInvoicePDF(p, { name: p.member_name, phone: 'Member' })}
                      className="w-9 h-9 text-slate-500 hover:text-earth-clay transition-all hover:bg-white/[0.06] rounded-xl border border-transparent hover:border-white/[0.07] flex items-center justify-center ml-auto"
                      title="Download invoice"
                      aria-label="Download invoice"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </TableRow>
              ))}
            </Table>
          </Card>
        </FadeIn>

        {/* ── Record Payment Modal ── */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetModal(); }}
          title="Record Payment"
          subtitle="Create a new membership payment entry"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Member select */}
            <Select
              label="Member"
              required
              value={newPayment.memberId}
              onChange={(e) => setNewPayment({ ...newPayment, memberId: e.target.value })}
            >
              <option value="">Select a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone})
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-5">
              {/* Plan select */}
              <Select
                label="Membership Plan"
                required
                value={newPayment.planId}
                onChange={(e) => handlePlanChange(e.target.value)}
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price}
                  </option>
                ))}
              </Select>

              {/* Amount */}
              <div className="space-y-2.5">
                <label className="label-text ml-1 block">
                  {useCustomPricing ? 'Custom Amount' : 'Plan Amount'}
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-earth-clay font-black text-sm pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    readOnly={!useCustomPricing}
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className={`input-field pl-10 ${
                      useCustomPricing
                        ? 'border-earth-clay/30 text-earth-clay'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                    placeholder="0"
                  />
                  {!useCustomPricing && newPayment.originalPrice && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      Fixed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Pricing Toggle — Admins only */}
            {isAdmin && newPayment.planId && (
              <div className="bg-earth-clay/5 p-6 rounded-2xl border border-earth-clay/10 relative overflow-hidden">
                <div className="absolute top-3 right-4 opacity-5">
                  <TrendingUp size={48} />
                </div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-earth-clay/15 rounded-xl flex items-center justify-center border border-earth-clay/20">
                      <IndianRupee className="text-earth-clay" size={15} />
                    </div>
                    <p className="label-text !text-earth-clay">Custom Pricing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={useCustomPricing}
                      onChange={(e) => setUseCustomPricing(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earth-clay shadow-inner" />
                  </label>
                </div>

                {useCustomPricing && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Duration (Days)"
                      type="number"
                      value={newPayment.customDurationDays}
                      onChange={(e) => setNewPayment({ ...newPayment, customDurationDays: e.target.value })}
                      placeholder="30"
                    />
                    <Input
                      label="Reason for Discount"
                      type="text"
                      placeholder="e.g. Loyalty discount"
                      value={newPayment.discountReason}
                      onChange={(e) => setNewPayment({ ...newPayment, discountReason: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2.5">
              <label className="label-text ml-1 block">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                <input
                  type="date"
                  required
                  value={newPayment.validFrom}
                  onChange={(e) => setNewPayment({ ...newPayment, validFrom: e.target.value })}
                  className="input-field pl-14"
                />
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-4 bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl">
              <ShieldCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {useCustomPricing
                  ? 'Custom pricing requires a valid discount reason for audit compliance.'
                  : 'All payments are processed securely and logged for compliance.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowModal(false); resetModal(); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                {useCustomPricing ? 'Confirm Custom Payment' : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Discount Confirmation Dialog ── */}
        <ConfirmDialog
          isOpen={showDiscountConfirm}
          onClose={() => { setShowDiscountConfirm(false); setPendingPayload(null); }}
          onConfirm={async () => {
            setShowDiscountConfirm(false);
            if (pendingPayload) await processPayment(pendingPayload);
            setPendingPayload(null);
          }}
          title="Large Discount Warning"
          message="This payment is more than 50% below the standard plan price. Are you sure you want to proceed with this custom amount?"
          confirmLabel="Yes, Proceed"
          confirmVariant="danger"
        />
      </div>
    </PageTransition>
  );
};

export default Payments;
