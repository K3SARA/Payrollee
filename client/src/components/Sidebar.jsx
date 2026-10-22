import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calculator,
  FileText,
  UserCheck,
  Clock,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, role, isAdmin, logout } = useAuth();
  const profile = user?.profile;

  const adminNav = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Directory', icon: Users, badge: 'Active' },
    { id: 'attendance', label: 'Attendance & Leaves', icon: CalendarCheck },
    { id: 'payroll-run', label: 'Payroll Processing Engine', icon: Calculator, badge: '2026 APIT' },
    { id: 'reports', label: 'Payslips & Ledger', icon: FileText },
  ];

  const employeeNav = [
    { id: 'dashboard', label: 'Personal Overview', icon: LayoutDashboard },
    { id: 'my-profile', label: 'My Profile & Details', icon: UserCheck },
    { id: 'attendance', label: 'Timesheet & Hours', icon: Clock },
    { id: 'leaves', label: 'Leave Requests', icon: CalendarDays },
    { id: 'my-payslips', label: 'My Payslips', icon: FileText, badge: 'SL Statutory' },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 select-none flex-shrink-0 h-screen sticky top-0 no-print">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg text-white tracking-tight">PayRolleey</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">2026</span>
            </div>
            <p className="text-[11px] text-slate-400">Sri Lanka Statutory Payroll</p>
          </div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Access Level:</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1 ${
            isAdmin
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <ShieldCheck className="w-3 h-3 mr-1 inline" />
            {isAdmin ? 'HR Administrator' : 'Staff Employee'}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">
          {isAdmin ? 'Organization Modules' : 'Employee Self-Service'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Statutory Quick Info Box */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-300 space-y-1.5">
        <div className="flex items-center text-blue-400 font-semibold space-x-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Statutory Rates (2026)</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
          <div>Employee EPF: <span className="text-white font-medium">8%</span></div>
          <div>Employer EPF: <span className="text-white font-medium">12%</span></div>
          <div>Employer ETF: <span className="text-white font-medium">3%</span></div>
          <div>Personal Relief: <span className="text-emerald-400 font-medium">150k</span></div>
        </div>
      </div>

      {/* Current User Profile Card & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={profile ? `${profile.firstName} ${profile.lastName}` : 'User'}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/40 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {profile?.designation || role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
