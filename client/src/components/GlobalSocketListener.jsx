import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Building2, AlertTriangle, LifeBuoy } from 'lucide-react';

const GlobalSocketListener = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only super admins need to listen to platform-wide support tickets
    if (user?.role !== 'SUPER_ADMIN') return;

    const handleNewTicket = (payload) => {
      console.log('Ticket notification received:', payload);
      const isCritical = payload.priority === 'CRITICAL';
      const isHigh = payload.priority === 'HIGH';

      toast.custom((t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            navigate(`/super-admin/support/tickets/${payload.ticketId}`);
          }}
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-obsidian/95 backdrop-blur-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border ${
            isCritical ? 'border-red-500/50' : isHigh ? 'border-orange-500/50' : 'border-white/[0.08]'
          } rounded-2xl pointer-events-auto flex flex-col overflow-hidden cursor-pointer group`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b flex items-center gap-3 ${
            isCritical ? 'bg-red-500/10 border-red-500/20' : isHigh ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/[0.02] border-white/[0.04]'
          }`}>
            {isCritical ? (
              <AlertTriangle className="text-red-400 w-5 h-5 animate-pulse" />
            ) : (
              <LifeBuoy className={`${isHigh ? 'text-orange-400' : 'text-blue-400'} w-5 h-5`} />
            )}
            <div className="flex-1">
              <p className="text-xs font-black text-ivory tracking-wide uppercase">
                {isCritical ? 'CRITICAL INCIDENT' : 'New Support Ticket'}
              </p>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Just now</p>
          </div>

          {/* Body */}
          <div className="p-4 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center flex-shrink-0">
              <Building2 className="text-earth-clay w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-ivory truncate">{payload.issueTitle}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium truncate">
                <span className="text-earth-clay font-bold">{payload.gymName}</span> • {payload.branchName}
              </p>
              <div className="flex gap-2 mt-3">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  isCritical ? 'bg-red-500/20 text-red-400' : isHigh ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {payload.priority}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-white/[0.05] text-slate-400">
                  {payload.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      ), { duration: isCritical ? 15000 : 10000 }); // Longer duration for critical
    };

    socket.on('SUPPORT_TICKET_CREATED', handleNewTicket);

    return () => {
      socket.off('SUPPORT_TICKET_CREATED');
    };
  }, [user, navigate]);

  return null;
};

export default GlobalSocketListener;
