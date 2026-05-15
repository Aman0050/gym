import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Building2, Plus, Search, MoreVertical, ShieldCheck, ShieldAlert, Globe, Activity } from 'lucide-react';
import { Card, Button, StatusBadge, Table, TableRow, Modal, Input, transitions } from '../components/ui';
import { FadeIn, PageTransition } from '../components/Animations';
import toast from 'react-hot-toast';

const Gyms = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGym, setNewGym] = useState({ name: '', phone: '', address: '', saas_valid_until: '' });

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/gyms');
      setGyms(response.data);
    } catch (error) {
      toast.error('Failed to load branch directory');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGym = async (e) => {
    e.preventDefault();
    try {
      await api.post('/gyms', newGym);
      setShowAddModal(false);
      setNewGym({ name: '', phone: '', address: '', saas_valid_until: '' });
      fetchGyms();
      toast.success('Branch created successfully');
    } catch (error) {
      toast.error('Error creating branch');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/gyms/${id}/status`, { status });
      fetchGyms();
      toast.success(`Branch status updated to ${status}`);
    } catch (error) {
      toast.error('Error updating branch status');
    }
  };

  const filteredGyms = gyms.filter(gym => 
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.phone.includes(searchTerm)
  );

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
                Manage <span className="text-earth-clay italic satin-shimmer inline-block">Branches</span>
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
          <div className="p-6 lg:p-8 border-b border-white/5 bg-white/2 flex flex-col md:flex-row gap-6 lg:gap-8 items-center">
            <div className="flex items-center space-x-4 self-start md:self-auto">
               <Globe size={18} className="text-earth-clay" />
               <h3 className="label-text !text-ivory">Active Branch Directory</h3>
            </div>
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-ivory text-[10px] font-black uppercase tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner"
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
          >
            {filteredGyms.length === 0 ? (
              <div className="py-24 text-center label-text !text-slate-600">No branches found in your network.</div>
            ) : (
              filteredGyms.map((gym) => (
                <TableRow key={gym.id} className="gap-6 lg:gap-0">
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
                        onClick={() => handleUpdateStatus(gym.id, 'INACTIVE')}
                        className="p-3 text-slate-500 hover:text-red-500 hover:bg-white/5 rounded-xl lg:rounded-2xl transition-all border border-transparent shadow-lg"
                        title="Suspend Branch"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(gym.id, 'ACTIVE')}
                        className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-white/5 rounded-xl lg:rounded-2xl transition-all border border-transparent shadow-lg"
                        title="Restore Branch"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                  </div>
                </TableRow>
              ))
            )}
          </Table>
        </Card>

        <Modal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          title="Create New Branch"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateGym} className="space-y-10">
            <div className="space-y-8">
              <Input 
                label="Branch Name" 
                placeholder="e.g. FitVibe Downtown"
                required
                value={newGym.name}
                onChange={(e) => setNewGym({...newGym, name: e.target.value})}
              />
              <Input 
                label="Contact Phone" 
                placeholder="+91 XXXXX XXXXX"
                required
                value={newGym.phone}
                onChange={(e) => setNewGym({...newGym, phone: e.target.value})}
              />
              <div className="space-y-3">
                <label className="label-text ml-2">Location Address</label>
                <textarea
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 px-6 text-ivory text-sm font-bold focus:outline-none focus:border-earth-clay/30 transition-all shadow-inner h-24 placeholder:text-slate-600"
                  placeholder="Enter branch address..."
                  value={newGym.address}
                  onChange={(e) => setNewGym({...newGym, address: e.target.value})}
                />
              </div>
              <Input 
                label="Subscription Expiry (Optional)" 
                type="date"
                value={newGym.saas_valid_until}
                onChange={(e) => setNewGym({...newGym, saas_valid_until: e.target.value})}
              />
            </div>
            
            <div className="bg-earth-clay/5 p-8 rounded-3xl border border-earth-clay/10 flex items-start space-x-6">
               <Activity size={20} className="text-earth-clay mt-1" />
               <p className="body-text !text-xs italic opacity-60">Adding a new branch will create an isolated management instance within the network.</p>
            </div>

            <div className="flex gap-6 mt-12">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="flex-1 shadow-2xl"
              >
                Save Branch
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default Gyms;
