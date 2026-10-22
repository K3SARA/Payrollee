import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Calendar,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { apiFetch, formatLKR, formatDate } from '../api';
import PunchClockWidget from './PunchClockWidget';

export default function EmployeeDashboard({ onNavigate, onViewPayslip }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await apiFetch('/dashboard');
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Loading your personal portal...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const profile = data?.profile || {};
  const attendance = data?.recentAttendance || [];
  const leaves = data?.recentLeaves || [];
  const latestPayslip = metrics.latestPayslip;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Employee Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-xl shadow-blue-950/20 ring-1 ring-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={profile.firstName}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-400/50 shadow-md"
          />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {profile.employeeNumber}
              </span>
              <span className="text-xs text-blue-300">{profile.department}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome, {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-xs text-slate-300">
              {profile.designation} • Bank: {profile.bankName} (A/C: ****{profile.accountNumber?.slice(-4) || '----'})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Attendance & Timesheet</span>
          </button>
          <button
            onClick={() => onNavigate('leaves')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request Leave</span>
          </button>
        </div>
      </div>

      {/* Live Punch Clock Widget for Check-In and Check-Out */}
      <PunchClockWidget onStatusChanged={loadDashboard} />

      {/* Personal Salary Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Base Monthly Salary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base Monthly Salary</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {formatLKR(metrics.baseSalary)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Agreed contractual rate</div>
        </div>

        {/* Employee EPF Deduction (8%) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee EPF (8%)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Deduction</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 text-rose-600">
            − {formatLKR(metrics.employeeEpf)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Statutory 8% retirement deposit</div>
        </div>

        {/* Estimated APIT Tax */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated APIT (PAYE)</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">IRD 2026</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 text-rose-600">
            {metrics.estimatedApit > 0 ? `− ${formatLKR(metrics.estimatedApit)}` : 'LKR 0.00 (Exempt)'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {metrics.estimatedApit > 0 ? 'Progressive IRD tax withholding' : 'Protected by LKR 150k monthly relief'}
          </div>
        </div>

        {/* Estimated Net Take-Home Pay */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">Estimated Net Pay</span>
            <Wallet className="w-4 h-4 text-white/80" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatLKR(metrics.estimatedNet)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-100">
            Net take-home credited to bank
          </div>
        </div>
      </div>

      {/* Middle Grid: Latest Payslip & Recent Leave Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Payslip Highlight */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Latest Disbursed Payslip</span>
              </h3>
              {latestPayslip && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  PAID
                </span>
              )}
            </div>

            {latestPayslip ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-base">{latestPayslip.runNumber}</div>
                    <div className="text-xs text-slate-500">
                      Period: {latestPayslip.periodYear}-{String(latestPayslip.periodMonth).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Net Disbursed</div>
                    <div className="text-lg font-bold text-emerald-700">{formatLKR(latestPayslip.netPay)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>Gross Earnings: <strong className="text-slate-800">{formatLKR(latestPayslip.grossPay)}</strong></div>
                  <div>Disbursed Date: <strong className="text-slate-800">{formatDate(latestPayslip.date)}</strong></div>
                </div>

                <button
                  onClick={() => onViewPayslip(latestPayslip.id)}
                  className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Official High-Resolution Payslip</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No past payslips on record yet. Once payroll is executed, your payslips will appear here.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">View complete payroll history?</span>
            <button
              onClick={() => onNavigate('my-payslips')}
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>All My Payslips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Leave Requests Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>My Recent Leave Applications</span>
              </h3>
              <button
                onClick={() => onNavigate('leaves')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                + Apply Leave
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {leaves.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No leave requests filed recently.
                </div>
              ) : (
                leaves.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{l.leaveType} LEAVE</span>
                        <span className="text-[11px] text-slate-500 font-normal">({l.totalDays} {l.totalDays === 1 ? 'day' : 'days'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(l.startDate)} - {formatDate(l.endDate)}
                      </div>
                      {l.reviewNotes && (
                        <div className="text-[10px] text-slate-600 italic mt-0.5">HR: {l.reviewNotes}</div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to inspect all requests?</span>
            <button
              onClick={() => onNavigate('leaves')}
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Leave Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Attendance / Timesheet log table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Daily Attendance & Hours Logged</h3>
          </div>
          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Open Full Timesheet
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">Regular Hours</th>
                <th className="px-5 py-3">Overtime</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{formatDate(att.date)}</td>
                  <td className="px-5 py-3 text-slate-600">{att.checkIn || '-'}</td>
                  <td className="px-5 py-3 text-slate-600">{att.checkOut || '-'}</td>
                  <td className="px-5 py-3 text-slate-700">{att.regularHours} hrs</td>
                  <td className="px-5 py-3">
                    {att.overtimeHours > 0 ? (
                      <span className="font-semibold text-emerald-700">+{att.overtimeHours} hrs OT</span>
                    ) : (
                      <span className="text-slate-400">0 hrs</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      att.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                      att.status === 'OVERTIME' ? 'bg-blue-50 text-blue-700' :
                      att.status === 'LATE' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {att.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 italic">{att.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
