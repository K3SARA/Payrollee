import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  CreditCard,
  ShieldCheck,
  Phone,
  MapPin,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch, formatLKR, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';

export default function EmployeeProfileView() {
  const { user, profile } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Editable fields for employee: phone & address
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  async function loadProfile() {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/employees/${profile.id}`);
      if (res.success) {
        setEmployee(res.data);
        setPhone(res.data.phone || '');
        setAddress(res.data.address || '');
      }
    } catch (err) {
      console.error('Error loading employee profile', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [profile?.id]);

  async function handleSaveContact(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`/employees/${employee.id}`, {
        method: 'PUT',
        body: JSON.stringify({ phone, address })
      });
      if (res.success) {
        setMsg('Contact details updated successfully.');
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to update contact info');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading profile details...
      </div>
    );
  }

  if (!employee) {
    return <div className="p-8 text-center text-xs text-slate-400">Profile record not found.</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in">
      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={employee.firstName}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                {employee.employeeNumber}
              </span>
              <span className="text-xs text-slate-500">{employee.department}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-xs text-slate-500">{employee.designation}</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Contractual Base</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{formatLKR(employee.baseSalary)}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Joined on {formatDate(employee.joinDate)}</div>
        </div>
      </div>

      {/* Statutory Identification & Bank Coordinates (Read-Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statutory Identifiers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Sri Lanka Statutory Identifiers</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">IRD & EPF</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">National Identity Card (NIC)</span>
              <span className="font-mono font-bold text-slate-900">{employee.nicNumber}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Tax Identification Number (TIN)</span>
              <span className="font-mono font-bold text-slate-900">{employee.taxIdentificationNumber}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Employment Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                {employee.employmentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Remittance Bank Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Disbursement Banking Coordinates</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Salary Remittance</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Bank Name</span>
              <span className="font-bold text-slate-900">{employee.bankName}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Branch</span>
              <span className="font-bold text-slate-900">{employee.bankBranch}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Account Number</span>
              <span className="font-mono font-bold text-slate-900">
                ****{employee.accountNumber?.slice(-4) || '----'}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start space-x-2">
            <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>To modify salary bank accounts or tax IDs, please submit a request to HR Admin for verification.</span>
          </div>
        </div>
      </div>

      {/* Editable Contact Information Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>Contact & Residence Information (Self-Service)</span>
        </h3>

        <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Registered Email</label>
              <input
                disabled
                type="text"
                value={user?.email || ''}
                className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12/4 Temple Road, Colombo"
              className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Updating...' : 'Save Contact Updates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
