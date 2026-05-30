import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LifeBuoy, AlertTriangle, Clock, CheckCircle2, Search, Filter } from 'lucide-react';
import { Card, Table, TableRow, StatusBadge } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import toast from 'react-hot-toast';

const SupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, OPEN, CRITICAL, RESOLVED
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/support/admin/tickets');
      setTickets(data);
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'OPEN' && t.status !== 'OPEN') return false;
    if (filter === 'CRITICAL' && t.priority !== 'CRITICAL') return false;
    if (filter === 'RESOLVED' && t.status !== 'RESOLVED') return false;
    
    if (search) {
      const q = search.toLowerCase();
      return t.gym_name?.toLowerCase().includes(q) || t.title.toLowerCase().includes(q);
    }
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'NORMAL': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'LOW': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 lg:space-y-8 max-w-screen-2xl mx-auto pb-safe-area">
        
        {/* Header */}
        <FadeIn direction="down" duration={0.4}>
          <div className="page-header shadow-xl">
            <div className="page-header-meta">
              <div className="flex items-center gap-3">
                <LifeBuoy className="text-earth-clay w-5 h-5" />
                <span className="label-text">Support Management</span>
              </div>
              <h1 className="page-title text-ivory">
                Enterprise <span className="text-earth-clay italic">Helpdesk</span>
              </h1>
              <p className="body-text text-sm opacity-70">
                Manage and resolve tickets from branch administrators.
              </p>
            </div>

            <div className="flex gap-2">
              {['ALL', 'OPEN', 'CRITICAL', 'RESOLVED'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                    filter === f 
                      ? 'bg-earth-clay text-white shadow-lg shadow-earth-clay/20' 
                      : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Tickets Table */}
        <FadeIn direction="up" delay={0.2} duration={0.4}>
          <Card variant="flat" className="p-0 overflow-hidden shadow-xl">
            <div className="p-6 lg:p-8 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Filter size={18} className="text-earth-clay" />
                <h3 className="label-text !text-ivory">Ticket Inbox</h3>
              </div>
              <div className="relative w-64 lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search gym or issue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-6 text-white text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-earth-clay/30"
                />
              </div>
            </div>

            <Table
              isLoading={loading}
              headers={[
                { label: 'Issue', className: 'flex-[2]' },
                { label: 'Gym/Branch', className: 'flex-1' },
                { label: 'Priority', className: 'w-24' },
                { label: 'Status', className: 'w-32' },
                { label: 'Time', className: 'w-32 text-right' }
              ]}
              emptyMessage="No tickets found matching your criteria."
              emptyIcon={CheckCircle2}
            >
              {filteredTickets.map(t => (
                <TableRow 
                  key={t.id} 
                  className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => navigate(`/super-admin/support/tickets/${t.id}`)}
                >
                  <div className="flex-[2] flex flex-col min-w-0 pr-4">
                    <p className="text-sm font-black text-ivory truncate">{t.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                      {t.type}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 pr-4">
                    <p className="text-xs font-black text-slate-300 truncate">{t.gym_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold truncate">{t.location}</p>
                  </div>
                  <div className="w-24">
                    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="w-32">
                    <StatusBadge status={t.status === 'IN_PROGRESS' ? 'PENDING' : t.status === 'RESOLVED' ? 'ACTIVE' : 'SUSPENDED'} customLabel={t.status.replace('_', ' ')} />
                  </div>
                  <div className="w-32 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
                    <Clock size={12} />
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </TableRow>
              ))}
            </Table>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  );
};

export default SupportDashboard;
