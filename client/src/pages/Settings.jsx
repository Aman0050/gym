import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    upi_id: '',
    business_name: '',
    qr_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings({
        upi_id: res.data.upi_id || '',
        business_name: res.data.business_name || '',
        qr_enabled: res.data.qr_enabled || false,
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) {
    return <div className="p-8 text-ivory">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-black text-ivory mb-6">Gym Payment Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ivory mb-1">Business Name</label>
          <input
            type="text"
            placeholder="Enter business name"
            value={settings.business_name}
            onChange={e => setSettings({ ...settings, business_name: e.target.value })}
            className="w-full p-2 rounded bg-white/5 border border-white/10 text-ivory focus:outline-none focus:border-earth-clay"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ivory mb-1">UPI ID</label>
          <input
            type="text"
            placeholder="example@paytm"
            value={settings.upi_id}
            onChange={e => setSettings({ ...settings, upi_id: e.target.value })}
            className="w-full p-2 rounded bg-white/5 border border-white/10 text-ivory focus:outline-none focus:border-earth-clay"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="qr_enabled"
            checked={settings.qr_enabled}
            onChange={e => setSettings({ ...settings, qr_enabled: e.target.checked })}
            className="mr-2 rounded"
          />
          <label htmlFor="qr_enabled" className="text-sm font-medium text-ivory">Enable QR Payments</label>
        </div>
        <button
          onClick={saveSettings}
          className="mt-4 px-4 py-2 bg-earth-clay text-white rounded hover:bg-earth-clay/90"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
