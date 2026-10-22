import React, { useState } from 'react';
import {
  Calculator,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { loginWithCredentials, demoAccounts } = useAuth();
  const [email, setEmail] = useState('admin@payrolleey.lk');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(demoEmail) {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      await loginWithCredentials(demoEmail, 'password123');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-white ring-1 ring-white/10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20">
            <Calculator className="w-7 h-7" />
          </div>
          <div className="flex items-center justify-center space-x-1.5 pt-2">
            <h1 className="text-2xl font-black tracking-tight">PayRolleey</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              SL 2026
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Enterprise Sri Lanka Statutory Payroll Management System
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@payrolleey.lk"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* 1-Click Fast Persona Switcher */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Fast 1-Click Persona Testing:</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {demoAccounts.slice(0, 4).map((acc) => (
              <button
                key={acc.id}
                onClick={() => quickLogin(acc.email)}
                className="p-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="font-bold text-white group-hover:text-blue-400 truncate text-[11px]">
                  {acc.name.split(' ')[0]} ({acc.role === 'HR_ADMIN' ? 'Admin' : 'Staff'})
                </div>
                <div className="text-[10px] text-slate-400 truncate">{acc.designation}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
