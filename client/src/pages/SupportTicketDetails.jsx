import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Input, Select } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import { ArrowLeft, CheckCircle2, CircleDashed, CheckCircle, Clock, Building2, User, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const SupportTicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Route ticketId", id);
      const res = await api.get(`/support/admin/tickets/${id}`);
      console.log("Fetched ticket", res.data);
      setData(res.data);
      setStatus(res.data.ticket.status);
    } catch (err) {
      setError(true);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/support/admin/tickets/${id}`, { status: newStatus });
      toast.success('Ticket status updated');
      setStatus(newStatus);
      fetchData(); // refresh audit logs
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <CircleDashed className="animate-spin text-earth-clay w-8 h-8" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
          <CircleDashed className="text-slate-500 w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-ivory tracking-tight">Ticket not found</h2>
        <p className="text-sm text-slate-400 font-medium text-center max-w-sm">
          The support ticket you are looking for does not exist or you do not have permission to view it.
        </p>
        <Button onClick={() => navigate('/super-admin/support/tickets')} variant="secondary" className="mt-4">
          <ArrowLeft size={14} className="mr-2" /> Back to Inbox
        </Button>
      </div>
    );
  }

  const { ticket, logs } = data;

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
      <div className="space-y-6 lg:space-y-8 max-w-screen-xl mx-auto pb-safe-area">
        
        {/* Header */}
        <FadeIn direction="down" duration={0.4}>
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/super-admin/support/tickets')}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-earth-clay transition-colors"
            >
              <ArrowLeft size={16} /> Back to Inbox
            </button>
            <div className="flex gap-3">
              <Select 
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="w-40 bg-white/[0.02]"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-4 items-start mb-6">
            <div className="w-14 h-14 rounded-2xl bg-earth-clay/10 border border-earth-clay/20 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Activity className="text-earth-clay w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-ivory tracking-tight">{ticket.title}</h1>
              <div className="flex gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className="px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest bg-white/[0.05] border-white/10 text-slate-400">
                  {ticket.type}
                </span>
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <FadeIn direction="up" delay={0.1}>
              <Card>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Description</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </Card>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <Card>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Audit Log</h3>
                <div className="space-y-6">
                  {logs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-4">
                      {index !== logs.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-white/[0.05]" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.1] flex items-center justify-center flex-shrink-0 relative z-10 shadow-inner text-slate-400">
                        <Clock size={12} />
                      </div>
                      <div className="flex-1 pt-1.5 pb-2">
                        <p className="text-sm font-bold text-ivory">{log.action}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {new Date(log.created_at).toLocaleString()} {log.user_email ? `• by ${log.user_email}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FadeIn direction="left" delay={0.2}>
              <Card className="bg-obsidian border-white/[0.05]">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Gym Details</h3>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Building2 size={12}/> Branch</p>
                    <p className="text-sm font-black text-ivory">{ticket.gym_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                    <p className="text-sm font-bold text-slate-300">{ticket.location || 'N/A'}</p>
                  </div>
                  <div className="pt-4 border-t border-white/[0.05]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={12}/> Created</p>
                    <p className="text-sm font-bold text-slate-300">{new Date(ticket.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            </FadeIn>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default SupportTicketDetails;
