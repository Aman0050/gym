import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
  IndianRupee, User, Download, Plus,
  Search, TrendingUp,
  History, CreditCard, Receipt, Activity, ArrowRight,
  CheckCircle2, Clock, XCircle, QrCode, ShieldCheck,
  Banknote, Smartphone, Building2, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import getErrorMessage from '../utils/getErrorMessage';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { QRCodeSVG } from 'qrcode.react';
import {
  Card, Button, Input, Select, Modal, Table, TableRow,
  StatusBadge, ConfirmDialog,
} from '../components/ui';
import { FadeIn, PageTransition, AnimatedCounter } from '../components/Animations';
import { searchMatch } from '../utils/searchMatch';

// ─────────────────────────────────────────────────────────────────────────────
// Payment Status Badge Component
// ─────────────────────────────────────────────────────────────────────────────
const PaymentStatusBadge = ({ status }) => {
  const cfg = {
    PAID:    { label: 'Paid',    icon: CheckCircle2,  bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    PENDING: { label: 'Pending', icon: Clock,         bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-400',   dot: 'bg-amber-400 animate-pulse' },
    FAILED:  { label: 'Failed',  icon: XCircle,       bg: 'bg-red-500/10',     border: 'border-red-500/25',     text: 'text-red-400',     dot: 'bg-red-400' },
  }[status] || { label: status, icon: Clock, bg: 'bg-white/5', border: 'border-white/10', text: 'text-slate-400', dot: 'bg-slate-400' };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Step Indicator Component
// ─────────────────────────────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { n: 1, label: 'Configure' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Activated' },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const isCompleted = currentStep > s.n || (currentStep === 3 && s.n === 3);
        const isActive = currentStep === s.n && currentStep !== 3;
        return (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500 text-white border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : isActive
                  ? 'bg-earth-clay text-white shadow-[0_0_20px_rgba(194,107,54,0.5)] ring-2 ring-earth-clay/30'
                  : 'bg-white/[0.05] text-slate-500 border border-white/[0.07]'
              }`}>
                {isCompleted ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                isActive ? 'text-earth-clay' : isCompleted ? 'text-emerald-400' : 'text-slate-600'
              }`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-16 mx-2 mb-4 transition-all duration-500 ${isCompleted || currentStep > s.n ? 'bg-emerald-500/60' : 'bg-white/[0.06]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Icon
// ─────────────────────────────────────────────────────────────────────────────
const methodIcon = (method) => {
  const icons = { Cash: Banknote, UPI: Smartphone, Card: CreditCard, 'Bank Transfer': Building2 };
  const Icon = icons[method] || CreditCard;
  return <Icon size={16} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [useCustomPricing, setUseCustomPricing] = useState(false);
  const [showDiscountConfirm, setShowDiscountConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  
  // Duplicate Protection State
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateWarningData, setDuplicateWarningData] = useState(null);

  // ── POS Checkout State ──────────────────────────────────────────────────────
  const [checkoutStep, setCheckoutStep] = useState(1);          // 1 | 2 | 3
  const [pendingPaymentId, setPendingPaymentId] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedPayment, setConfirmedPayment] = useState(null);

  const [newPayment, setNewPayment] = useState({
    memberId: '',
    planId: '',
    amount: '',
    validFrom: new Date().toISOString().split('T')[0],
    originalPrice: '',
    customDurationDays: '',
    discountReason: '',
    paymentMethod: 'Cash',
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  // Handle auto-opening the payment terminal (e.g. from MembersList Quick Actions)
  useEffect(() => {
    if (!loading && members.length > 0 && plans.length > 0 && location.state?.autoOpen) {
      setIsAutoLoading(true);
      const state = location.state;

      setTimeout(() => {
        setNewPayment(prev => {
          const update = { ...prev, memberId: state.memberId };
          if (state.planId) {
            const plan = plans.find(p => p.id === state.planId);
            if (plan) {
              update.planId = plan.id;
              update.amount = plan.price;
              update.originalPrice = plan.price;
              update.customDurationDays = plan.duration_days;
            }
          }
          return update;
        });
        setShowModal(true);
        setIsAutoLoading(false);
        navigate(location.pathname, { replace: true });
      }, 600);
    }
  }, [loading, members.length, plans.length, location.state, navigate, location.pathname, plans]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, memRes, planRes, settingsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/members?limit=200'),
        api.get('/plans'),
        api.get('/settings').catch(() => ({ data: {} })),
      ]);
      setPayments(payRes.data);
      setMembers(memRes.data.members || []);
      setPlans(planRes.data);
      setGymSettings(settingsRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setUseCustomPricing(false);
    setCheckoutStep(1);
    setPendingPaymentId(null);
    setConfirmedPayment(null);
    setIsGeneratingQR(false);
    setIsConfirming(false);
    setNewPayment({
      memberId: '', planId: '', amount: '',
      validFrom: new Date().toISOString().split('T')[0],
      originalPrice: '', customDurationDays: '', discountReason: '',
      paymentMethod: 'Cash',
    });
    setIsMemberDropdownOpen(false);
    setMemberSearchTerm('');
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
    paymentMethod: newPayment.paymentMethod,
  });

  // ── STEP 1 → STEP 2: Generate pending payment ──────────────────────────────
  const handleGeneratePayment = async (payload) => {
    setIsGeneratingQR(true);
    try {
      const { data } = await api.post('/payments/create-pending', payload);
      setPendingPaymentId(data.paymentId);
      setCheckoutStep(2);
      toast.success('Payment session created — waiting for confirmation');
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.hasActiveSubscription) {
        setDuplicateWarningData(err.response.data);
        setPendingPayload(payload);
        setShowDuplicateWarning(true);
      } else {
        toast.error(getErrorMessage(err) || 'Failed to create payment session');
      }
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleProceedToCheckout = async (e) => {
    if (e) e.preventDefault();

    if (useCustomPricing && newPayment.amount < newPayment.originalPrice * 0.5) {
      setPendingPayload(buildPayload());
      setShowDiscountConfirm(true);
      return;
    }
    await handleGeneratePayment(buildPayload());
  };

  // ── STEP 2 → STEP 3: Admin confirms payment received ───────────────────────
  const handleConfirmPayment = async () => {
    if (!pendingPaymentId) return;
    setIsConfirming(true);
    try {
      const { data } = await api.post(`/payments/confirm/${pendingPaymentId}`);
      setConfirmedPayment(data.payment);
      setCheckoutStep(3);
      toast.success('✅ Payment confirmed — Membership activated!', { duration: 4000 });
      fetchData();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredPayments = (payments || []).filter((p) =>
    searchMatch(search, p?.member_name, p?.amount, p?.payment_method)
  );

  // Stats — only count PAID payments in revenue
  const totalRevenue = payments
    .filter(p => !p.payment_status || p.payment_status === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const thisMonth = payments.filter((p) => {
    if (p.payment_status && p.payment_status !== 'PAID') return false;
    const d = new Date(p.payment_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const selectedMember = members.find(m => m.id === newPayment.memberId);
  const selectedPlan = plans.find(p => p.id === newPayment.planId);
  const upiPayload = gymSettings?.upi_id
    ? `upi://pay?pa=${gymSettings.upi_id}&pn=${encodeURIComponent(gymSettings.business_name || 'FITXENO GYM')}&am=${newPayment.amount || 0}&cu=INR`
    : '';

  return (
    <PageTransition>
      {/* Auto-Load Overlay */}
      <AnimatePresence>
        {isAutoLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-obsidian/90 backdrop-blur-xl flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full border-4 border-earth-clay/20 border-t-earth-clay animate-spin mb-6 shadow-[0_0_40px_rgba(160,82,45,0.4)]" />
            <h2 className="text-xl font-black text-ivory tracking-tight animate-pulse">Loading Payment Console...</h2>
            <p className="text-sm text-slate-400 mt-2 font-medium">Preparing member details and active plan</p>
          </motion.div>
        )}
      </AnimatePresence>

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
              New Payment
            </Button>
          </div>
        </FadeIn>

        {/* ── Revenue Summary Cards ── */}
        <FadeIn delay={0.08} duration={0.4}>
          <div className="grid grid-cols-2 gap-5">
            {[
              { label: 'Total Revenue', value: totalRevenue, icon: TrendingUp },
              { label: 'This Month',    value: thisMonth,    icon: Receipt },
            ].map(({ label, value, icon: Icon }) => (
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
          <Card variant="flat" className="p-0 overflow-hidden shadow-xl flex flex-col min-w-0 min-h-0">
            <div className="px-7 py-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-white/[0.01]">
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

              <div className="w-full sm:w-72 lg:w-96 relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-earth-clay transition-colors z-10 pointer-events-none"
                  size={15}
                />
                <input
                  type="text"
                  placeholder="Search by member name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-earth-clay/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-400 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <Table
              headers={[
                { label: 'Amount',         className: 'flex-1' },
                { label: 'Member',         className: 'flex-1' },
                { label: 'Plan',           className: 'flex-1' },
                { label: 'Pay Status',     className: 'w-28' },
                { label: 'Validity',       className: 'w-36' },
                { label: 'Invoice',        className: 'w-20 text-right' },
              ]}
              emptyMessage="No payment records found."
              emptyIcon={CreditCard}
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
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
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
                    <p className="text-[9px] text-slate-500 font-bold mt-0.5 uppercase">
                      {p.payment_mode?.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Payment Status */}
                  <div className="w-28">
                    <PaymentStatusBadge status={p.payment_status || 'PAID'} />
                  </div>

                  {/* Membership Validity */}
                  <div className="w-36">
                    {p.payment_status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border-amber-500/25 text-amber-400">
                        <Clock size={10} />
                        Pending Activation
                      </span>
                    ) : (
                      <StatusBadge status={new Date(p.valid_until) < new Date() ? 'EXPIRED' : 'ACTIVE'} />
                    )}
                  </div>

                  {/* Invoice */}
                  <div className="w-20 text-right">
                    <button
                      onClick={() => generateInvoicePDF(p, { name: p.member_name, phone: p.member_phone || 'N/A', id: p.member_id })}
                      disabled={p.payment_status === 'PENDING'}
                      className="w-9 h-9 text-slate-500 hover:text-earth-clay transition-all hover:bg-white/[0.06] rounded-xl border border-transparent hover:border-white/[0.07] flex items-center justify-center ml-auto disabled:opacity-30 disabled:cursor-not-allowed"
                      title={p.payment_status === 'PENDING' ? 'Confirm payment to download invoice' : 'Download invoice'}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </TableRow>
              ))}
            </Table>
          </Card>
        </FadeIn>

        {/* ── Enterprise POS Checkout Modal ── */}
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); resetModal(); }}
          onBack={checkoutStep === 2 ? () => setCheckoutStep(1) : undefined}
          title="Checkout Hub"
          subtitle={
            checkoutStep === 1 ? 'Configure Payment' :
            checkoutStep === 2 ? 'Awaiting Payment Confirmation' :
            'Membership Activated'
          }
          maxWidth="max-w-4xl"
        >
          {/* Step Indicator */}
          <StepIndicator currentStep={checkoutStep} />

          <AnimatePresence mode="wait">
            {/* ────────────────────────────── STEP 1: Configure ────────────── */}
            {checkoutStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* Left: Input Selection (3/5) */}
                <form onSubmit={handleProceedToCheckout} className="lg:col-span-3 space-y-8">
                  {/* Member Selection */}
                  <div className="space-y-4 relative z-50">
                    <label className="label-text ml-1 flex items-center gap-2">
                      <User size={14} className="text-earth-clay" />
                      Select Member
                    </label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={16} />
                      <input
                        type="text"
                        required={!newPayment.memberId}
                        placeholder="Search member..."
                        value={isMemberDropdownOpen ? memberSearchTerm : (members.find(m => m.id === newPayment.memberId)?.name || '')}
                        onChange={(e) => {
                          setMemberSearchTerm(e.target.value);
                          if (!isMemberDropdownOpen) setIsMemberDropdownOpen(true);
                          if (newPayment.memberId) setNewPayment({ ...newPayment, memberId: '' });
                        }}
                        onFocus={() => setIsMemberDropdownOpen(true)}
                        className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-earth-clay/40 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[#ffffff] outline-none transition-all placeholder:text-white/[0.35]"
                      />
                      <AnimatePresence>
                        {isMemberDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsMemberDropdownOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl overflow-hidden premium-scrollbar"
                              style={{
                                background: '#111111',
                                border: '1px solid rgba(255,255,255,0.06)',
                                maxHeight: '240px',
                                overflowY: 'auto',
                              }}
                            >
                              {(members || [])
                                .filter(m => searchMatch(memberSearchTerm, m?.name, m?.phone))
                                .map((m) => {
                                  const isSelected = newPayment.memberId === m.id;
                                  return (
                                    <div
                                      key={m.id}
                                      onClick={() => {
                                        setNewPayment({ ...newPayment, memberId: m.id });
                                        setMemberSearchTerm('');
                                        setIsMemberDropdownOpen(false);
                                      }}
                                      className="cursor-pointer px-4 py-3 flex items-center justify-between"
                                      style={{
                                        background: isSelected ? 'rgba(194,107,54,0.18)' : 'transparent',
                                        borderLeft: isSelected ? '2px solid #C26B36' : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(194,107,54,0.12)'; }}
                                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      <span style={{ color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.92)' }} className="text-sm font-semibold">{m.name}</span>
                                      <span style={{ color: 'rgba(255,255,255,0.55)' }} className="text-xs">{m.phone}</span>
                                    </div>
                                  );
                                })}
                              {(members || []).filter(m => searchMatch(memberSearchTerm, m?.name, m?.phone)).length === 0 && (
                                <div className="px-4 py-4 text-center text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                  No members found
                                </div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
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
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-2xl py-3.5 px-4 text-sm text-white outline-none"
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
                          className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-earth-clay/40 rounded-2xl py-3.5 pl-8 pr-4 text-sm text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4 pt-2">
                    <label className="label-text ml-1 flex items-center gap-2">
                      <CreditCard size={14} className="text-earth-clay" />
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Cash', 'UPI', 'Card', 'Bank Transfer'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewPayment({ ...newPayment, paymentMethod: method })}
                          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 ${
                            newPayment.paymentMethod === method
                              ? 'bg-earth-clay/10 border-earth-clay shadow-[0_0_15px_rgba(160,82,45,0.2)]'
                              : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20'
                          }`}
                        >
                          <span className={newPayment.paymentMethod === method ? 'text-earth-clay' : 'text-slate-500'}>
                            {methodIcon(method)}
                          </span>
                          <p className={`text-sm font-semibold tracking-wider ${newPayment.paymentMethod === method ? 'text-earth-clay' : 'text-slate-400'}`}>
                            {method}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Right: Order Summary (2/5) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="aura-glass-heavy p-8 rounded-[2.5rem] border-earth-clay/10 bg-gradient-to-br from-earth-clay/10 to-transparent flex flex-col">
                    <h4 className="text-xs font-black text-earth-clay uppercase tracking-[0.2em] mb-8">Order Summary</h4>

                    <div className="space-y-5 flex-1">
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Member</span>
                        <span className="text-xs font-black text-ivory text-right max-w-[120px] truncate">
                          {selectedMember?.name || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Plan</span>
                        <span className="text-xs font-black text-ivory">{selectedPlan?.name || 'None'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                        <span className="text-xs font-black text-ivory">{newPayment.customDurationDays || selectedPlan?.duration_days || 0} Days</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</span>
                        <span className="text-xs font-black text-ivory uppercase flex items-center gap-1.5">
                          {methodIcon(newPayment.paymentMethod)}
                          {newPayment.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          <Clock size={9} />
                          Pending Activation
                        </span>
                      </div>

                      <div className="pt-6">
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
                        className="w-full h-16 !text-base !font-black !rounded-3xl shadow-2xl shadow-earth-clay/20 group"
                        onClick={handleProceedToCheckout}
                        disabled={!newPayment.memberId || !newPayment.planId || !newPayment.amount || isGeneratingQR}
                        loading={isGeneratingQR}
                      >
                        {newPayment.paymentMethod === 'UPI' ? (
                          <><QrCode size={18} className="mr-2" />Generate Payment QR</>
                        ) : (
                          <>Proceed to Checkout<ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </Button>
                      <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">
                        Membership activates after confirmation
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────── STEP 2: Payment Pending ──────── */}
            {checkoutStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-8"
              >
                {/* Left: QR or Payment Info (3/5) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Payment Pending Banner */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06]">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-amber-300">Payment Session Active</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">
                        Membership will activate only after admin confirms payment received
                      </p>
                    </div>
                  </div>

                  {/* UPI QR Code */}
                  {newPayment.paymentMethod === 'UPI' && gymSettings?.upi_id ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, type: 'spring' }}
                      className="flex flex-col items-center bg-white/[0.02] border border-earth-clay/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(160,82,45,0.12)]"
                    >
                      {/* QR wrapper */}
                      <div className="relative mb-6">
                        <div className="absolute -inset-3 rounded-2xl bg-earth-clay/10 blur-md" />
                        <div className="relative bg-white p-4 rounded-2xl shadow-xl">
                          <QRCodeSVG
                            value={upiPayload}
                            size={180}
                            level="Q"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-1 mb-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan to Pay via UPI</p>
                        <p className="text-xl font-black text-ivory">
                          <span className="text-emerald-400">₹</span>{Number(newPayment.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm font-bold text-earth-clay">{gymSettings.business_name || 'FITXENO GYM'}</p>
                        <p className="text-xs text-slate-500 font-medium font-mono">{gymSettings.upi_id}</p>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10">
                        <Clock size={12} className="text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Payment Pending</span>
                      </div>
                    </motion.div>
                  ) : (
                    // Non-UPI method summary
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col items-center bg-white/[0.02] border border-earth-clay/20 rounded-3xl p-10 text-center shadow-[0_0_50px_rgba(160,82,45,0.08)]"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-earth-clay/15 border border-earth-clay/25 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(194,107,54,0.2)]">
                        <span className="text-earth-clay scale-125">{methodIcon(newPayment.paymentMethod)}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Collect Payment Via</p>
                      <p className="text-2xl font-black text-ivory mb-1">{newPayment.paymentMethod}</p>
                      <p className="text-3xl font-black text-ivory mt-4">
                        <span className="text-emerald-400 text-xl">₹</span>
                        {Number(newPayment.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-slate-400 mt-3">from <span className="text-ivory font-bold">{selectedMember?.name}</span></p>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 mt-6">
                        <Clock size={12} className="text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awaiting Collection</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Security Notice */}
                  <div className="flex items-center gap-2 text-slate-600">
                    <ShieldCheck size={13} className="text-slate-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold">
                      Membership will remain <span className="text-amber-400 font-black">PENDING</span> until you confirm payment below. Attendance is blocked until then.
                    </p>
                  </div>
                </div>

                {/* Right: Confirm Panel (2/5) */}
                <div className="lg:col-span-2">
                  <div className="aura-glass-heavy p-8 rounded-[2.5rem] border-earth-clay/10 bg-gradient-to-br from-earth-clay/10 to-transparent flex flex-col">
                    <h4 className="text-xs font-black text-earth-clay uppercase tracking-[0.2em] mb-6">Order Summary</h4>

                    <div className="space-y-4 flex-1">
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Member</span>
                        <span className="text-xs font-black text-ivory truncate max-w-[120px]">{selectedMember?.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan</span>
                        <span className="text-xs font-black text-earth-clay">{selectedPlan?.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                        <span className="text-xs font-black text-ivory">{newPayment.customDurationDays || selectedPlan?.duration_days || 0}d</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Method</span>
                        <span className="text-xs font-black text-ivory uppercase">{newPayment.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pay Status</span>
                        <PaymentStatusBadge status="PENDING" />
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Membership</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          <Clock size={9} className="animate-pulse" />
                          Pending Activation
                        </span>
                      </div>

                      <div className="pt-4">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 text-center">Amount Due</p>
                        <p className="text-4xl font-black text-ivory text-center tracking-tighter">
                          <span className="text-emerald-400 text-xl mr-1">₹</span>
                          {Number(newPayment.amount).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Confirm Button — Primary Admin Action */}
                    <div className="space-y-3 pt-8">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirmPayment}
                        disabled={isConfirming}
                        className="w-full h-16 px-4 rounded-3xl font-black text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background: isConfirming
                            ? 'rgba(16,185,129,0.3)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: isConfirming ? 'none' : '0 8px 32px rgba(16,185,129,0.35), 0 0 0 1px rgba(16,185,129,0.2)',
                          color: 'white',
                        }}
                      >
                        {isConfirming ? (
                          <>
                            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            Confirm Payment Received
                          </>
                        )}
                      </motion.button>
                      <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-widest">
                        Admin verification required
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ────────────────────────────── STEP 3: Activated ────────────── */}
            {checkoutStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                className="flex flex-col items-center justify-center px-6 py-12 w-full"
              >
                <div className="w-full max-w-2xl text-center">
                  {/* Success Orb */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                    className="relative mb-8 w-40 h-40 mx-auto rounded-full"
                  >
                    <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(16,185,129,0.45)] blur-xl animate-pulse" />
                    <div className="relative w-full h-full rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 size={64} className="text-emerald-400" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3 mb-8"
                  >
                    <h3 className="text-5xl font-black text-ivory tracking-tight">Payment Confirmed!</h3>
                    <p className="text-zinc-400 text-lg mt-3">
                      Membership has been activated for <span className="text-ivory font-bold">{selectedMember?.name}</span>
                    </p>
                  </motion.div>

                  {/* Premium Confirmation Receipt */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, type: 'spring', bounce: 0.2 }}
                    className="inline-block w-full min-w-[300px] sm:min-w-[400px] max-w-md mx-auto mt-10 relative group text-left"
                  >
                    {/* Ambient Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-b from-emerald-500/20 to-transparent rounded-3xl blur-2xl opacity-50 transition-opacity duration-700" />
                    
                    <div className="relative bg-[#0d0d0d] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl w-full">
                      {/* Receipt Top Section */}
                      <div className="p-8 border-b border-dashed border-white/[0.15] bg-white/[0.02] flex flex-col items-center justify-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Amount Paid</p>
                        <h4 className="text-5xl font-black text-ivory tracking-tighter flex items-start justify-center gap-1">
                          <span className="text-emerald-400 text-3xl mt-1">₹</span>
                          {Number(newPayment.amount).toLocaleString('en-IN')}
                        </h4>
                      </div>

                      {/* Receipt Details */}
                      <div className="p-8 flex flex-col gap-5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        {[
                          { label: 'Plan Selected', value: selectedPlan?.name || 'N/A' },
                          { label: 'Payment Method', value: newPayment.paymentMethod },
                          { label: 'Transaction', value: <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Successful</span> },
                          { label: 'Network Access', value: <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest"><ShieldCheck size={10} />Active</span> },
                        ].map(({ label, value }, i) => (
                          <motion.div 
                            key={label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + (i * 0.1) }}
                            className="flex items-center justify-between w-full"
                          >
                            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">{label}</span>
                            <span className="text-sm text-ivory font-black text-right">{value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-wrap items-center justify-center gap-5 mt-10"
                  >
                    <Button
                      variant="ghost"
                      onClick={() => { resetModal(); setShowModal(true); }}
                      className="h-14 px-8 rounded-2xl"
                    >
                      NEW PAYMENT
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => { setShowModal(false); resetModal(); }}
                      className="h-14 px-8 rounded-2xl"
                    >
                      DONE
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Modal>

        {/* ── Discount Confirmation Dialog ── */}
        <ConfirmDialog
          isOpen={showDiscountConfirm}
          onClose={() => { setShowDiscountConfirm(false); setPendingPayload(null); }}
          onConfirm={async () => {
            setShowDiscountConfirm(false);
            if (pendingPayload) await handleGeneratePayment(pendingPayload);
            setPendingPayload(null);
          }}
          title="Large Discount Warning"
          message="This payment is more than 50% below the standard plan price. Are you sure you want to proceed with this custom amount?"
          confirmLabel="Yes, Proceed"
          confirmVariant="danger"
        />

        {/* ── Duplicate Subscription Warning Modal ── */}
        <Modal
          isOpen={showDuplicateWarning}
          onClose={() => { setShowDuplicateWarning(false); setDuplicateWarningData(null); }}
          title="Active Subscription Detected"
          subtitle="Duplicate Payment Warning"
          maxWidth="max-w-md"
          variant="destructive"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-400 leading-relaxed text-center">
              This member already has an active membership. Creating another payment may overlap their current billing cycle.
            </p>

            <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4 border border-white/[0.06]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Plan</span>
                <span className="text-sm font-black text-earth-clay">{duplicateWarningData?.currentPlan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</span>
                <span className="text-xs font-bold text-ivory">
                  {duplicateWarningData?.expiresAt ? new Date(duplicateWarningData.expiresAt).toLocaleDateString('en-IN', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remaining Time</span>
                <span className="text-xs font-black px-2 py-1 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                  {duplicateWarningData?.remainingDays} Days Left
                </span>
              </div>
            </div>

            <p className="text-xs text-center font-bold text-slate-300">
              Do you want to continue anyway?
            </p>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => { setShowDuplicateWarning(false); setDuplicateWarningData(null); }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setShowDuplicateWarning(false);
                  handleGeneratePayment({ ...pendingPayload, overrideExistingSubscription: true });
                }}
                className="flex-1"
              >
                Yes, Continue
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Payments;
