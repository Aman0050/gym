import React, { useState } from 'react';
import {
  Search, Plus, User, Phone, Calendar,
  Download, Activity, Trash2, Edit2, AlertCircle,
  Database, UserCheck, Users, CreditCard, RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Card, Button, Input, Table, TableRow, StatusBadge, Modal,
} from '../../components/ui';
import { FadeIn, PageTransition } from '../../components/Animations';
import { TableRowSkeleton } from '../../components/Skeleton';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MemberExportModal from './MemberExportModal';

const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  if (cleaned.length === 12 && cleaned.startsWith('91'))
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  return phone.startsWith('+') ? phone : `+${phone}`;
};

const MembersList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    emergency_contact: '',
    blood_group: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['members', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const res = await api.get('/members', {
        params: { search: debouncedSearch, status: statusFilter, page, limit }
      });
      return res.data;
    },
    keepPreviousData: true,
  });

  const members = data?.members || [];
  const total = data?.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const toggleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const toggleSelectMember = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleExport = async (format = 'csv') => {
    try {
      const res = await api.get('/members/export', {
        params: { format, status: statusFilter },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FitVibe_Members_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  // ── Optimistic Enrollment ──
  const enrollMutation = useMutation({
    mutationFn: (newMember) => api.post('/members', newMember),
    onMutate: async (newMember) => {
      await queryClient.cancelQueries({ queryKey: ['members'] });
      const previousMembers = queryClient.getQueryData(['members']);

      queryClient.setQueryData(['members'], (old) => ({
        ...old,
        members: [
          {
            ...newMember,
            id: `temp-${Date.now()}`,
            join_date: new Date().toISOString(),
            status: 'PENDING',
          },
          ...(old?.members || []),
        ],
      }));

      return { previousMembers };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['members'], context.previousMembers);
      toast.error(err.response?.data?.error || 'Enrollment failed. Please try again.');
    },
    onSuccess: () => {
      toast.success('Member enrolled successfully');
      setShowAddModal(false);
      setNewMember({ name: '', phone: '', emergency_contact: '', blood_group: '' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name.trim() || !newMember.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }
    enrollMutation.mutate(newMember);
  };

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">
        <BulkActionModal 
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          selectedIds={selectedMembers}
          onComplete={() => {
            setSelectedMembers([]);
            queryClient.invalidateQueries({ queryKey: ['members'] });
          }}
        />

        <FadeIn direction="down" duration={0.4}>
          <div className="page-header shadow-xl">
            <div className="page-header-meta">
              <div className="flex items-center gap-3">
                <span className="status-dot-live" />
                <span className="label-text">Member Directory</span>
              </div>
              <h1 className="page-title text-ivory">
                Member{' '}
                <span className="text-earth-clay italic">Management</span>
              </h1>
            </div>

            <div className="grid grid-cols-2 lg:flex items-center gap-3">
              <Button 
                variant="secondary" 
                icon={Download} 
                className="flex-1 lg:flex-none"
                onClick={() => setShowExportModal(true)}
              >
                Export
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowAddModal(true)}
                className="flex-1 lg:flex-none"
              >
                Add Member
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* ── Search & Stats Bar ── */}
        <FadeIn delay={0.08} duration={0.4}>
          <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-center">
            <div className="relative flex-1 max-w-2xl group">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-earth-clay transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-14 !py-4.5 text-sm w-full bg-white/[0.04] border-white/[0.07] hover:border-white/10"
              />
            </div>

            <div className="flex items-center gap-3 h-full">
              <div className="flex flex-col justify-center bg-white/[0.04] border border-white/[0.07] px-6 py-3 rounded-2xl min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={12} className="text-earth-clay" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Database</span>
                </div>
                <span className="text-lg font-black text-ivory leading-none">
                  {pagination.total} <span className="text-[10px] text-slate-600 ml-1">Members</span>
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Selection Summary (Bulk Actions) ── */}
        <AnimatePresence>
          {selectedMembers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-earth-clay/10 border border-earth-clay/30 p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-black text-ivory uppercase tracking-widest">
                  {selectedMembers.length} Members Selected
                </span>
                <div className="w-px h-4 bg-white/10" />
                <button className="text-[10px] font-black text-slate-400 hover:text-ivory uppercase tracking-widest transition-colors">
                  Send Message
                </button>
                <button className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest transition-colors">
                  Bulk Delete
                </button>
              </div>
              <button 
                onClick={() => setSelectedMembers([])}
                className="text-[10px] font-black text-slate-500 hover:text-ivory uppercase tracking-widest"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Members Table ── */}
        <div className="relative">
          <Table
            headers={[
              { label: <input type="checkbox" onChange={toggleSelectAll} checked={selectedMembers.length === members.length && members.length > 0} className="rounded border-white/10 bg-white/5" />, className: 'w-12' },
              { label: 'Member',      className: 'flex-[2]' },
              { label: 'Status',      className: 'flex-1' },
              { label: 'Plan',        className: 'flex-1 hidden xl:flex' },
              { label: 'Joined',      className: 'flex-1 hidden md:flex' },
              { label: 'Quick Actions', className: 'w-48 text-right' },
            ]}
            isLoading={isLoading}
            emptyMessage="No Members Found"
            emptyDescription="Your member directory is currently empty. Start by enrolling your first member to unlock attendance and revenue tracking."
            emptyIcon={Users}
            emptyAction={
              <Button 
                variant="primary" 
                icon={Plus} 
                onClick={() => navigate('/members/create')}
              >
                Enroll First Member
              </Button>
            }
          >
            {members.map((m) => (
              <TableRow
                key={m.id}
                isSelected={selectedMembers.includes(m.id)}
                onClick={() => toggleSelectMember(m.id)}
              >
                {/* Selection Checkbox */}
                <input 
                  type="checkbox" 
                  checked={selectedMembers.includes(m.id)} 
                  onChange={() => toggleSelectMember(m.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-white/10 bg-white/5 checked:bg-earth-clay"
                />

                {/* Member Name + Phone */}
                <Link
                  to={`/members/profile/${m.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-4 group/link"
                >
                  <div className="w-9 h-9 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07] group-hover/link:border-earth-clay/30 transition-all">
                    <User size={15} className="text-slate-500 group-hover/link:text-earth-clay" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-ivory group-hover/link:text-earth-clay transition-colors leading-tight truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{m.phone}</p>
                  </div>
                </Link>

                {/* Status */}
                <StatusBadge status={m.status || 'ACTIVE'} />

                {/* Plan */}
                <div className="hidden xl:flex items-center gap-2">
                  <Activity size={12} className="text-earth-clay" />
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                    {m.plan_name || 'No Plan'}
                  </span>
                </div>

                {/* Joined */}
                <span className="hidden md:block text-[11px] text-slate-500 font-semibold">
                  {new Date(m.join_date).toLocaleDateString()}
                </span>

                {/* Quick Actions */}
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="w-8 h-8 text-emerald-400 hover:bg-emerald-500/[0.08] rounded-lg transition-all border border-emerald-500/10 flex items-center justify-center"
                    onClick={() => navigate('/payments', { state: { memberId: m.id, autoOpen: true } })}
                  >
                    <CreditCard size={13} />
                  </button>
                  <button
                    className="w-8 h-8 text-earth-clay hover:bg-earth-clay/10 rounded-lg transition-all border border-earth-clay/10 flex items-center justify-center"
                    onClick={() => navigate('/payments', { state: { memberId: m.id, planId: m.plan_id, autoOpen: true, isRenewal: true } })}
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button className="w-8 h-8 text-slate-500 hover:text-earth-clay hover:bg-white/[0.06] rounded-lg transition-all flex items-center justify-center">
                    <Edit2 size={13} />
                  </button>
                </div>
              </TableRow>
            ))}
          </Table>

          {/* ── Enterprise Pagination Footer ── */}
          <div className="mt-6 flex items-center justify-between bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Showing {members.length} of {total} Members
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-500 disabled:opacity-20 hover:text-ivory transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-2 bg-white/[0.05] rounded-xl text-[10px] font-black text-ivory">
                Page {page} / {totalPages || 1}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-500 disabled:opacity-20 hover:text-ivory transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Enrollment Modal ── */}
        <Modal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setNewMember({ name: '', phone: '', emergency_contact: '', blood_group: '' }); }}
          title="Register New Member"
          subtitle="Enterprise Fast-Enrollment System"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleAddMember} className="space-y-7">
            <div className="space-y-5">
              <div className="relative group">
                <Input
                  label="Full Name"
                  placeholder="e.g. Arjun Sharma"
                  icon={User}
                  required
                  autoFocus
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="!py-4"
                />
                {newMember.name.length > 2 && (
                  <UserCheck size={16} className="absolute right-4 top-10 text-emerald-400" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="relative">
                  <Input
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    icon={Phone}
                    required
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => {
                      // Auto-format phone input
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 10 && val.startsWith('91')) val = val.substring(2);
                      if (val.length > 10) val = val.substring(0, 10);
                      
                      let formatted = val;
                      if (val.length > 0) {
                        formatted = '+91 ' + val.substring(0, 5);
                        if (val.length > 5) formatted += ' ' + val.substring(5);
                      }
                      
                      setNewMember({ ...newMember, phone: formatted || e.target.value });
                    }}
                    className="!py-4 font-medium tracking-wide"
                  />
                  {newMember.phone.length >= 14 && (
                    <UserCheck size={16} className="absolute right-4 top-10 text-emerald-400" />
                  )}
                </div>
                <Input
                  label="Blood Group"
                  placeholder="O+ / AB-"
                  icon={Activity}
                  value={newMember.blood_group}
                  onChange={(e) => setNewMember({ ...newMember, blood_group: e.target.value.toUpperCase().replace(/[^A-BO+-]/g, '').substring(0, 3) })}
                  className="!py-4 font-black uppercase tracking-widest text-center"
                />
              </div>

              <Input
                label="Emergency Contact"
                placeholder="Name / Phone Number"
                icon={AlertCircle}
                value={newMember.emergency_contact}
                onChange={(e) => setNewMember({ ...newMember, emergency_contact: e.target.value })}
                className="!py-4"
              />
            </div>

            <div className="bg-earth-clay/5 border border-earth-clay/10 p-5 rounded-2xl flex items-start gap-4">
              <Zap size={18} className="text-earth-clay flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Smart Form Active. Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] text-slate-300">Enter</kbd> to submit. Profiles are immediately synced to the global network.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="flex-1 !py-4"
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-[2] !py-4 shadow-xl shadow-earth-clay/20 text-lg"
                loading={enrollMutation.isPending}
              >
                Launch Profile
              </Button>
            </div>
          </form>
        </Modal>

        {/* ── Export Modal ── */}
        <MemberExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          totalMembers={pagination.total}
        />
      </div>
    </PageTransition>
  );
};

export default MembersList;
