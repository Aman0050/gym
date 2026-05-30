import React, { memo } from 'react';
import { CreditCard, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '../../components/ui';

const ActionButton = ({ icon: Icon, onClick, className, tooltip }) => {
  return (
    <Tooltip content={tooltip} position="top">
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center relative touch-target group overflow-hidden hover:scale-105 hover:shadow-[0_0_15px_currentColor] ${className}`}
      >
        <Icon size={16} className="relative z-10 transition-transform group-hover:scale-110" />
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>
    </Tooltip>
  );
};

const MemberActionRow = memo(({ member, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const handlePayment = (e) => {
    e.stopPropagation();
    navigate('/payments', { state: { memberId: member.id, autoOpen: true } });
  };

  const handleRenew = (e) => {
    e.stopPropagation();
    navigate('/payments', { 
      state: { 
        memberId: member.id, 
        planId: member.plan_id, 
        autoOpen: true, 
        isRenewal: true 
      } 
    });
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(member);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(member);
  };

  return (
    <div className="flex justify-end items-center gap-3" onClick={(e) => e.stopPropagation()}>
      <ActionButton
        icon={CreditCard}
        onClick={handlePayment}
        tooltip="Record Payment"
        className="text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 hover:border-emerald-500/20 shadow-sm"
      />
      <ActionButton
        icon={RotateCcw}
        onClick={handleRenew}
        tooltip="Renew Membership"
        className="text-earth-clay bg-earth-clay/5 hover:bg-earth-clay/15 border border-earth-clay/10 hover:border-earth-clay/20 shadow-sm"
      />
      <ActionButton
        icon={Edit2}
        onClick={handleEdit}
        tooltip="Edit Member"
        className="text-slate-400 bg-white/5 hover:bg-white/10 hover:text-ivory border border-white/5 hover:border-white/10 shadow-sm"
      />
      <ActionButton
        icon={Trash2}
        onClick={handleDelete}
        tooltip="Delete Member"
        className="text-red-400 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 shadow-sm"
      />
    </div>
  );
});

MemberActionRow.displayName = 'MemberActionRow';

export default MemberActionRow;
