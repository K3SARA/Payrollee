import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
  Calendar,
  RotateCcw,
  Globe
} from 'lucide-react';
import { apiFetch } from '../api';

export default function PunchClockWidget({ onStatusChanged }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  // Live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchTodayStatus() {
    try {
      const res = await apiFetch('/attendance/today');
      if (res.success) {
        setTodayStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to load today attendance status', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  async function handleCheckIn() {
    setActionLoading(true);
    setMessage('');
    try {
      const res = await apiFetch('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      if (res.success) {
        setMessage(res.message);
        setNotes('');
        await fetchTodayStatus();
        if (onStatusChanged) onStatusChanged();
      }
    } catch (err) {
      alert(err.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!window.confirm('Are you ready to clock out for today?')) return;
    setActionLoading(true);
    setMessage('');
    try {
      const res = await apiFetch('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ notes })
      });
      if (res.success) {
        setMessage(res.message);
        setNotes('');
        await fetchTodayStatus();
        if (onStatusChanged) onStatusChanged();
      }
    } catch (err) {
      alert(err.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPunch() {
    if (!window.confirm("Do you want to reset today's punch so you can Punch In / Check In again?")) return;
    setActionLoading(true);
    setMessage('');
    try {
      const res = await apiFetch('/attendance/reset-today', {
        method: 'POST'
      });
      if (res.success) {
        setMessage(res.message);
        await fetchTodayStatus();
        if (onStatusChanged) onStatusChanged();
      }
    } catch (err) {
      alert(err.message || 'Failed to reset punch');
    } finally {
      setActionLoading(false);
    }
  }

  const isCheckedIn = todayStatus?.isCheckedIn;
  const isCheckedOut = todayStatus?.isCheckedOut;
  const record = todayStatus?.record;

  // Format digital time explicitly in Sri Lanka Standard Time (Asia/Colombo, UTC+05:30)
  const timeString = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate elapsed working time if checked in but not checked out
  const getElapsedString = () => {
    if (!record?.checkIn || isCheckedOut) return null;
    const [h, m] = record.checkIn.split(':').map(Number);
    const startMins = h * 60 + m;
    
    // Get current minutes in Asia/Colombo
    const slDate = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    const currentMins = slDate.getHours() * 60 + slDate.getMinutes();
    const diff = Math.max(0, currentMins - startMins);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
      {/* Top Bar: Digital Clock & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">Attendance Punch Clock</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Globe className="w-3 h-3 text-blue-600" />
                <span>Sri Jayawardenepura (UTC+05:30)</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{dateString}</span>
            </div>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold tracking-wider flex items-center space-x-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{timeString}</span>
          </div>
          {isCheckedOut && (
            <button
              onClick={handleResetPunch}
              disabled={actionLoading}
              title="Reset Today's Punch to test Check-In again"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center space-x-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Punch</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Main Punch Interaction Section */}
      {loading ? (
        <div className="p-4 text-center text-xs text-slate-400">Loading attendance state...</div>
      ) : isCheckedOut ? (
        /* State 3: Completed for today */
        <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 text-sm flex items-center space-x-2">
                <span>Day's Shift Completed</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {record.status}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                Punched In: <strong>{record.checkIn}</strong> • Punched Out: <strong>{record.checkOut}</strong> (Sri Lanka Time)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-900">
                {record.regularHours} Regular Hrs {record.overtimeHours > 0 && `+ ${record.overtimeHours} Overtime Hrs`}
              </div>
              <div className="text-[10px] text-emerald-700">Contractual workday recorded</div>
            </div>

            <button
              onClick={handleResetPunch}
              disabled={actionLoading}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Punch In Again</span>
            </button>
          </div>
        </div>
      ) : isCheckedIn ? (
        /* State 2: Checked In - Working ongoing shift */
        <div className="space-y-3">
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  Checked In at <span className="text-blue-700 font-mono text-sm">{record.checkIn}</span> (Sri Lanka Time)
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Elapsed Work Time Today: <strong className="text-slate-800 font-semibold">{getElapsedString()}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center space-x-2 transition-all self-start sm:self-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>{actionLoading ? 'Clocking Out...' : 'Punch Out (Check Out)'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* State 1: Not checked in yet */
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-xs">Ready for today's shift?</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Current Sri Lanka Time: <strong>{timeString}</strong> • Standard workday starts at 08:30 AM.
              </div>
            </div>

            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all self-start sm:self-auto"
            >
              <LogIn className="w-4 h-4" />
              <span>{actionLoading ? 'Clocking In...' : 'Punch In (Check In Now)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
