import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Building2, Plus, Search, ShieldCheck, ShieldAlert, Globe, Activity, KeyRound, AtSign, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, Button, StatusBadge, Table, TableRow, Modal, Input } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { safeString } from '../utils/safeString';
import { searchMatch } from '../utils/searchMatch';

// Auto-suggest gym_id from branch name: "FitXeno Downtown" → "fitxeno-downtown"
const slugifyBranchName = (name) =>
  safeString(name)
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30);

const Gyms = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  // Step 1 state
  const [newGym, setNewGym] = useState({ name: '', phone: '', address: '', saas_valid_until: '' });

  // Step 2 state
  const [step, setStep] = useState(1);
  const [createdBranch, setCreatedBranch] = useState(null); // { id, name }
  const [gymIdInput, setGymIdInput] = useState('');
  const [gymIdStatus, setGymIdStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [credErrors, setCredErrors] = useState({});
  const [creatingAccount, setCreatingAccount] = useState(false);

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/gyms');
      setGyms(response.data);
    } catch (error) {
      toast.error('Failed to load branch directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGyms(); }, [fetchGyms]);

  // Debounced gym_id availability check
  const checkAvailability = useCallback(async (value) => {
    if (!value || value.trim().length < 3) { setGymIdStatus(null); return; }
    setGymIdStatus('checking');
    try {
      const res = await api.get(`/gyms/check-id?gym_id=${encodeURIComponent(value.trim())}`);
      setGymIdStatus(res.data.available ? 'available' : 'taken');
    } catch {
      setGymIdStatus(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkAvailability(gymIdInput), 500);
    return () => clearTimeout(timer);
  }, [gymIdInput, checkAvailability]);

  // Step 1: Create branch
  const handleCreateGym = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/gyms', newGym);
      const branch = res.data;
      setCreatedBranch(branch);
      // Auto-suggest gym_id from branch name
      setGymIdInput(slugifyBranchName(branch.name));
      setStep(2);
      toast.success('Branch created! Now set up login credentials.');
    } catch (error) {
      toast.error('Error creating branch');
    }
  };

  // Step 2: Create credentials
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!gymIdInput || gymIdInput.trim().length < 3) errors.gymId = 'Gym ID must be at least 3 characters';
    if (gymIdStatus === 'taken') errors.gymId = 'This Gym ID is already taken';
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) { setCredErrors(errors); return; }
    setCredErrors({});
    setCreatingAccount(true);

    try {
      await api.post('/gyms/create-account', {
        branch_id: createdBranch.id,
        gym_id: (gymIdInput || '').trim().toLowerCase(),
        password,
      });
      toast.success(`Account created! Login with Gym ID: ${(gymIdInput || '').trim().toLowerCase()}`);
      closeModal();
      fetchGyms();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create account';
      if ((msg || '').toLowerCase().includes('taken') || (msg || '').toLowerCase().includes('unique')) {
        setCredErrors({ gymId: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setStep(1);
    setCreatedBranch(null);
    setNewGym({ name: '', phone: '', address: '', saas_valid_until: '' });
    setGymIdInput('');
    setGymIdStatus(null);
    setPassword('');
    setConfirmPassword('');
    setCredErrors({});
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/gyms/${id}/status`, { status });
      fetchGyms();
      toast.success(`Branch status updated to ${status}`);
    } catch (error) {
      toast.error('Error updating branch status');
    }
  };

  const filteredGyms = (gyms || []).filter(gym =>
    searchMatch(searchTerm, gym?.name, gym?.phone)
  );

  // Gym ID status icon
  const GymIdStatusIcon = () => {
    if (gymIdStatus === 'checking') return <Loader2 size={14} className="text-slate-400 animate-spin" />;
    if (gymIdStatus === 'available') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (gymIdStatus === 'taken') return <XCircle size={14} className="text-red-400" />;
    return null;
  };

  return (
    <PageTransition>
      <div className="space-y-8 lg:space-y-12 max-w-screen-2xl mx-auto pb-safe-area">
        <FadeIn direction="down">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10 aura-glass p-8 lg:p-12 border-white/5 shadow-2xl">
            <div className="space-y-3 lg:space-y-4 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start space-x-3 lg:space-x-4">
                <div className="w-2.5 h-2.5 rounded-full bg-earth-clay shadow-[0_0_12px_rgba(160,82,45,1)]" />
                <span className="label-text">Branch Administration</span>
              </div>
              <h1 className="page-title text-ivory">
                Manage <span className="text-earth-clay italic">Branches</span>
              </h1>
              <p className="body-text !text-[10px] lg:!text-sm opacity-60">Manage and monitor independent fitness locations across your network.</p>
            </div>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
              className="py-6 px-12 shadow-2xl text-[10px]"
            >
              Add New Branch
            </Button>
          </div>
        </FadeIn>

        <Card className="p-0 overflow-hidden border-white/5 shadow-2xl">
          <div className="p-6 lg:p-8 border-b border-white/5 bg-white/2 flex flex-col md:flex-row gap-6 lg:gap-8 items-center justify-between">
            <div className="flex items-center space-x-4 self-start md:self-auto">
               <Globe size={18} className="text-earth-clay" />
               <h3 className="label-text !text-ivory !text-sm sm:!text-base">Active Branch Directory</h3>
            </div>
            <div className="relative w-full md:w-64 lg:w-80 flex-shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl py-3.5 pl-11 pr-6 text-white text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner"
              />
            </div>
          </div>

          <Table
            headers={[
              { label: 'Branch Identity', className: 'flex-[2]' },
              { label: 'Primary Contact', className: 'flex-1' },
              { label: 'Subscription', className: 'flex-1' },
              { label: 'Valid Until', className: 'flex-1' },
              { label: 'Actions', className: 'w-24 text-right' }
            ]}
            isLoading={loading}
            emptyMessage="No branches found in your network."
            emptyIcon={Building2}
          >
            {filteredGyms.map((gym) => (
                <TableRow 
                  key={gym.id} 
                  className="gap-6 lg:gap-0 cursor-pointer"
                  onClick={() => navigate(`/super-admin/branches/${gym.id}`)}
                >
                  <div className="flex-[2] flex items-center space-x-6">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      <Building2 size={18} className="text-earth-clay lg:w-5 lg:h-5" />
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-black text-ivory tracking-tight">{gym.name}</p>
                      <p className="text-[8px] lg:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">{gym.address || 'Network Default'}</p>
                    </div>
                  </div>
                  <div className="flex-1 border-l-2 border-white/5 pl-6 lg:border-none lg:pl-0">
                    <p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">{gym.phone}</p>
                  </div>
                  <div className="flex-1">
                    <StatusBadge status={gym.saas_subscription_status} />
                  </div>
                  <div className="flex-1 text-[9px] lg:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {gym.saas_valid_until ? new Date(gym.saas_valid_until).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="w-full lg:w-24 text-right flex items-center justify-between lg:justify-end border-t border-white/5 pt-4 lg:border-none lg:pt-0">
                    <span className="lg:hidden text-[7px] font-black text-slate-600 uppercase tracking-widest">Actions</span>
                    {gym.saas_subscription_status === 'ACTIVE' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(gym.id, 'SUSPENDED');
                        }}
                        className="p-3 text-slate-500 hover:text-red-500 hover:bg-white/5 rounded-xl lg:rounded-2xl transition-all border border-transparent shadow-lg"
                        title="Suspend Branch"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(gym.id, 'ACTIVE');
                        }}
                        className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-white/5 rounded-xl lg:rounded-2xl transition-all border border-transparent shadow-lg"
                        title="Restore Branch"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                  </div>
                </TableRow>
              ))}
          </Table>
        </Card>

        {/* ── Two-Step Modal ── */}
        <Modal
          isOpen={showAddModal}
          onClose={closeModal}
          title={step === 1 ? 'Create New Branch' : 'Create Gym Credentials'}
          subtitle={step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
          maxWidth="max-w-xl"
        >
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all duration-300 ${
                  step === s
                    ? 'bg-earth-clay/15 border-earth-clay/40 text-earth-clay'
                    : step > s
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/[0.03] border-white/[0.07] text-slate-600'
                }`}>
                  {step > s
                    ? <CheckCircle2 size={12} />
                    : s === 1 ? <Building2 size={12} /> : <KeyRound size={12} />
                  }
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {s === 1 ? 'Branch' : 'Credentials'}
                  </span>
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-px transition-all duration-500 ${step > 1 ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Branch Form ── */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleCreateGym}
                className="space-y-10"
              >
                <div className="space-y-8">
                  <Input
                    label="Branch Name"
                    placeholder="e.g. FitXeno Downtown"
                    required
                    value={newGym.name}
                    onChange={(e) => setNewGym({ ...newGym, name: e.target.value })}
                  />
                  <Input
                    label="Contact Phone"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    required
                    value={newGym.phone}
                    onChange={(e) => {
                      let raw = e.target.value;
                      if (raw.startsWith('+91 ')) raw = raw.substring(4);
                      else if (raw.startsWith('+91')) raw = raw.substring(3);
                      let val = raw.replace(/\D/g, '');
                      if (val.length > 10 && val.startsWith('91')) val = val.substring(2);
                      if (val.length > 10) val = val.substring(0, 10);
                      let formatted = '';
                      if (val.length > 0) {
                        formatted = '+91 ' + val.substring(0, 5);
                        if (val.length > 5) formatted += ' ' + val.substring(5);
                      }
                      setNewGym({ ...newGym, phone: formatted });
                    }}
                  />
                  <div className="space-y-3">
                    <label className="label-text ml-2">Location Address</label>
                    <textarea
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-ivory text-sm font-bold focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner h-24 placeholder:text-slate-600"
                      placeholder="Enter branch address..."
                      value={newGym.address}
                      onChange={(e) => setNewGym({ ...newGym, address: e.target.value })}
                    />
                  </div>
                  <Input
                    label="Subscription Expiry (Optional)"
                    type="date"
                    value={newGym.saas_valid_until}
                    onChange={(e) => setNewGym({ ...newGym, saas_valid_until: e.target.value })}
                  />
                </div>

                <div className="bg-earth-clay/5 p-8 rounded-3xl border border-earth-clay/10 flex items-start space-x-6">
                  <Activity size={20} className="text-earth-clay mt-1" />
                  <p className="text-sm font-semibold text-ivory">After saving the branch, you'll set up login credentials in the next step.</p>
                </div>

                <div className="flex gap-6 mt-12">
                  <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancel</Button>
                  <Button type="submit" variant="primary" className="flex-1 shadow-2xl">
                    Save Branch →
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ── STEP 2: Credentials Form ── */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleCreateAccount}
                className="space-y-8"
              >
                {/* Branch success badge */}
                <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-emerald-400">
                    Branch <span className="font-black text-ivory">{createdBranch?.name}</span> created successfully
                  </p>
                </div>

                {/* Gym ID */}
                <div className="space-y-2.5">
                  <label className="label-text ml-1 flex items-center gap-2">
                    <AtSign size={13} className="text-earth-clay" />
                    Gym ID (Login Username)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={gymIdInput}
                      onChange={(e) => {
                        const val = (e.target.value || '').toLowerCase().replace(/[^a-z0-9\-_]/g, '');
                        setGymIdInput(val);
                        setCredErrors((p) => ({ ...p, gymId: undefined }));
                      }}
                      placeholder="e.g. fitxeno-downtown"
                      className={`input-field pr-10 ${credErrors.gymId ? 'border-red-500/50' : gymIdStatus === 'available' ? 'border-emerald-500/40' : gymIdStatus === 'taken' ? 'border-red-500/40' : ''}`}
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <GymIdStatusIcon />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    {credErrors.gymId
                      ? <p className="text-[10px] font-semibold text-red-400">{credErrors.gymId}</p>
                      : gymIdStatus === 'available'
                      ? <p className="text-[10px] font-semibold text-emerald-400">✓ Available</p>
                      : gymIdStatus === 'taken'
                      ? <p className="text-[10px] font-semibold text-red-400">✗ Already taken</p>
                      : <p className="text-[10px] text-slate-600">Only lowercase letters, numbers, hyphens</p>
                    }
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2.5">
                  <label className="label-text ml-1 flex items-center gap-2">
                    <Lock size={13} className="text-earth-clay" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setCredErrors((p) => ({ ...p, password: undefined })); }}
                      placeholder="Min 6 characters"
                      className={`input-field pr-10 ${credErrors.password ? 'border-red-500/50' : ''}`}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-earth-clay transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {credErrors.password && <p className="text-[10px] font-semibold text-red-400 px-1">{credErrors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2.5">
                  <label className="label-text ml-1 flex items-center gap-2">
                    <Lock size={13} className="text-earth-clay" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setCredErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                      placeholder="Re-enter password"
                      className={`input-field pr-10 ${credErrors.confirmPassword ? 'border-red-500/50' : confirmPassword && confirmPassword === password ? 'border-emerald-500/40' : ''}`}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-earth-clay transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {credErrors.confirmPassword && <p className="text-[10px] font-semibold text-red-400 px-1">{credErrors.confirmPassword}</p>}
                  {confirmPassword && confirmPassword === password && !credErrors.confirmPassword && (
                    <p className="text-[10px] font-semibold text-emerald-400 px-1">✓ Passwords match</p>
                  )}
                </div>

                {/* Security note */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 flex items-start gap-3">
                  <KeyRound size={14} className="text-earth-clay flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Passwords are hashed using bcrypt and never stored in plain text. The gym will use their <span className="text-ivory font-black">Gym ID</span> to log in.
                  </p>
                </div>

                <div className="flex gap-6 mt-4">
                  <Button variant="secondary" className="flex-1" onClick={closeModal}>Skip for now</Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1 shadow-2xl"
                    loading={creatingAccount}
                  >
                    Create Account
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Gyms;
