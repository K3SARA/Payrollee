import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Users2,
  ChevronDown,
  Info,
  Calendar,
  Building2,
  Sparkles,
  ExternalLink,
  Lock,
  RotateCcw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ activeTab }) {
  const { user, isAdmin, adminOriginated, demoAccounts, switchPersona } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);

  const titles = {
    dashboard: isAdmin ? 'Admin Executive Dashboard' : 'My Personal Workplace Dashboard',
    employees: 'Employee Directory & Profiles',
    attendance: isAdmin ? 'Attendance & Leave Management' : 'My Attendance & Timesheet Logs',
    'payroll-run': 'Sri Lanka 2026 Payroll Execution Engine',
    reports: 'Historical Payroll Ledger & Payslips',
    'my-profile': 'My Personal Profile & Banking Details',
    leaves: 'My Leave Requests',
    'my-payslips': 'My Issued Payslips'
  };

  async function handleSwitch(targetAcc) {
    // RBAC: Staff cannot switch to admin role
    if (!isAdmin && !adminOriginated && targetAcc.role === 'HR_ADMIN') {
      alert('Access Denied: Staff accounts cannot switch to the Administrator role.');
      return;
    }

    setShowSwitchMenu(false);
    await switchPersona(targetAcc.email);
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs no-print">
      {/* Active Tab Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>PayRolleey HRMS</span>
          <span>/</span>
          <span className="text-blue-600 font-semibold">{isAdmin ? 'HR Administration' : 'Employee Portal'}</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">
          {titles[activeTab] || 'Payroll System'}
        </h1>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center space-x-3">
        {/* If Admin is testing as Staff: Show Return to Admin Session button */}
        {!isAdmin && adminOriginated && (
          <button
            onClick={() => switchPersona('admin@payrolleey.lk')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors text-xs font-bold shadow-xs border border-amber-600 animate-in fade-in"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Return to Admin Session</span>
          </button>
        )}

        {/* Sri Lanka Compliance Badge */}
        <button
          onClick={() => setShowStatutoryModal(true)}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 text-xs font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">Sri Lanka 2026 Tax Engine</span>
          <Info className="w-3.5 h-3.5 text-blue-500" />
        </button>

        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold border border-slate-200 shadow-2xs"
          >
            <Users2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{isAdmin ? 'Switch Persona (Admin)' : 'Switch User'}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {showSwitchMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Select User Persona</span>
                {!isAdmin && !adminOriginated && (
                  <span className="text-[10px] text-amber-600 font-semibold lowercase">staff mode</span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {demoAccounts.map((acc) => {
                  const isCurrent = user?.email.toLowerCase() === acc.email.toLowerCase();
                  const isAccountAdmin = acc.role === 'HR_ADMIN';
                  // Rule: Staff cannot switch to admin role
                  const isDisabled = !isAdmin && !adminOriginated && isAccountAdmin;

                  return (
                    <button
                      key={acc.id}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSwitch(acc)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs transition-colors ${
                        isCurrent ? 'bg-blue-50/70 border-l-2 border-blue-600' :
                        isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={acc.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={acc.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                            <span>{acc.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isAccountAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isAccountAdmin ? 'Admin' : 'Staff'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {isDisabled ? (
                              <span className="text-rose-600 font-medium flex items-center space-x-1">
                                <Lock className="w-3 h-3 inline mr-0.5" />
                                Restricted: Staff cannot switch to Admin
                              </span>
                            ) : (
                              acc.designation
                            )}
                          </div>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      {isDisabled && <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {!isAdmin && !adminOriginated && (
                <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400 italic">
                  Note: Role escalation to HR Administrator is locked for staff accounts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statutory Info Modal */}
      {showStatutoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">Sri Lanka 2026 Statutory Compliance</h3>
              </div>
              <button
                onClick={() => setShowStatutoryModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p className="text-slate-600 leading-relaxed">
                PayRolleey strictly complies with the Inland Revenue Department (IRD) and Sri Lanka EPF/ETF statutory regulations for 2026:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="font-bold text-blue-900 text-sm">8.0%</div>
                  <div className="text-slate-600 font-medium mt-0.5">Employee EPF Deduction</div>
                  <div className="text-[11px] text-slate-500 mt-1">Deducted from gross earnings</div>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <div className="font-bold text-indigo-900 text-sm">15.0%</div>
                  <div className="text-slate-600 font-medium mt-0.5">Employer Contributions</div>
                  <div className="text-[11px] text-slate-500 mt-1">12% EPF + 3% ETF (Cost to Company)</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100 font-bold text-slate-800 flex items-center justify-between">
                  <span>2026 APIT (PAYE) Progressive Tax Bands</span>
                  <span className="text-[11px] text-blue-700 font-medium">Relief: LKR 150,000 / mo</span>
                </div>
                <div className="divide-y divide-slate-100 text-[11px]">
                  <div className="px-3.5 py-1.5 flex justify-between">
                    <span className="text-slate-600">First LKR 83,333.33</span>
                    <span className="font-semibold text-slate-900">6%</span>
                  </div>
                  <div className="px-3.5 py-1.5 flex justify-between">
                    <span className="text-slate-600">Next LKR 41,666.67</span>
                    <span className="font-semibold text-slate-900">18%</span>
                  </div>
                  <div className="px-3.5 py-1.5 flex justify-between">
                    <span className="text-slate-600">Next LKR 41,666.67</span>
                    <span className="font-semibold text-slate-900">24%</span>
                  </div>
                  <div className="px-3.5 py-1.5 flex justify-between">
                    <span className="text-slate-600">Next LKR 41,666.67</span>
                    <span className="font-semibold text-slate-900">30%</span>
                  </div>
                  <div className="px-3.5 py-1.5 flex justify-between bg-amber-50/50">
                    <span className="text-amber-900 font-medium">Any remaining balance</span>
                    <span className="font-bold text-amber-700">36%</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Taxable Income = Gross Salary − Employee 8% EPF. No APIT applies for taxable earnings up to LKR 150,000.
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowStatutoryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Close Compliance Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
