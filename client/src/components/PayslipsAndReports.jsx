import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building,
  CheckCircle2,
  Eye,
  X,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Banknote,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { apiFetch, formatLKR, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PayslipsAndReports({ initialPayslipId = null, onClearInitial }) {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'ledger' : 'payslips'); // 'ledger' or 'payslips'

  // Data
  const [runs, setRuns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Payslip for High-Resolution Print View
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [loadingPayslip, setLoadingPayslip] = useState(false);

  // Selected Run for Full Run Inspection
  const [selectedRun, setSelectedRun] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      if (isAdmin) {
        const [runsRes, payslipsRes] = await Promise.all([
          apiFetch('/payroll/runs'),
          apiFetch('/payroll/payslips')
        ]);
        if (runsRes.success) setRuns(runsRes.data);
        if (payslipsRes.success) setPayslips(payslipsRes.data);
      } else {
        const payslipsRes = await apiFetch('/payroll/payslips');
        if (payslipsRes.success) setPayslips(payslipsRes.data);
      }
    } catch (err) {
      console.error('Error loading reports', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle opening a payslip directly if passed via prop
  useEffect(() => {
    if (initialPayslipId) {
      handleOpenPayslip(initialPayslipId);
      if (onClearInitial) onClearInitial();
    }
  }, [initialPayslipId]);

  async function handleOpenPayslip(id) {
    setLoadingPayslip(true);
    try {
      const res = await apiFetch(`/payroll/payslips/${id}`);
      if (res.success) {
        setSelectedPayslip(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to load payslip');
    } finally {
      setLoadingPayslip(false);
    }
  }

  async function handleOpenRun(id) {
    try {
      const res = await apiFetch(`/payroll/runs/${id}`);
      if (res.success) {
        setSelectedRun(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to load payroll run');
    }
  }

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Historical Payroll Ledger & Payslips' : 'My Official Payslips & Statements'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade Sri Lanka statutory payslips with separate EPF/ETF contributions and APIT schedules.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Payroll Runs Ledger
            </button>
            <button
              onClick={() => setActiveTab('payslips')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'payslips'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Generated Payslips
            </button>
          </div>
        )}
      </div>

      {/* View 1: Payroll Runs Ledger (Admin only) */}
      {isAdmin && activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading payroll ledger...</div>
          ) : runs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No payroll runs executed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Run Number</th>
                    <th className="px-5 py-3.5">Period</th>
                    <th className="px-5 py-3.5">Processed Date</th>
                    <th className="px-5 py-3.5">Total Gross</th>
                    <th className="px-5 py-3.5 text-rose-600">Employee EPF 8%</th>
                    <th className="px-5 py-3.5 text-rose-600">APIT Tax</th>
                    <th className="px-5 py-3.5 text-emerald-700">Net Disbursed</th>
                    <th className="px-5 py-3.5 text-blue-900">Employer 15%</th>
                    <th className="px-5 py-3.5 font-bold text-slate-900">Total Cost (CTC)</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 font-mono">{r.runNumber}</div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-800 font-medium">
                        {r.periodYear}-{String(r.periodMonth).padStart(2, '0')} ({r.periodType})
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(r.executionDate)}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatLKR(r.totalGross)}
                      </td>

                      <td className="px-5 py-3.5 text-rose-600">
                        {formatLKR(r.totalEmployeeEpf)}
                      </td>

                      <td className="px-5 py-3.5 text-rose-600 font-medium">
                        {formatLKR(r.totalApit)}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-emerald-700">
                        {formatLKR(r.totalNet)}
                      </td>

                      <td className="px-5 py-3.5 text-blue-900">
                        {formatLKR(r.totalEmployerEpf + r.totalEmployerEtf)}
                      </td>

                      <td className="px-5 py-3.5 font-black text-slate-900">
                        {formatLKR(r.totalCostToCompany)}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenRun(r.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Run</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* View 2: Generated Payslips Table (Individual slips) */}
      {(activeTab === 'payslips' || !isAdmin) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No payslips issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Payslip Number & Run</th>
                    <th className="px-5 py-3.5">Employee</th>
                    <th className="px-5 py-3.5">Period</th>
                    <th className="px-5 py-3.5">Gross Earnings</th>
                    <th className="px-5 py-3.5 text-rose-600">Employee Deductions</th>
                    <th className="px-5 py-3.5 text-emerald-700 font-bold">Net Take-Home</th>
                    <th className="px-5 py-3.5 text-blue-800">Employer 15% EPF/ETF</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map((p) => {
                    const empDeductions = p.employeeEpf + p.apitTax + p.otherDeductions;
                    const employerCosts = p.employerEpf + p.employerEtf;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 font-mono">
                            {p.payrollRun?.runNumber || 'SL-PAYSLIP'}
                          </div>
                          <div className="text-[10px] text-slate-400">ID: {p.id.slice(0, 8)}</div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">
                            {p.employee?.firstName} {p.employee?.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.employee?.employeeNumber} • {p.employee?.department}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-700">
                          {p.payrollRun?.periodYear}-{String(p.payrollRun?.periodMonth).padStart(2, '0')}
                        </td>

                        <td className="px-5 py-3.5 font-semibold text-slate-900">
                          {formatLKR(p.grossPay)}
                        </td>

                        <td className="px-5 py-3.5 text-rose-600">
                          − {formatLKR(empDeductions)}
                          <div className="text-[10px] text-slate-400">8% EPF + APIT</div>
                        </td>

                        <td className="px-5 py-3.5 font-black text-emerald-700 text-sm">
                          {formatLKR(p.netPay)}
                        </td>

                        <td className="px-5 py-3.5 text-blue-900 font-medium">
                          +{formatLKR(employerCosts)}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenPayslip(p.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs inline-flex items-center space-x-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View & Print</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Full Run Breakdown Inspection */}
      {selectedRun && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Payroll Run Summary: {selectedRun.runNumber}</h3>
                <p className="text-xs text-slate-300">
                  Executed on {formatDate(selectedRun.executionDate)} • Status: {selectedRun.status}
                </p>
              </div>
              <button onClick={() => setSelectedRun(null)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Gross</div>
                  <div className="text-base font-bold text-slate-900 mt-1">{formatLKR(selectedRun.totalGross)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Employee EPF (8%)</div>
                  <div className="text-base font-bold text-rose-600 mt-1">{formatLKR(selectedRun.totalEmployeeEpf)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Net Disbursed</div>
                  <div className="text-base font-bold text-emerald-700 mt-1">{formatLKR(selectedRun.totalNet)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Cost (CTC)</div>
                  <div className="text-base font-bold text-blue-900 mt-1">{formatLKR(selectedRun.totalCostToCompany)}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-100 font-bold text-slate-800 text-xs">
                  Employees in this Run ({selectedRun.items?.length || 0})
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {selectedRun.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">
                          {item.employee?.firstName} {item.employee?.lastName} ({item.employee?.employeeNumber})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Gross: {formatLKR(item.grossPay)} • 8% EPF: −{formatLKR(item.employeeEpf)} • APIT: −{formatLKR(item.apitTax)}
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <div>
                          <div className="font-bold text-emerald-700">{formatLKR(item.netPay)}</div>
                          <div className="text-[10px] text-slate-400">Net Take-Home</div>
                        </div>
                        <button
                          onClick={() => handleOpenPayslip(item.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                        >
                          Payslip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          HIGH-RESOLUTION PRINTABLE OFFICIAL PAYSLIP MODAL
          ========================================================================= */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Toolbar (hidden when printing) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Official Sri Lanka Payslip & Statement</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerPrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-2 text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div id="printable-payslip" className="p-8 space-y-6 text-slate-800 bg-white">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black flex items-center justify-center text-base">
                      P
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tight">PayRolleey Technologies (Pvt) Ltd</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Level 18, West Tower, World Trade Center, Echelon Square, Colombo 01, Sri Lanka
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Business Reg: PV-90124 | Employer EPF Reg No: EPF/COL/2026/8940
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 uppercase tracking-wider">OFFICIAL PAYSLIP</div>
                  <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                    {selectedPayslip.payrollRun?.runNumber || 'PR-2026'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pay Period: {selectedPayslip.payrollRun?.periodYear}-{String(selectedPayslip.payrollRun?.periodMonth).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Employee & Bank Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div>Employee Name: <strong className="text-slate-900">{selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</strong></div>
                  <div>Employee ID: <strong className="text-slate-900 font-mono">{selectedPayslip.employee?.employeeNumber}</strong></div>
                  <div>Designation: <span className="text-slate-700">{selectedPayslip.employee?.designation}</span></div>
                  <div>Department: <span className="text-slate-700">{selectedPayslip.employee?.department}</span></div>
                </div>

                <div className="space-y-1">
                  <div>NIC Number: <strong className="text-slate-900 font-mono">{selectedPayslip.employee?.nicNumber}</strong></div>
                  <div>Sri Lanka TIN: <strong className="text-slate-900 font-mono">{selectedPayslip.employee?.taxIdentificationNumber}</strong></div>
                  <div>Bank Name: <span className="text-slate-700">{selectedPayslip.employee?.bankName}</span> ({selectedPayslip.employee?.bankBranch})</div>
                  <div>Account No: <strong className="text-slate-900 font-mono">****{selectedPayslip.employee?.accountNumber?.slice(-4) || '----'}</strong></div>
                </div>
              </div>

              {/* 2-Column Earnings & Employee Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                {/* Column 1: Earnings */}
                <div className="space-y-3">
                  <div className="pb-1.5 border-b border-slate-300 font-bold text-slate-900 uppercase tracking-wider text-[11px] flex justify-between">
                    <span>Earnings</span>
                    <span>Amount (LKR)</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Monthly Salary</span>
                      <span className="font-semibold text-slate-800">{formatLKR(selectedPayslip.baseSalary)}</span>
                    </div>

                    {selectedPayslip.overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Overtime Pay ({selectedPayslip.overtimeHours} hrs @ 1.5x)</span>
                        <span className="font-semibold text-emerald-700">+{formatLKR(selectedPayslip.overtimePay)}</span>
                      </div>
                    )}

                    {selectedPayslip.allowances > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Fixed Allowances</span>
                        <span className="font-semibold text-emerald-700">+{formatLKR(selectedPayslip.allowances)}</span>
                      </div>
                    )}

                    {selectedPayslip.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Performance Bonus</span>
                        <span className="font-semibold text-emerald-700">+{formatLKR(selectedPayslip.bonuses)}</span>
                      </div>
                    )}

                    {selectedPayslip.unpaidLeaveDeduction > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Unpaid Leave ({selectedPayslip.unpaidLeaveDays} days)</span>
                        <span>−{formatLKR(selectedPayslip.unpaidLeaveDeduction)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Gross Earnings</span>
                    <span>{formatLKR(selectedPayslip.grossPay)}</span>
                  </div>
                </div>

                {/* Column 2: Employee Deductions */}
                <div className="space-y-3">
                  <div className="pb-1.5 border-b border-slate-300 font-bold text-slate-900 uppercase tracking-wider text-[11px] flex justify-between">
                    <span>Employee Deductions</span>
                    <span>Amount (LKR)</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-slate-700 font-medium">Employee EPF (8.0%)</span>
                        <div className="text-[10px] text-slate-400">Deducted from gross</div>
                      </div>
                      <span className="font-bold text-rose-600">− {formatLKR(selectedPayslip.employeeEpf)}</span>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <span className="text-slate-700 font-medium">Sri Lanka APIT (PAYE Tax)</span>
                        <div className="text-[10px] text-slate-400">IRD 2026 Progressive Scale</div>
                      </div>
                      <span className="font-bold text-rose-600">
                        {selectedPayslip.apitTax > 0 ? `− ${formatLKR(selectedPayslip.apitTax)}` : 'Rs. 0.00 (Exempt)'}
                      </span>
                    </div>

                    {selectedPayslip.otherDeductions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Other Deductions / Medical</span>
                        <span className="font-semibold text-rose-600">− {formatLKR(selectedPayslip.otherDeductions)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-bold text-rose-700 text-sm">
                    <span>Total Deductions</span>
                    <span>− {formatLKR(selectedPayslip.employeeEpf + selectedPayslip.apitTax + selectedPayslip.otherDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl flex items-center justify-between shadow-md">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                    Net Take-Home Remittance
                  </div>
                  <div className="text-[11px] text-emerald-100 mt-0.5">
                    Directly transferred to {selectedPayslip.employee?.bankName} A/C ****{selectedPayslip.employee?.accountNumber?.slice(-4) || '----'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black">{formatLKR(selectedPayslip.netPay)}</div>
                </div>
              </div>

              {/* Employer Statutory Contributions Section (12% EPF + 3% ETF) */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                <div className="font-bold text-blue-900 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Employer Statutory Contributions (Not Deducted From Employee)</span>
                  <span className="text-blue-700">15.0% Statutory Overhead</span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <div className="text-slate-500">Employer EPF (12.0%)</div>
                    <div className="font-bold text-blue-950 mt-0.5">{formatLKR(selectedPayslip.employerEpf)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Employer ETF (3.0%)</div>
                    <div className="font-bold text-blue-950 mt-0.5">{formatLKR(selectedPayslip.employerEtf)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total Cost to Company (CTC)</div>
                    <div className="font-black text-blue-950 mt-0.5">{formatLKR(selectedPayslip.costToCompany)}</div>
                  </div>
                </div>
              </div>

              {/* Sri Lanka IRD APIT Tax Note & Verification */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
                <div>
                  Generated under Sri Lanka Inland Revenue Act & Statutory EPF/ETF Directives for 2026.
                </div>
                <div className="font-mono">
                  System Auth Hash: {selectedPayslip.id.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end no-print">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
