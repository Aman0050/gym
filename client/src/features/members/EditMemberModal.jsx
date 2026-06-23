import React, { useState, useEffect } from 'react';
import { User, Phone, Activity, AlertCircle, Save, Hash } from 'lucide-react';
import { Modal, Input, Select, Button, PriorityBadge } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const EditMemberModal = ({ isOpen, onClose, member }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    slip_number: '',
    aadhaar_number: '',
    status: 'ACTIVE'
  });

  // Pre-fill form when modal opens with a selected member
  useEffect(() => {
    if (member && isOpen) {
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        slip_number: member.slip_number || '',
        aadhaar_number: member.aadhaar_number || '',
        status: member.status || 'ACTIVE'
      });
    }
  }, [member, isOpen]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await api.put(`/members/${member.id}`, updatedData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Member profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update member profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name, Phone and Slip Number are required');
      return;
    }
    if (formData.aadhaar_number && formData.aadhaar_number.length !== 12) {
      toast.error('Aadhaar number must be exactly 12 digits');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handlePhoneChange = (e) => {
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
    setFormData({ ...formData, phone: formatted });
  };

  const hasChanges = member && (
    formData.name !== (member.name || '') ||
    formData.phone !== (member.phone || '') ||
    formData.slip_number !== (member.slip_number || '') ||
    formData.aadhaar_number !== (member.aadhaar_number || '') ||
    formData.status !== (member.status || 'ACTIVE')
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Member Profile"
      subtitle={member ? `MEMBER ID: ${member.id.substring(0, 8).toUpperCase()}` : ''}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 mt-2">
        <div className="space-y-5">
          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Arjun Sharma"
            required
            className="!py-4 text-ivory font-medium"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Phone Number"
              icon={Phone}
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="+91 98765 43210"
              required
              className="!py-4 font-medium tracking-wide text-ivory"
            />
            <Input
              label="SLIP NUMBER"
              icon={Hash}
              required
              value={formData.slip_number}
              onChange={(e) => setFormData({ ...formData, slip_number: e.target.value })}
              placeholder="Enter Slip Number"
              className="!py-4 font-medium tracking-wide text-ivory"
            />
          </div>

          <Input
            label="AADHAAR NUMBER (OPTIONAL)"
            icon={AlertCircle}
            value={formData.aadhaar_number}
            onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/[^0-9]/g, '').substring(0, 12) })}
            placeholder="Enter Aadhaar Number"
            className="!py-4 text-ivory font-medium tracking-widest"
          />

          <Select
            label="Account Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="!py-4 font-black uppercase tracking-wider text-earth-clay"
          >
            <option value="ACTIVE">Active / Clear</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended / Alert</option>
          </Select>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-3 p-4 bg-earth-clay/10 border border-earth-clay/20 rounded-2xl">
            <PriorityBadge level="WARNING" className="flex-shrink-0" />
            <p className="text-xs text-earth-clay font-medium leading-relaxed">
              You have unsaved changes. Profile changes are logged in the audit trail.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-6 border-t border-white/[0.05]">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 !py-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={!hasChanges}
            loading={updateMutation.isPending}
            className="flex-[2] !py-4 shadow-xl"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditMemberModal;
