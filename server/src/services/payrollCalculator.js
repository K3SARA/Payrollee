/**
 * Sri Lanka 2026 Statutory Compliance & Payroll Engine
 * 
 * Rules:
 * 1. Employee EPF: Exactly 8% of employee's gross earnings.
 * 2. Employer EPF: 12% of employee's gross earnings (employer cost).
 * 3. Employer ETF: 3% of employee's gross earnings (employer cost).
 * 4. APIT (Advance Personal Income Tax / PAYE):
 *    - Taxable income = Gross salary - Employee 8% EPF contribution.
 *    - Statutory monthly personal relief = LKR 150,000.
 *    - Progressive monthly tax bands for remaining taxable income above 150,000:
 *        - First LKR 83,333.33 at 6%
 *        - Next LKR 41,666.67 at 18%
 *        - Next LKR 41,666.67 at 24%
 *        - Next LKR 41,666.67 at 30%
 *        - Any remaining balance at 36%
 * 5. Cost to Company (CTC) = Gross Salary + 15% Employer Contributions (12% EPF + 3% ETF).
 */

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

/**
 * Computes the Sri Lanka 2026 APIT tax breakdown and total.
 * @param {number} taxableIncome - Monthly taxable income (Gross - 8% EPF)
 * @returns {object} { apitTax, bandsBreakdown, taxableIncome, reliefApplied }
 */
function calculateApitTax(taxableIncome) {
  const safeTaxable = Math.max(0, taxableIncome);
  const MONTHLY_RELIEF = 150000;
  
  if (safeTaxable <= MONTHLY_RELIEF) {
    return {
      taxableIncome: round2(safeTaxable),
      reliefApplied: round2(safeTaxable),
      taxableExcess: 0,
      apitTax: 0,
      bandsBreakdown: []
    };
  }

  let taxableExcess = safeTaxable - MONTHLY_RELIEF;
  let remainingExcess = taxableExcess;
  let totalTax = 0;

  const BANDS = [
    { limit: 83333.33, rate: 0.06, label: 'First LKR 83,333.33 @ 6%' },
    { limit: 41666.67, rate: 0.18, label: 'Next LKR 41,666.67 @ 18%' },
    { limit: 41666.67, rate: 0.24, label: 'Next LKR 41,666.67 @ 24%' },
    { limit: 41666.67, rate: 0.30, label: 'Next LKR 41,666.67 @ 30%' },
    { limit: Infinity, rate: 0.36, label: 'Remaining Balance @ 36%' }
  ];

  const bandsBreakdown = [];

  for (const band of BANDS) {
    if (remainingExcess <= 0) break;

    const amountInBand = Math.min(remainingExcess, band.limit);
    const taxInBand = round2(amountInBand * band.rate);
    totalTax += taxInBand;

    bandsBreakdown.push({
      label: band.label,
      taxableAmount: round2(amountInBand),
      rate: band.rate * 100,
      taxAmount: taxInBand
    });

    remainingExcess -= amountInBand;
  }

  return {
    taxableIncome: round2(safeTaxable),
    reliefApplied: MONTHLY_RELIEF,
    taxableExcess: round2(taxableExcess),
    apitTax: round2(totalTax),
    bandsBreakdown
  };
}

/**
 * Calculates a complete payroll item for an employee.
 */
function calculateEmployeePayroll({
  baseSalary = 0,
  loggedHours = 160,
  overtimeHours = 0,
  allowances = 0,
  bonuses = 0,
  unpaidLeaveDays = 0,
  otherDeductions = 0,
}) {
  const safeBase = Number(baseSalary) || 0;
  const safeHours = Number(loggedHours) || 0;
  const safeOT = Number(overtimeHours) || 0;
  const safeAllowances = Number(allowances) || 0;
  const safeBonuses = Number(bonuses) || 0;
  const safeUnpaidDays = Number(unpaidLeaveDays) || 0;
  const safeOtherDeductions = Number(otherDeductions) || 0;

  // Standard overtime hourly rate: (Base Salary / 200 standard monthly working hours) * 1.5
  const hourlyRate = safeBase > 0 ? (safeBase / 200) * 1.5 : 0;
  const overtimePay = round2(safeOT * hourlyRate);

  // Daily rate for unpaid leave: (Base Salary / 25 working days)
  const dailyRate = safeBase > 0 ? safeBase / 25 : 0;
  const unpaidLeaveDeduction = round2(safeUnpaidDays * dailyRate);

  // Gross Pay calculation
  const grossPay = round2(
    Math.max(0, safeBase + overtimePay + safeAllowances + safeBonuses - unpaidLeaveDeduction)
  );

  // Statutory EPF (Employee 8%)
  const employeeEpf = round2(grossPay * 0.08);

  // Statutory Employer EPF (12%) and ETF (3%)
  const employerEpf = round2(grossPay * 0.12);
  const employerEtf = round2(grossPay * 0.03);

  // Sri Lanka APIT Tax Engine
  const taxableIncome = round2(Math.max(0, grossPay - employeeEpf));
  const apitResult = calculateApitTax(taxableIncome);
  const apitTax = apitResult.apitTax;

  // Total Employee Deductions
  const totalEmployeeDeductions = round2(employeeEpf + apitTax + safeOtherDeductions);

  // Final Net Pay
  const netPay = round2(Math.max(0, grossPay - totalEmployeeDeductions));

  // Employer Total Contributions (15% = 12% + 3%)
  const employerContributions = round2(employerEpf + employerEtf);

  // Total Cost to Company (CTC = Gross + 15%)
  const costToCompany = round2(grossPay + employerContributions);

  return {
    baseSalary: round2(safeBase),
    loggedHours: safeHours,
    overtimeHours: safeOT,
    overtimePay,
    allowances: round2(safeAllowances),
    bonuses: round2(safeBonuses),
    unpaidLeaveDays: safeUnpaidDays,
    unpaidLeaveDeduction,
    grossPay,
    employeeEpf,
    taxableIncome,
    apitTax,
    apitDetails: apitResult,
    otherDeductions: round2(safeOtherDeductions),
    netPay,
    employerEpf,
    employerEtf,
    employerContributions,
    costToCompany
  };
}

module.exports = {
  calculateApitTax,
  calculateEmployeePayroll,
  round2
};
