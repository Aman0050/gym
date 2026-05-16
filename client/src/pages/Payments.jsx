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
            {/* Table Header / Search Bar */}
            <div className="px-7 py-6 border-b border-white/[0.06] flex flex-col lg:flex-row gap-5 items-stretch lg:items-center bg-white/[0.01]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-earth-clay/10 rounded-xl flex items-center justify-center border border-earth-clay/20">
                  <History size={18} className="text-earth-clay" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-ivory tracking-tight">Payment History</h3>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {filteredPayments.length} Transactions
                  </p>
                </div>
              </div>

              <div className="flex-1 lg:max-w-md relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-earth-clay transition-colors"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="Search by member name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-12 !py-3.5 text-sm w-full bg-white/[0.04] border-white/[0.07] hover:border-white/10"
                />
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
          title="Checkout Hub"
          subtitle="Enterprise POS Payment Flow"
          maxWidth="max-w-4xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Input Selection (3/5) */}
            <form onSubmit={handlePayment} className="lg:col-span-3 space-y-8">
              {/* Member Selection */}
              <div className="space-y-4">
                <label className="label-text ml-1 flex items-center gap-2">
                  <User size={14} className="text-earth-clay" />
                  Select Member
                </label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <select
                    required
                    value={newPayment.memberId}
                    onChange={(e) => setNewPayment({ ...newPayment, memberId: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-earth-clay/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-ivory outline-none appearance-none cursor-pointer transition-all"
                  >
                    <option value="">Search member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Plan Grid */}
              <div className="space-y-4">
                <label className="label-text ml-1 flex items-center gap-2">
                  <Activity size={14} className="text-earth-clay" />
                  Quick Plan Selection
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePlanChange(p.id)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 group ${
                        newPayment.planId === p.id
                          ? 'bg-earth-clay border-earth-clay shadow-lg shadow-earth-clay/20'
                          : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <p className={`text-[11px] font-black uppercase tracking-widest ${newPayment.planId === p.id ? 'text-white' : 'text-slate-400'}`}>
                        {p.name}
                      </p>
                      <p className={`text-lg font-black mt-1 ${newPayment.planId === p.id ? 'text-white' : 'text-ivory'}`}>
                        ₹{p.price}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Settings */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <label className="label-text ml-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newPayment.validFrom}
                    onChange={(e) => setNewPayment({ ...newPayment, validFrom: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl py-3.5 px-4 text-sm text-ivory outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="label-text ml-1">Custom Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-clay font-black text-sm">₹</span>
                    <input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => {
                        setNewPayment({ ...newPayment, amount: e.target.value });
                        if (isAdmin && e.target.value !== newPayment.originalPrice) setUseCustomPricing(true);
                      }}
                      className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-earth-clay/40 rounded-2xl py-3.5 pl-8 pr-4 text-sm text-ivory outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Right: Summary & Process (2/5) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="aura-glass-heavy p-8 rounded-[2.5rem] border-earth-clay/10 bg-gradient-to-br from-earth-clay/10 to-transparent flex flex-col h-full">
                <h4 className="text-xs font-black text-earth-clay uppercase tracking-[0.2em] mb-8">Order Summary</h4>
                
                <div className="space-y-6 flex-1">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Plan</span>
                    <span className="text-xs font-black text-ivory">{plans.find(p => p.id === newPayment.planId)?.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                    <span className="text-xs font-black text-ivory">{newPayment.customDurationDays || plans.find(p => p.id === newPayment.planId)?.duration_days || 0} Days</span>
                  </div>
                  
                  <div className="pt-8">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center">Amount Due</p>
                    <p className="text-5xl font-black text-ivory text-center tracking-tighter">
                      <span className="text-emerald-400 text-2xl mr-1">₹</span>
                      {newPayment.amount || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-8">
                  <Button 
                    variant="primary" 
                    className="w-full h-16 !text-lg !font-black !rounded-3xl shadow-2xl shadow-earth-clay/20 group"
                    onClick={handlePayment}
                    disabled={!newPayment.memberId || !newPayment.planId}
                  >
                    Confirm & Record
                    <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">Secure POS Transaction</p>
                </div>
              </div>
            </div>
          </div>
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
