import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  User,
  X,
  FileCheck2,
  Briefcase
} from 'lucide-react';
import { apiFetch, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';
import PunchClockWidget from './PunchClockWidget';

export default function AttendanceAndLeaves() {
  const { user, isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('leaves'); // 'leaves' or 'attendance'

  // Data states
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bannerMsg, setBannerMsg] = useState('');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [targetLeave, setTargetLeave] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  // Form states
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'ANNUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    totalDays: 2,
    reason: ''
  });

  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:30',
    checkOut: '17:00',
    regularHours: 8,
    overtimeHours: 0,
    status: 'PRESENT',
    notes: ''
  });

  async function loadData() {
    setLoading(true);
    try {
      const [leavesRes, attRes] = await Promise.all([
        apiFetch('/attendance/leaves'),
        apiFetch('/attendance')
      ]);
      if (leavesRes.success) setLeaves(leavesRes.data);
      if (attRes.success) setAttendance(attRes.data);
    } catch (err) {
      console.error('Failed to load attendance & leaves', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApplyLeave(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/attendance/leaves', {
        method: 'POST',
        body: JSON.stringify(leaveForm)
      });
      if (res.success) {
        setShowApplyModal(false);
        setBannerMsg('Leave application filed successfully.');
        setTimeout(() => setBannerMsg(''), 4000);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit leave');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogAttendance(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch('/attendance/log', {
        method: 'POST',
        body: JSON.stringify(logForm)
      });
      if (res.success) {
        setShowLogModal(false);
        setBannerMsg('Attendance entry logged successfully.');
        setTimeout(() => setBannerMsg(''), 4000);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to log attendance');
    } finally {
      setActionLoading(false);
    }
  }

  function openReview(leave, decision) {
    setTargetLeave(leave);
    setReviewDecision(decision);
    setReviewNotes(decision === 'APPROVED' ? 'Approved by HR Administrator' : 'Denied per company policy');
    setShowReviewModal(true);
  }

  async function submitReview(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiFetch(`/attendance/leaves/${targetLeave.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: reviewDecision,
          reviewNotes
        })
      });
      if (res.success) {
        setShowReviewModal(false);
        setBannerMsg(`Leave request marked as ${reviewDecision.toLowerCase()}.`);
        setTimeout(() => setBannerMsg(''), 4000);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to review leave');
    } finally {
      setActionLoading(false);
    }
  }

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter === 'ALL') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Banner */}
      {bannerMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{bannerMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Attendance & Leave Management' : 'My Attendance & Time-Off'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log working hours, track overtime, and handle employee paid/unpaid leave entitlements.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Log Daily Hours</span>
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Live Punch Clock Widget for Check-In and Check-Out */}
      <PunchClockWidget onStatusChanged={loadData} />

      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'leaves'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Leave Requests Queue</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'leaves' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {leaves.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeSubTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Attendance & Overtime Ledger</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeSubTab === 'attendance' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {attendance.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'leaves' && (
          <div className="flex items-center space-x-1">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* View 1: Leave Requests Table */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading leave requests...</div>
          ) : filteredLeaves.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No leave requests found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Leave Type</th>
                    <th className="px-5 py-3.5">Dates & Duration</th>
                    <th className="px-5 py-3.5">Reason & Purpose</th>
                    <th className="px-5 py-3.5">Status</th>
                    {isAdmin && <th className="px-5 py-3.5 text-right">Approval Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={l.employee?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={l.employee?.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {l.employee?.firstName} {l.employee?.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {l.employee?.employeeNumber} • {l.employee?.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          l.leaveType === 'ANNUAL' ? 'bg-blue-50 text-blue-700' :
                          l.leaveType === 'SICK' ? 'bg-rose-50 text-rose-700' :
                          l.leaveType === 'CASUAL' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {l.leaveType}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">
                          {formatDate(l.startDate)} - {formatDate(l.endDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {l.totalDays} {l.totalDays === 1 ? 'Working Day' : 'Working Days'}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 max-w-xs">
                        <div className="text-slate-700 italic">"{l.reason}"</div>
                        {l.reviewNotes && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            <span className="font-medium text-slate-700">Admin Review:</span> {l.reviewNotes}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          l.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          {l.status === 'PENDING' ? (
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => openReview(l, 'APPROVED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openReview(l, 'REJECTED')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 flex items-center space-x-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deny</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View 2: Attendance Ledger Table */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Check In / Out</th>
                  <th className="px-5 py-3.5">Regular Hours</th>
                  <th className="px-5 py-3.5">Overtime Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Timesheet Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">
                        {att.employee?.firstName} {att.employee?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">{att.employee?.employeeNumber}</div>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {formatDate(att.date)}
                    </td>

                    <td className="px-5 py-3.5 text-slate-700">
                      {att.checkIn || '-'} — {att.checkOut || '-'}
                    </td>

                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      {att.regularHours} hrs
                    </td>

                    <td className="px-5 py-3.5">
                      {att.overtimeHours > 0 ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          +{att.overtimeHours} hrs (1.5x)
                        </span>
                      ) : (
                        <span className="text-slate-400">0 hrs</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        att.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' :
                        att.status === 'OVERTIME' ? 'bg-blue-50 text-blue-700' :
                        att.status === 'LATE' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {att.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 italic">
                      {att.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Apply for Leave */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Apply for Time Off</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Leave Category</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="ANNUAL">Annual Leave (Paid)</option>
                  <option value="CASUAL">Casual Leave (Paid)</option>
                  <option value="SICK">Sick / Medical Leave (Paid)</option>
                  <option value="UNPAID">Unpaid Leave (Deducted from Gross)</option>
                  <option value="MATERNITY">Maternity Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    required
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date</label>
                  <input
                    required
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Total Working Days</label>
                <input
                  required
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason / Notes</label>
                <textarea
                  required
                  rows="3"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Explain the purpose of leave request..."
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Attendance */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Daily Work Hours & Overtime</h3>
              <button onClick={() => setShowLogModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogAttendance} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={logForm.status}
                    onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="PRESENT">Present (Full Day)</option>
                    <option value="OVERTIME">Overtime Shift</option>
                    <option value="LATE">Late Arrival</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="UNPAID_LEAVE">Unpaid Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Check In Time</label>
                  <input
                    type="time"
                    value={logForm.checkIn}
                    onChange={(e) => setLogForm({ ...logForm, checkIn: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Check Out Time</label>
                  <input
                    type="time"
                    value={logForm.checkOut}
                    onChange={(e) => setLogForm({ ...logForm, checkOut: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Regular Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={logForm.regularHours}
                    onChange={(e) => setLogForm({ ...logForm, regularHours: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Overtime Hours (OT)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={logForm.overtimeHours}
                    onChange={(e) => setLogForm({ ...logForm, overtimeHours: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Work Summary / Shift Notes</label>
                <input
                  type="text"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="e.g. SRE emergency patch or regular sprint tasks"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  {actionLoading ? 'Logging...' : 'Save Timesheet Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Leave Review Notes */}
      {showReviewModal && targetLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className={`p-5 text-white flex items-center justify-between ${
              reviewDecision === 'APPROVED' ? 'bg-emerald-700' : 'bg-rose-700'
            }`}>
              <h3 className="font-bold text-sm">
                {reviewDecision === 'APPROVED' ? 'Approve Leave Request' : 'Deny Leave Request'}
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitReview} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                <div>Employee: <strong>{targetLeave.employee?.firstName} {targetLeave.employee?.lastName}</strong></div>
                <div>Dates: {formatDate(targetLeave.startDate)} to {formatDate(targetLeave.endDate)} ({targetLeave.totalDays} days)</div>
                <div>Reason: <em>"{targetLeave.reason}"</em></div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Review Notes / Remarks</label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white rounded-lg font-semibold shadow-md ${
                    reviewDecision === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : `Confirm ${reviewDecision}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
