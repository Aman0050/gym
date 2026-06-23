import React, { useState, useEffect } from 'react';
import { staffService } from '../../services/staffService';
import { generatePayslipPDF } from '../../utils/payslipPDFGenerator';
import {
  Plus, Search, Edit, Trash2, Calendar, FileText, Download, Users,
  CreditCard, RefreshCw, BarChart3, Upload, X, UserCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const StaffPayroll = () => {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'attendance', 'payroll', 'performance'
  const [loading, setLoading] = useState(false);

  // Directory state
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    employee_id: '',
    role: 'Trainer',
    phone: '',
    email: '',
    address: '',
    joining_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    emergency_contact: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Payroll state
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    staff_id: '',
    month: '',
    base_salary: 0,
    bonus: 0,
    incentives: 0,
    deductions: 0,
    advance_salary: 0,
    status: 'Draft'
  });

  // Trainer Performance state
  const [trainerPerformances, setTrainerPerformances] = useState([]);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceForm, setPerformanceForm] = useState({
    trainer_id: '',
    assigned_members_count: 0,
    retention_rate: 0,
    renewals_count: 0,
    revenue_influenced: 0,
    attendance_percentage: 0
  });
  const [performanceTrainerName, setPerformanceTrainerName] = useState('');

  // Fetch Directory
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await staffService.getStaffMembers({
        search,
        role: roleFilter,
        status: statusFilter
      });
      setStaffList(res.data);
    } catch (err) {
      toast.error('Failed to load staff profiles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance for selected date
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      // Fetch attendance logged for the date
      const attendanceData = await staffService.getStaffAttendance({ date: attendanceDate });
      
      // Fetch active staff list
      const staffRes = await staffService.getStaffMembers({ status: 'Active', limit: 100 });
      const activeStaff = staffRes.data;

      // Merge: if attendance exists, use it, else default to 'Present'
      const merged = activeStaff.map(member => {
        const record = attendanceData.find(a => a.staff_id === member.id);
        return {
          staff_id: member.id,
          name: member.name,
          employee_id: member.employee_id,
          role: member.role,
          photo_url: member.photo_url,
          status: record ? record.status : 'Present'
        };
      });
      setAttendanceRecords(merged);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payroll sheets for selected month
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const payrollData = await staffService.getStaffPayroll({ month: payrollMonth });
      const staffRes = await staffService.getStaffMembers({ limit: 100 });
      const allStaff = staffRes.data;

      // Merge: if payroll exists, use it, else default empty values
      const merged = allStaff.map(member => {
        const record = payrollData.find(p => p.staff_id === member.id);
        return record ? {
          ...record,
          staff_name: member.name,
          employee_id: member.employee_id,
          role: member.role,
          photo_url: member.photo_url
        } : {
          id: '',
          staff_id: member.id,
          staff_name: member.name,
          employee_id: member.employee_id,
          role: member.role,
          photo_url: member.photo_url,
          month: payrollMonth,
          base_salary: 0,
          bonus: 0,
          incentives: 0,
          deductions: 0,
          advance_salary: 0,
          net_pay: 0,
          status: 'Draft'
        };
      });
      setPayrollRecords(merged);
    } catch (err) {
      toast.error('Failed to load payroll parameters');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Performance scores
  const fetchTrainerPerformances = async () => {
    try {
      setLoading(true);
      const data = await staffService.getTrainerPerformance();
      setTrainerPerformances(data);
    } catch (err) {
      toast.error('Failed to load trainer performance metrics');
    } finally {
      setLoading(false);
    }
  };

  // Auto trigger fetches based on active tab
  useEffect(() => {
    if (activeTab === 'directory') {
      fetchStaff();
    } else if (activeTab === 'attendance') {
      fetchAttendance();
    } else if (activeTab === 'payroll') {
      fetchPayroll();
    } else if (activeTab === 'performance') {
      fetchTrainerPerformances();
    }
  }, [activeTab, search, roleFilter, statusFilter]);

  // Special hooks for date and month changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [attendanceDate]);

  useEffect(() => {
    if (activeTab === 'payroll') {
      fetchPayroll();
    }
  }, [payrollMonth]);

  // Profile Modal operations
  const handleOpenStaffModal = (staff = null) => {
    if (staff) {
      setSelectedStaff(staff);
      setStaffForm({
        name: staff.name,
        employee_id: staff.employee_id,
        role: staff.role,
        phone: staff.phone,
        email: staff.email,
        address: staff.address || '',
        joining_date: new Date(staff.joining_date).toISOString().split('T')[0],
        status: staff.status,
        emergency_contact: staff.emergency_contact || ''
      });
      setPhotoFile(null);
      setPhotoPreview(staff.photo_url ? `${import.meta.env.VITE_API_URL}${staff.photo_url}` : '');
    } else {
      setSelectedStaff(null);
      setStaffForm({
        name: '',
        employee_id: '',
        role: 'Trainer',
        phone: '',
        email: '',
        address: '',
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        emergency_contact: ''
      });
      setPhotoFile(null);
      setPhotoPreview('');
    }
    setIsStaffModalOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo size cannot exceed 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleStaffFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(staffForm).forEach(key => {
      data.append(key, staffForm[key]);
    });
    if (photoFile) {
      data.append('photo', photoFile);
    }

    try {
      if (selectedStaff) {
        await staffService.updateStaffMember(selectedStaff.id, data);
        toast.success('Staff profile modified successfully');
      } else {
        await staffService.createStaffMember(data);
        toast.success('Staff member registered successfully');
      }
      setIsStaffModalOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save staff details');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff profile? This cannot be undone and will delete related payroll/attendance histories.')) {
      try {
        await staffService.deleteStaffMember(id);
        toast.success('Staff profile deleted');
        fetchStaff();
      } catch (err) {
        toast.error('Failed to delete staff member');
      }
    }
  };

  // Attendance operations
  const handleAttendanceChange = (staffId, status) => {
    setAttendanceRecords(prev => prev.map(rec => 
      rec.staff_id === staffId ? { ...rec, status } : rec
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);
      const recordsToSave = attendanceRecords.map(r => ({
        staff_id: r.staff_id,
        status: r.status
      }));
      await staffService.upsertStaffAttendance({
        date: attendanceDate,
        records: recordsToSave
      });
      toast.success('Attendance logs submitted successfully');
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to log attendance');
    } finally {
      setLoading(false);
    }
  };

  // Payroll modal operations
  const handleOpenPayrollModal = (record) => {
    setSelectedPayroll(record);
    setPayrollForm({
      staff_id: record.staff_id,
      month: record.month,
      base_salary: record.base_salary || 0,
      bonus: record.bonus || 0,
      incentives: record.incentives || 0,
      deductions: record.deductions || 0,
      advance_salary: record.advance_salary || 0,
      status: record.status || 'Draft'
    });
    setIsPayrollModalOpen(true);
  };

  const handlePayrollFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await staffService.upsertStaffPayroll(payrollForm);
      toast.success('Payroll ledger entry updated');
      setIsPayrollModalOpen(false);
      fetchPayroll();
    } catch (err) {
      toast.error('Failed to update payroll parameters');
    }
  };

  const calculateNetPay = () => {
    const base = parseFloat(payrollForm.base_salary || 0);
    const bonus = parseFloat(payrollForm.bonus || 0);
    const inc = parseFloat(payrollForm.incentives || 0);
    const ded = parseFloat(payrollForm.deductions || 0);
    const adv = parseFloat(payrollForm.advance_salary || 0);
    return Math.max(0, base + bonus + inc - ded - adv);
  };

  // Performance modal operations
  const handleOpenPerformanceModal = (perf) => {
    setPerformanceTrainerName(perf.trainer_name);
    setPerformanceForm({
      trainer_id: perf.trainer_id,
      assigned_members_count: perf.assigned_members_count || 0,
      retention_rate: perf.retention_rate || 0,
      renewals_count: perf.renewals_count || 0,
      revenue_influenced: perf.revenue_influenced || 0,
      attendance_percentage: perf.attendance_percentage || 0
    });
    setIsPerformanceModalOpen(true);
  };

  const handlePerformanceFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await staffService.upsertTrainerPerformance(performanceForm);
      toast.success('Trainer metrics updated');
      setIsPerformanceModalOpen(false);
      fetchTrainerPerformances();
    } catch (err) {
      toast.error('Failed to save performance scorecards');
    }
  };

  const downloadPayslip = (record) => {
    if (parseFloat(record.base_salary || 0) <= 0) {
      toast.error('Unable to generate payslip with zero base salary');
      return;
    }
    const staff = {
      name: record.staff_name,
      employee_id: record.employee_id,
      role: record.role,
      phone: record.phone || 'N/A',
      email: record.email || 'N/A'
    };
    generatePayslipPDF(record, staff);
    toast.success(`Payslip for ${record.staff_name} downloaded`);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="page-header-meta">
          <h1 className="page-title text-white">Staff & Payroll</h1>
          <p className="body-text">Register staff directory, organize daily attendance rosters, track monthly salaries, and review performance.</p>
        </div>
        {activeTab === 'directory' && (
          <button
            onClick={() => handleOpenStaffModal()}
            className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs shadow-lg shadow-earth-clay/20 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Register Staff Member
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/[0.06] gap-6">
        {[
          { id: 'directory',  name: 'Staff Directory',   icon: Users },
          { id: 'attendance', name: 'Attendance Sheets', icon: UserCheck },
          { id: 'payroll',    name: 'Salary & Payroll',  icon: CreditCard },
          { id: 'performance',name: 'Trainer Performance',icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === tab.id ? 'border-b-2 border-earth-clay text-earth-clay' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={13} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab components */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Staff Directory */}
        {activeTab === 'directory' && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                <div className="relative w-full max-w-[240px]">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search staff members..."
                    className="input-field !pl-10 !py-2 text-xs"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[150px]"
                >
                  <option value="">All Roles</option>
                  <option value="Trainer">Trainer</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Manager">Manager</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Nutritionist">Nutritionist</option>
                  <option value="Owner">Owner</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field !py-2 !pl-3 !pr-8 text-xs w-full max-w-[130px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="aura-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-5">Photo</th>
                      <th className="p-5">Name / ID</th>
                      <th className="p-5">Role</th>
                      <th className="p-5">Contact Details</th>
                      <th className="p-5">Joining Date</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
                    {staffList.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-slate-500">No staff members found.</td>
                      </tr>
                    ) : (
                      staffList.map((member) => (
                        <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5">
                            {member.photo_url ? (
                              <img
                                src={`${import.meta.env.VITE_API_URL}${member.photo_url}`}
                                alt={member.name}
                                className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                {member.name.substring(0, 2)}
                              </div>
                            )}
                          </td>
                          <td className="p-5">
                            <p className="font-bold text-white text-xs">{member.name}</p>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{member.employee_id}</span>
                          </td>
                          <td className="p-5">
                            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-slate-300 text-[10px] font-bold">{member.role}</span>
                          </td>
                          <td className="p-5">
                            <p className="text-white">{member.email}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5">{member.phone}</p>
                          </td>
                          <td className="p-5">{new Date(member.joining_date).toLocaleDateString('en-IN')}</td>
                          <td className="p-5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                              member.status === 'Inactive' ? 'bg-slate-500/10 text-slate-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenStaffModal(member)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition"
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Attendance sheets */}
        {activeTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Date selection & Action banner */}
            <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="text-earth-clay" size={16} />
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="input-field text-xs !py-1.5 w-auto"
                />
              </div>
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2.5 rounded-xl bg-earth-clay hover:bg-earth-clay/90 text-white font-semibold text-xs transition"
              >
                Submit Attendance Logs
              </button>
            </div>

            {/* Attendance Grid */}
            <div className="aura-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-5">Staff Member</th>
                      <th className="p-5">ID & Role</th>
                      <th className="p-5 text-center">Attendance Logs Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-10 text-center text-slate-500">No active staff members registered.</td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record) => (
                        <tr key={record.staff_id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              {record.photo_url ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${record.photo_url}`}
                                  alt={record.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {record.name.substring(0, 2)}
                                </div>
                              )}
                              <span className="font-bold text-white">{record.name}</span>
                            </div>
                          </td>
                          <td className="p-5">
                            <p className="font-mono text-[10px] text-slate-500 uppercase">{record.employee_id}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{record.role}</p>
                          </td>
                          <td className="p-5">
                            <div className="flex justify-center items-center gap-3">
                              {['Present', 'Absent', 'Half Day', 'Leave'].map(status => (
                                <label
                                  key={status}
                                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold cursor-pointer transition flex items-center gap-1.5 ${
                                    record.status === status
                                      ? status === 'Present' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                        : status === 'Absent' ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                        : status === 'Half Day' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                        : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                                      : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`attendance_${record.staff_id}`}
                                    checked={record.status === status}
                                    onChange={() => handleAttendanceChange(record.staff_id, status)}
                                    className="hidden"
                                  />
                                  {status}
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Salary & Payroll */}
        {activeTab === 'payroll' && (
          <motion.div
            key="payroll"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Month Filter */}
            <div className="aura-glass p-5 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="text-earth-clay" size={16} />
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="input-field text-xs !py-1.5 w-auto"
                />
              </div>
            </div>

            {/* Payroll Grid */}
            <div className="aura-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-5">Employee</th>
                      <th className="p-5">Designation</th>
                      <th className="p-5">Base Salary</th>
                      <th className="p-5">Incentives / Bonus</th>
                      <th className="p-5">Deductions / Adv</th>
                      <th className="p-5">Net Payout</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs font-medium text-slate-300">
                    {payrollRecords.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-10 text-center text-slate-500">No records found.</td>
                      </tr>
                    ) : (
                      payrollRecords.map((record) => (
                        <tr key={record.staff_id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              {record.photo_url ? (
                                <img
                                  src={`${import.meta.env.VITE_API_URL}${record.photo_url}`}
                                  alt={record.staff_name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {record.staff_name.substring(0, 2)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-white block">{record.staff_name}</span>
                                <span className="text-[9px] font-mono text-slate-500 uppercase">{record.employee_id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <span className="text-[10px] font-bold text-slate-400">{record.role}</span>
                          </td>
                          <td className="p-5 font-bold text-white">₹{parseFloat(record.base_salary || 0).toLocaleString('en-IN')}</td>
                          <td className="p-5 text-emerald-400 font-medium">
                            +₹{parseFloat(record.bonus || 0).toLocaleString('en-IN')}
                            <p className="text-[9px] text-slate-500 mt-0.5">Inc: ₹{parseFloat(record.incentives || 0).toLocaleString('en-IN')}</p>
                          </td>
                          <td className="p-5 text-red-400 font-medium">
                            -₹{parseFloat(record.deductions || 0).toLocaleString('en-IN')}
                            <p className="text-[9px] text-slate-500 mt-0.5">Adv: ₹{parseFloat(record.advance_salary || 0).toLocaleString('en-IN')}</p>
                          </td>
                          <td className="p-5 font-black text-white text-xs">₹{parseFloat(record.net_pay || 0).toLocaleString('en-IN')}</td>
                          <td className="p-5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              record.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                              record.status === 'Draft' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {record.status || 'Draft'}
                            </span>
                          </td>
                          <td className="p-5 text-right flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenPayrollModal(record)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-amber-500/10 text-slate-400 hover:text-amber-500 transition"
                              title="Update variables"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => downloadPayslip(record)}
                              className="p-2 rounded-lg bg-white/[0.03] hover:bg-earth-clay/10 text-slate-400 hover:text-earth-clay transition"
                              title="Print payslip"
                              disabled={parseFloat(record.base_salary || 0) <= 0}
                            >
                              <Download size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Trainer Performance */}
        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trainerPerformances.length === 0 ? (
                <div className="col-span-4 aura-glass p-8 text-center text-slate-500">
                  No fitness trainers registered in staff.
                </div>
              ) : (
                trainerPerformances.map((perf) => (
                  <div key={perf.trainer_id} className="aura-glass p-6 relative overflow-hidden group space-y-4">
                    <div className="flex items-center gap-3">
                      {perf.photo_url ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${perf.photo_url}`}
                          alt={perf.trainer_name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/[0.08]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-[12px] font-bold text-slate-500 uppercase">
                          {perf.trainer_name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-white">{perf.trainer_name}</h4>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{perf.employee_id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/[0.04] pt-3">
                      <div>
                        <p className="text-[9px] uppercase text-slate-500 font-black">Assigned Clients</p>
                        <p className="font-bold text-white mt-0.5">{perf.assigned_members_count} members</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-slate-500 font-black">Retention rate</p>
                        <p className="font-bold text-emerald-400 mt-0.5">{parseFloat(perf.retention_rate || 0).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-slate-500 font-black">Renewals logged</p>
                        <p className="font-bold text-white mt-0.5">{perf.renewals_count} counts</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-slate-500 font-black">Influenced Rev</p>
                        <p className="font-bold text-earth-clay mt-0.5">₹{parseFloat(perf.revenue_influenced || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] rounded-xl p-2.5 flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Trainer Attendance</span>
                      <span className="text-white font-black">{parseFloat(perf.attendance_percentage || 0).toFixed(0)}%</span>
                    </div>

                    <button
                      onClick={() => handleOpenPerformanceModal(perf)}
                      className="w-full py-2 rounded-xl bg-white/[0.03] hover:bg-earth-clay/10 text-slate-400 hover:text-earth-clay text-center text-xs font-semibold border border-white/[0.05] transition"
                    >
                      Update performance scorecard
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: Add/Edit Staff Profile */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[550px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase text-white tracking-widest">
                  {selectedStaff ? 'Modify Staff Profile' : 'Register Staff Member'}
                </h3>
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleStaffFormSubmit} className="space-y-5">
                {/* Photo upload component */}
                <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.12] flex flex-col items-center justify-center text-slate-500">
                      <Upload size={18} />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white uppercase">Profile Photograph</p>
                    <p className="text-[9px] text-slate-500">Allowed formats: JPG, PNG, WEBP (Max 5MB)</p>
                    <label className="inline-block px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-[10px] rounded-lg cursor-pointer transition border border-white/[0.06] mt-1.5">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Full Name</label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Employee ID */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Employee ID</label>
                    <input
                      type="text"
                      required
                      value={staffForm.employee_id}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, employee_id: e.target.value }))}
                      placeholder="e.g. FXN-1049"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Designated Role</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                      className="select-field text-xs !py-3"
                    >
                      <option value="Trainer">Trainer</option>
                      <option value="Receptionist">Receptionist</option>
                      <option value="Manager">Manager</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Nutritionist">Nutritionist</option>
                      <option value="Owner">Owner</option>
                    </select>
                  </div>
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Profile Status</label>
                    <select
                      value={staffForm.status}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, status: e.target.value }))}
                      className="select-field text-xs !py-3"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 99999 88888"
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. user@domain.com"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Joining Date */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Joining Date</label>
                    <input
                      type="date"
                      required
                      value={staffForm.joining_date}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, joining_date: e.target.value }))}
                      className="input-field text-xs !py-[9px]"
                    />
                  </div>
                  {/* Emergency Contact */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={staffForm.emergency_contact}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, emergency_contact: e.target.value }))}
                      placeholder="e.g. +91 88888 77777"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Residential Address</label>
                  <textarea
                    rows="2"
                    value={staffForm.address}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter resident address..."
                    className="input-field text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-earth-clay hover:bg-earth-clay/90 text-white font-bold text-xs tracking-wider transition uppercase mt-4"
                >
                  Save Profile Details
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Edit Salary Ledger */}
      <AnimatePresence>
        {isPayrollModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayrollModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[480px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">
                    Salary Parameters Calculator
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Month: {payrollForm.month} | {selectedPayroll?.staff_name}</p>
                </div>
                <button
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePayrollFormSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Base salary */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Basic Base Salary (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={payrollForm.base_salary}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, base_salary: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Bonus */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Performance Bonus (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.bonus}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Incentives */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Sales Incentives (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.incentives}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, incentives: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Deductions */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Tax / Deductions (INR)</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.deductions}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Advance Salary */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Advance Salary deduction</label>
                    <input
                      type="number"
                      min="0"
                      value={payrollForm.advance_salary}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, advance_salary: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Payment Status</label>
                    <select
                      value={payrollForm.status}
                      onChange={(e) => setPayrollForm(prev => ({ ...prev, status: e.target.value }))}
                      className="select-field text-xs !py-3"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Live Net Pay Preview */}
                <div className="bg-earth-clay/10 p-4 rounded-xl flex items-center justify-between border border-earth-clay/20 mt-4">
                  <span className="text-[10px] font-black uppercase text-earth-clay tracking-wider">Calculated Net Payout:</span>
                  <span className="text-sm font-black text-white">₹{calculateNetPay().toLocaleString('en-IN')}</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-earth-clay hover:bg-earth-clay/90 text-white font-bold text-xs tracking-wider transition uppercase mt-4"
                >
                  Apply salary parameters
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Edit Trainer Performance metrics */}
      <AnimatePresence>
        {isPerformanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPerformanceModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-[480px] aura-glass-heavy p-8 z-10 overflow-hidden max-h-[90vh] overflow-y-auto premium-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-widest">
                    Trainer Scorecard Editor
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Trainer: {performanceTrainerName}</p>
                </div>
                <button
                  onClick={() => setIsPerformanceModalOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePerformanceFormSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Assigned Members */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Assigned Clients count</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={performanceForm.assigned_members_count}
                      onChange={(e) => setPerformanceForm(prev => ({ ...prev, assigned_members_count: parseInt(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Retention Rate */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Retention Rate (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      value={performanceForm.retention_rate}
                      onChange={(e) => setPerformanceForm(prev => ({ ...prev, retention_rate: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Renewals Count */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Renewals Count</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={performanceForm.renewals_count}
                      onChange={(e) => setPerformanceForm(prev => ({ ...prev, renewals_count: parseInt(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                  {/* Revenue Influenced */}
                  <div className="space-y-1.5">
                    <label className="label-text !text-[10px]">Influenced Revenue (INR)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={performanceForm.revenue_influenced}
                      onChange={(e) => setPerformanceForm(prev => ({ ...prev, revenue_influenced: parseFloat(e.target.value) || 0 }))}
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                {/* Trainer Attendance */}
                <div className="space-y-1.5">
                  <label className="label-text !text-[10px]">Trainer Attendance Rate (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={performanceForm.attendance_percentage}
                    onChange={(e) => setPerformanceForm(prev => ({ ...prev, attendance_percentage: parseFloat(e.target.value) || 0 }))}
                    className="input-field text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-earth-clay hover:bg-earth-clay/90 text-white font-bold text-xs tracking-wider transition uppercase mt-4"
                >
                  Update Trainer Scorecard
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffPayroll;
