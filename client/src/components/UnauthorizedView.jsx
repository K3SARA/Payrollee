import React from 'react';
import { ShieldX, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedView({ onBack }) {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
          <ShieldX className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-xl font-bold text-slate-900 pt-2">Administrative Access Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your current account (<span className="font-semibold text-slate-700">{user?.email}</span>) has an <span className="font-medium text-emerald-600">EMPLOYEE</span> role.
            Under data isolation rules, company-wide payroll execution and the global directory are restricted to <span className="font-semibold text-purple-700">HR_ADMIN</span>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
          <div className="flex items-center font-semibold text-slate-800 space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Need to test administrative capabilities?</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Use the <strong>"Switch Role / User"</strong> dropdown in the top header and select <strong>Sanduni (HR Administrator)</strong>.
          </p>
        </div>

        <button
          onClick={onBack}
          className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Personal Dashboard</span>
        </button>
      </div>
    </div>
  );
}
