import React, { useState, useEffect } from 'react';
import {
  Calculator,
  PlayCircle,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Eye,
  FileCheck2,
  DollarSign,
  Plus,
  Minus,
  X
} from 'lucide-react';
import { apiFetch, formatLKR } from '../api';

export default function PayrollProcessingEngine({ onCompleteRun }) {
  // Period settings
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState('MONTHLY');
  const [periodMonth, setPeriodMonth] = useState(currentDate.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(currentDate.getFullYear());

  // Dynamic adjustments per employee: { [empId]: { allowances, bonuses, overtimeHours, unpaidLeaveDays, otherDeductions } }
  const [adjustments, setAdjustments] = useState({});

  // Calculation results
  const [previewData, setPreviewData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState(null);
  const [selectedApitDetail, setSelectedApitDetail] = useState(null);

  // Debounced auto-preview when period or adjustments change
  async function runCalculationPreview() {
    setCalculating(true);
    try {
      const res = await apiFetch('/payroll/preview', {
        method: 'POST',
        body: JSON.stringify({
          periodType,
          periodMonth: parseInt(periodMonth, 10),
          periodYear: parseInt(periodYear, 10),
          adjustments
        })
      });
      if (res.success) {
        setPreviewData(res);
      }
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setCalculating(false);
    }
  }

  useEffect(() => {
    runCalculationPreview();
  }, [periodType, periodMonth, periodYear, adjustments]);

  const handleAdjustmentChange = (empId, field, value) => {
    const num = parseFloat(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [field]: num
      }
    }));
  };

  async function handleExecuteRun() {
    if (!window.confirm(`Are you sure you want to execute and lock in the ${periodType} payroll run for ${periodMonth}/${periodYear}? This will generate official payslips for all active employees.`)) {
      return;
    }

    setExecuting(true);
    try {
      const res = await apiFetch('/payroll/execute', {
        method: 'POST',
        body: JSON.stringify({
          periodType,
          periodMonth: parseInt(periodMonth, 10),
          periodYear: parseInt(periodYear, 10),
          notes: `Official ${periodType} run for ${periodMonth}/${periodYear} - Sri Lanka Statutory APIT & EPF/ETF`,
          adjustments
        })
      });

      if (res.success) {
        setExecutionSuccess(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to execute payroll run');
    } finally {
      setExecuting(false);
    }
  }

  const summary = previewData?.summary || {};
  const items = previewData?.items || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-950/20 ring-1 ring-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Sri Lanka 2026 Statutory Compliance Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Run Payroll & Calculate Liabilities</h2>
          <p className="text-xs text-slate-300">
            Real-time automated computation of Gross Earnings, EPF (8% / 12%), ETF (3%), and Inland Revenue APIT progressive bands.
          </p>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecuteRun}
          disabled={executing || items.length === 0}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 self-start md:self-auto disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4 text-slate-950" />
          <span>{executing ? 'Executing Run...' : 'Execute & Finalize Payroll Run'}</span>
        </button>
      </div>

      {/* Execution Success Card */}
      {executionSuccess && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 space-y-3 shadow-md animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-bold text-base text-emerald-900">
                  Payroll Run {executionSuccess.runNumber} Successfully Executed!
                </h3>
                <p className="text-xs text-emerald-700">
                  All payslips have been locked and generated with full Sri Lanka statutory EPF/ETF & APIT schedules.
                </p>
              </div>
            </div>
            <button
              onClick={() => onCompleteRun('reports')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              View in Historical Ledger
            </button>
          </div>
        </div>
      )}

      {/* Pay Period Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Frequency / Period Type</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value="MONTHLY">Monthly Run</option>
              <option value="BI_WEEKLY">Bi-Weekly Run</option>
              <option value="WEEKLY">Weekly Run</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Pay Period Month</label>
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(parseInt(e.target.value, 10))}
              className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {[
                { m: 1, name: 'January' }, { m: 2, name: 'February' }, { m: 3, name: 'March' },
                { m: 4, name: 'April' }, { m: 5, name: 'May' }, { m: 6, name: 'June' },
                { m: 7, name: 'July' }, { m: 8, name: 'August' }, { m: 9, name: 'September' },
                { m: 10, name: 'October' }, { m: 11, name: 'November' }, { m: 12, name: 'December' }
              ].map(opt => (
                <option key={opt.m} value={opt.m}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Calendar Year</label>
            <select
              value={periodYear}
              onChange={(e) => setPeriodYear(parseInt(e.target.value, 10))}
              className="mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              <option value={2026}>2026 (Statutory 2026 Rules)</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          {calculating && (
            <span className="flex items-center space-x-1.5 text-blue-600 font-medium">
              <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              <span>Live Recalculating...</span>
            </span>
          )}
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono font-medium">
            Active Roster: {items.length} employees
          </span>
        </div>
      </div>

      {/* Company Summary Bar (Totals) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Gross */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Gross Pay</span>
          <div className="text-base font-bold text-slate-900 mt-1">{formatLKR(summary.totalGross)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Base + Additions</div>
        </div>

        {/* Total Employee EPF (8%) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Employee EPF (8%)</span>
          <div className="text-base font-bold text-rose-600 mt-1">{formatLKR(summary.totalEmployeeEpf)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Statutory Withholding</div>
        </div>

        {/* Total APIT Tax */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">IRD APIT Tax</span>
          <div className="text-base font-bold text-rose-600 mt-1">{formatLKR(summary.totalApit)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Progressive Bands</div>
        </div>

        {/* Total Net Pay */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-800">Total Net Disbursed</span>
          <div className="text-base font-black text-emerald-700 mt-1">{formatLKR(summary.totalNet)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Bank Direct Credit</div>
        </div>

        {/* Total Employer Contributions (15%) */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-800">Employer 15% EPF/ETF</span>
          <div className="text-base font-bold text-blue-900 mt-1">{formatLKR(summary.totalEmployerContributions)}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">12% EPF + 3% ETF</div>
        </div>

        {/* Total Cost to Company (CTC) */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-4 rounded-xl shadow-md">
          <span className="text-[10px] font-bold uppercase text-slate-300">Total Cost to Company</span>
          <div className="text-base font-black text-white mt-1">{formatLKR(summary.totalCostToCompany)}</div>
          <div className="text-[10px] text-blue-300 mt-0.5">Gross + 15% Employer</div>
        </div>
      </div>

      {/* Live Calculation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Employee Compensation & Statutory Breakdown Matrix</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            Edit yellow-accented cells (OT, Allowances, Bonuses, Deductions) for real-time recalculation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10">Employee</th>
                <th className="px-3 py-3">Base Salary</th>
                <th className="px-3 py-3 bg-amber-50/50 text-amber-900">OT (Hours)</th>
                <th className="px-3 py-3 bg-amber-50/50 text-amber-900">Allowances</th>
                <th className="px-3 py-3 bg-amber-50/50 text-amber-900">Bonus</th>
                <th className="px-3 py-3 bg-amber-50/50 text-amber-900">Unpaid Days</th>
                <th className="px-3 py-3 font-bold text-slate-900">Gross Pay</th>
                <th className="px-3 py-3 text-rose-700">EPF 8%</th>
                <th className="px-3 py-3 text-indigo-700">Taxable Inc.</th>
                <th className="px-3 py-3 text-rose-700">APIT (PAYE)</th>
                <th className="px-3 py-3 bg-amber-50/50 text-amber-900">Other Ded.</th>
                <th className="px-3 py-3 font-bold text-emerald-700 bg-emerald-50/50">Net Pay</th>
                <th className="px-3 py-3 text-blue-800">Employer 15%</th>
                <th className="px-3 py-3 font-bold text-slate-900">Company Cost (CTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const adj = adjustments[item.employeeId] || {};
                return (
                  <tr key={item.employeeId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee */}
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 shadow-r">
                      <div className="font-bold text-slate-900 text-xs">
                        {item.firstName} {item.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.employeeNumber} • {item.department}
                      </div>
                    </td>

                    {/* Base Salary */}
                    <td className="px-3 py-3 text-slate-700 font-medium">
                      {formatLKR(item.baseSalary)}
                    </td>

                    {/* Input: Overtime Hours */}
                    <td className="px-3 py-3 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={adj.overtimeHours !== undefined ? adj.overtimeHours : ''}
                        onChange={(e) => handleAdjustmentChange(item.employeeId, 'overtimeHours', e.target.value)}
                        className="w-16 p-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-amber-900 text-center focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Input: Allowances */}
                    <td className="px-3 py-3 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={adj.allowances !== undefined ? adj.allowances : ''}
                        onChange={(e) => handleAdjustmentChange(item.employeeId, 'allowances', e.target.value)}
                        className="w-20 p-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-amber-900 text-right focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Input: Bonus */}
                    <td className="px-3 py-3 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="0"
                        value={adj.bonuses !== undefined ? adj.bonuses : ''}
                        onChange={(e) => handleAdjustmentChange(item.employeeId, 'bonuses', e.target.value)}
                        className="w-20 p-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-amber-900 text-right focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Input: Unpaid Leave Days */}
                    <td className="px-3 py-3 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={adj.unpaidLeaveDays !== undefined ? adj.unpaidLeaveDays : ''}
                        onChange={(e) => handleAdjustmentChange(item.employeeId, 'unpaidLeaveDays', e.target.value)}
                        className="w-14 p-1 bg-white border border-amber-300 rounded text-xs font-mono font-bold text-rose-800 text-center focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Gross Pay */}
                    <td className="px-3 py-3 font-bold text-slate-900">
                      {formatLKR(item.grossPay)}
                    </td>

                    {/* Employee EPF 8% */}
                    <td className="px-3 py-3 text-rose-600 font-semibold">
                      − {formatLKR(item.employeeEpf)}
                    </td>

                    {/* Taxable Income */}
                    <td className="px-3 py-3 text-indigo-700 font-medium">
                      {formatLKR(item.taxableIncome)}
                    </td>

                    {/* APIT Tax with detail clicker */}
                    <td className="px-3 py-3 text-rose-600 font-semibold">
                      <div className="flex items-center space-x-1">
                        <span>{item.apitTax > 0 ? `− ${formatLKR(item.apitTax)}` : 'Rs. 0.00'}</span>
                        <button
                          onClick={() => setSelectedApitDetail(item)}
                          title="Inspect APIT Tax Progressive Bands"
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Input: Other Deductions */}
                    <td className="px-3 py-3 bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="0"
                        value={adj.otherDeductions !== undefined ? adj.otherDeductions : ''}
                        onChange={(e) => handleAdjustmentChange(item.employeeId, 'otherDeductions', e.target.value)}
                        className="w-16 p-1 bg-white border border-amber-300 rounded text-xs font-mono text-rose-900 text-right focus:ring-1 focus:ring-amber-500"
                      />
                    </td>

                    {/* Net Pay */}
                    <td className="px-3 py-3 font-black text-emerald-700 bg-emerald-50/40">
                      {formatLKR(item.netPay)}
                    </td>

                    {/* Employer 15% (12% EPF + 3% ETF) */}
                    <td className="px-3 py-3 text-blue-800 font-medium">
                      {formatLKR(item.employerContributions)}
                    </td>

                    {/* Total Cost to Company */}
                    <td className="px-3 py-3 font-bold text-slate-900">
                      {formatLKR(item.costToCompany)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Sri Lanka APIT Bands Breakdown Inspection */}
      {selectedApitDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Sri Lanka 2026 APIT Breakdown: {selectedApitDetail.firstName} {selectedApitDetail.lastName}
                </h3>
                <p className="text-[11px] text-blue-200">
                  Employee ID: {selectedApitDetail.employeeNumber} • TIN: {selectedApitDetail.taxIdentificationNumber}
                </p>
              </div>
              <button onClick={() => setSelectedApitDetail(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Gross Pay</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{formatLKR(selectedApitDetail.grossPay)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">Less 8% EPF</div>
                  <div className="text-base font-bold text-rose-600 mt-0.5">− {formatLKR(selectedApitDetail.employeeEpf)}</div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Taxable Monthly Income (Gross − 8% EPF)</span>
                  <span className="font-bold text-blue-950 text-sm">{formatLKR(selectedApitDetail.taxableIncome)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-blue-100">
                  <span>Statutory Personal Relief</span>
                  <span className="font-semibold text-emerald-700">− LKR 150,000.00</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-800 text-xs pt-1">
                  <span>Taxable Excess Above Relief</span>
                  <span>{formatLKR(Math.max(0, selectedApitDetail.taxableIncome - 150000))}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3.5 py-2 bg-slate-100 font-bold text-slate-800 text-[11px]">
                  Applied Progressive Tax Bands
                </div>
                {selectedApitDetail.apitDetails?.bandsBreakdown?.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic">
                    Taxable income is within the LKR 150,000 tax-free personal relief threshold. Zero APIT tax payable.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-[11px]">
                    {selectedApitDetail.apitDetails?.bandsBreakdown?.map((band, idx) => (
                      <div key={idx} className="px-3.5 py-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{band.label}</div>
                          <div className="text-[10px] text-slate-400">
                            Taxable slice: {formatLKR(band.taxableAmount)} × {band.rate}%
                          </div>
                        </div>
                        <div className="font-bold text-rose-600 text-xs">
                          {formatLKR(band.taxAmount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-3.5 py-2.5 bg-rose-50 border-t border-rose-100 flex items-center justify-between font-bold text-rose-900 text-xs">
                  <span>Total Sri Lanka APIT Withholding</span>
                  <span className="text-sm">{formatLKR(selectedApitDetail.apitTax)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedApitDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
