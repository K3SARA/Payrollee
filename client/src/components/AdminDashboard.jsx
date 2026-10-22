import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Users,
  CalendarDays,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Briefcase,
  PieChart as PieIcon,
  BarChart3,
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { apiFetch, formatLKR, formatDate } from '../api';

export default function AdminDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await apiFetch('/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleReviewLeave(leaveId, status) {
    setActionLoading(true);
    try {
      await apiFetch(`/attendance/leaves/${leaveId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reviewNotes: status === 'APPROVED' ? 'Approved directly via Admin Dashboard' : 'Denied via Admin Dashboard'
        })
      });
      setMessage(`Leave request ${status.toLowerCase()} successfully.`);
      setTimeout(() => setMessage(''), 4000);
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to update leave');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading live HR metrics...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const deptBreakdown = data?.departmentBreakdown || [];
  const payrollTrends = data?.payrollTrends || [];
  const pendingLeaves = data?.recentPendingLeaves || [];

  // Calculate highest department cost for SVG bar scaling
  const maxDeptCost = Math.max(...deptBreakdown.map(d => d.costToCompany), 1);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Alert Banner if any */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-950/20 ring-1 ring-white/10">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Sri Lanka 2026 Statutory Compliance Active</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Payroll Overview</h2>
          <p className="text-xs text-slate-300">
            Real-time tracking of company payroll obligations, EPF/ETF contributions, and IRD APIT tax withholdings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('payroll-run')}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center space-x-2"
          >
            <Banknote className="w-4 h-4" />
            <span>Execute Payroll Run</span>
          </button>
          <button
            onClick={() => onNavigate('employees')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Manage Team</span>
          </button>
        </div>
      </div>

      {/* 4 Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Payroll Cost (CTC) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payroll Cost (CTC)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatLKR(metrics.totalPayrollCost)}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-slate-500 space-x-1">
              <span className="text-blue-600 font-semibold">Gross + 15%</span>
              <span>(12% EPF + 3% ETF)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Employees</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.activeEmployeesCount || 0} <span className="text-sm font-normal text-slate-400">/ {metrics.totalEmployeesCount || 0}</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% active roster status</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Pending Leave Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {metrics.pendingLeaveRequestsCount || 0}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Awaiting administrative review
            </div>
          </div>
        </div>

        {/* Metric 4: Upcoming Payroll Run Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Payroll Run</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatDate(metrics.upcomingPayrollDate)}
            </div>
            <div className="mt-1 text-[11px] text-purple-700 font-medium">
              Last Run: {metrics.lastRunNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Department Cost Breakdown & Statutory Trends) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Cost Breakdown Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Department Expense Breakdown (Cost to Company)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Total monthly liability per department including statutory employer EPF & ETF
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{deptBreakdown.length} Depts</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {deptBreakdown.map((dept, idx) => {
              const percentage = Math.round((dept.costToCompany / maxDeptCost) * 100);
              const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-emerald-600', 'bg-amber-600'];
              const barColor = colors[idx % colors.length];

              return (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{dept.department}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                        {dept.count} {dept.count === 1 ? 'employee' : 'employees'}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">{formatLKR(dept.costToCompany)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sri Lanka Statutory Expense Split Visualizer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-indigo-600" />
                <span>Statutory Deductions & Contributions Split</span>
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                SL 2026 Model
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clear segregation of Employee Withholdings vs Employer Overhead
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500">Employee Deductions</span>
                <div className="text-base font-bold text-slate-900">8% EPF + APIT</div>
                <p className="text-[11px] text-slate-500">
                  Deducted from gross salary before net disbursement.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-600">Employer Contributions</span>
                <div className="text-base font-bold text-blue-900">12% EPF + 3% ETF</div>
                <p className="text-[11px] text-slate-500">
                  Total 15% statutory addition forming Cost to Company.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Inland Revenue APIT Personal Relief Reminder</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Monthly relief of <strong>LKR 150,000</strong> is automatically deducted from (Gross − 8% EPF) before progressive tax brackets (6% to 36%) are calculated.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to inspect recent pay runs?</span>
            <button
              onClick={() => onNavigate('reports')}
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View Historical Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests Section with 1-click Approval */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Pending Time-Off Requests Requiring Approval</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {pendingLeaves.length}
            </span>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Open Attendance Module</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <span>All time-off requests are up to date. No pending approvals.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingLeaves.map((req) => (
              <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center space-x-3">
                  <img
                    src={req.employee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                    alt={req.employee?.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                      <span>{req.employee?.firstName} {req.employee?.lastName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({req.employee?.employeeNumber})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800">
                        {req.leaveType} LEAVE
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(req.startDate)} to {formatDate(req.endDate)} ({req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}) • <span className="italic">"{req.reason}"</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReviewLeave(req.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReviewLeave(req.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-1 border border-rose-200 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Deny</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
