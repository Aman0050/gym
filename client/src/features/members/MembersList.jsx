import React, { useState } from 'react';
import {
  Search, Plus, User, Phone, Calendar,
  Download, Activity, Trash2, Edit2, AlertCircle,
  Database, UserCheck, Users,
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
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    emergency_contact: '',
    blood_group: '',
  });

  // ── Fetch Members ──
  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/members');
      return res.data;
    },
    staleTime: 30_000,
  });

  const members = data?.members || [];
  const pagination = data?.pagination || { total: 0 };

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

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
  );

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">

        {/* ── Page Header ── */}
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
              <p className="body-text text-sm opacity-70">
                {pagination.total} member profiles in your branch.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:flex items-center gap-3">
              <Button variant="secondary" icon={Download} className="flex-1 lg:flex-none">
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
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                size={15}
              />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12 !py-4 text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.07] px-5 py-3 rounded-2xl">
                <Database size={14} className="text-earth-clay" />
                <span className="label-text !text-ivory !text-[9px]">
                  {pagination.total} Members
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ── Members Table ── */}
        <FadeIn delay={0.15} duration={0.4}>
          <Card variant="flat" className="p-0 overflow-hidden shadow-xl">
            <Table
              isLoading={isLoading && members.length === 0}
              headers={[
                { label: 'Member',      className: 'flex-[2]' },
                { label: 'Status',      className: 'flex-1' },
                { label: 'Plan',        className: 'flex-1' },
                { label: 'Joined',      className: 'flex-1' },
                { label: 'Actions',     className: 'w-24 text-right' },
              ]}
              emptyMessage="No members found. Add your first member to get started."
              emptyIcon={<Users size={24} className="text-slate-600" />}
            >
              {isLoading && members.length === 0 ? (
                <div className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4].map((i) => <TableRowSkeleton key={i} />)}
                </div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <TableRow
                    key={m.id}
                    className={m.status === 'PENDING' ? 'opacity-60 animate-pulse' : ''}
                  >
                    {/* Member Name + Phone */}
                    <Link
                      to={m.id.startsWith('temp-') ? '#' : `/members/profile/${m.id}`}
                      className="flex-[2] flex items-center gap-4 py-1 group/link"
                    >
                      <div className="w-10 h-10 bg-white/[0.04] rounded-xl flex items-center justify-center border border-white/[0.07] group-hover/link:border-earth-clay/30 group-hover/link:bg-earth-clay/5 transition-all duration-300 flex-shrink-0">
                        <User
                          size={17}
                          className="text-slate-500 group-hover/link:text-earth-clay transition-colors"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-ivory group-hover/link:text-earth-clay transition-colors leading-tight truncate">
                          {m.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone size={11} className="text-slate-600 flex-shrink-0" />
                          <p className="text-[11px] text-slate-500 font-medium tracking-wide truncate">
                            {formatPhone(m.phone)}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Status */}
                    <div className="flex-1 flex items-center mt-3 lg:mt-0">
                      <StatusBadge status={m.status || 'ACTIVE'} />
                    </div>

                    {/* Plan */}
                    <div className="flex-1 hidden md:flex items-center gap-2 mt-3 lg:mt-0">
                      <Activity size={13} className="text-earth-clay flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide truncate">
                        {m.plan_name || 'No Plan'}
                      </span>
                    </div>

                    {/* Join Date */}
                    <div className="flex-1 flex items-center mt-3 lg:mt-0">
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {new Date(m.join_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="w-full lg:w-24 flex justify-end gap-2 mt-4 lg:mt-0 border-t border-white/[0.04] pt-3 lg:border-none lg:pt-0">
                      <button
                        className="w-9 h-9 text-slate-500 hover:text-earth-clay hover:bg-white/[0.06] rounded-xl transition-all border border-transparent hover:border-white/[0.06] flex items-center justify-center"
                        disabled={m.status === 'PENDING'}
                        title="Edit member"
                        aria-label="Edit member"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="w-9 h-9 text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] rounded-xl transition-all border border-transparent hover:border-red-500/20 flex items-center justify-center"
                        disabled={m.status === 'PENDING'}
                        title="Delete member"
                        aria-label="Delete member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableRow>
                ))
              ) : null}
            </Table>
          </Card>
        </FadeIn>

        {/* ── Enrollment Modal ── */}
        <Modal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setNewMember({ name: '', phone: '', emergency_contact: '', blood_group: '' }); }}
          title="Register New Member"
          subtitle="Member will be synced across all branches"
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleAddMember} className="space-y-6">
            <Input
              label="Full Name"
              placeholder="e.g. Arjun Sharma"
              icon={User}
              required
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Phone Number"
                placeholder="9876543210"
                icon={Phone}
                required
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              />
              <Input
                label="Blood Group"
                placeholder="O+ / AB-"
                icon={Activity}
                value={newMember.blood_group}
                onChange={(e) => setNewMember({ ...newMember, blood_group: e.target.value })}
              />
            </div>

            <Input
              label="Emergency Contact"
              placeholder="Name / Phone Number"
              icon={AlertCircle}
              value={newMember.emergency_contact}
              onChange={(e) => setNewMember({ ...newMember, emergency_contact: e.target.value })}
            />

            <div className="bg-earth-clay/5 border border-earth-clay/10 p-5 rounded-2xl flex items-start gap-4">
              <UserCheck size={18} className="text-earth-clay flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                New member profiles are immediately available for plan enrollment and attendance tracking.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                loading={enrollMutation.isPending}
              >
                Save Member
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default MembersList;
