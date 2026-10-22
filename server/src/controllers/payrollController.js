const prisma = require('../prisma');
const { calculateEmployeePayroll, round2 } = require('../services/payrollCalculator');

/**
 * Preview Payroll calculation without executing
 * Accepts adjustments (bonuses, allowances, overtime, unpaid leave, custom deductions)
 */
async function calculatePreview(req, res) {
  try {
    const { periodMonth, periodYear, periodType = 'MONTHLY', adjustments = {} } = req.body;

    const currentMonth = periodMonth || new Date().getMonth() + 1;
    const currentYear = periodYear || new Date().getFullYear();

    // Fetch all active employees
    const employees = await prisma.employeeProfile.findMany({
      where: { employmentStatus: { in: ['ACTIVE', 'ON_LEAVE'] } },
      orderBy: { employeeNumber: 'asc' }
    });

    let totalGross = 0;
    let totalNet = 0;
    let totalEmployeeEpf = 0;
    let totalEmployerEpf = 0;
    let totalEmployerEtf = 0;
    let totalApit = 0;
    let totalCostToCompany = 0;

    const items = employees.map(emp => {
      const adj = adjustments[emp.id] || {};
      const baseSalary = emp.baseSalary;
      const loggedHours = adj.loggedHours !== undefined ? adj.loggedHours : 160;
      const overtimeHours = adj.overtimeHours !== undefined ? adj.overtimeHours : 0;
      const allowances = adj.allowances !== undefined ? adj.allowances : 0;
      const bonuses = adj.bonuses !== undefined ? adj.bonuses : 0;
      const unpaidLeaveDays = adj.unpaidLeaveDays !== undefined ? adj.unpaidLeaveDays : 0;
      const otherDeductions = adj.otherDeductions !== undefined ? adj.otherDeductions : 0;

      const calc = calculateEmployeePayroll({
        baseSalary,
        loggedHours,
        overtimeHours,
        allowances,
        bonuses,
        unpaidLeaveDays,
        otherDeductions
      });

      totalGross += calc.grossPay;
      totalNet += calc.netPay;
      totalEmployeeEpf += calc.employeeEpf;
      totalEmployerEpf += calc.employerEpf;
      totalEmployerEtf += calc.employerEtf;
      totalApit += calc.apitTax;
      totalCostToCompany += calc.costToCompany;

      return {
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        firstName: emp.firstName,
        lastName: emp.lastName,
        designation: emp.designation,
        department: emp.department,
        bankName: emp.bankName,
        accountNumber: emp.accountNumber,
        nicNumber: emp.nicNumber,
        taxIdentificationNumber: emp.taxIdentificationNumber,
        avatarUrl: emp.avatarUrl,
        ...calc
      };
    });

    return res.json({
      success: true,
      period: {
        periodMonth: currentMonth,
        periodYear: currentYear,
        periodType
      },
      summary: {
        employeeCount: employees.length,
        totalGross: round2(totalGross),
        totalNet: round2(totalNet),
        totalEmployeeEpf: round2(totalEmployeeEpf),
        totalEmployerEpf: round2(totalEmployerEpf),
        totalEmployerEtf: round2(totalEmployerEtf),
        totalEmployerContributions: round2(totalEmployerEpf + totalEmployerEtf),
        totalApit: round2(totalApit),
        totalCostToCompany: round2(totalCostToCompany)
      },
      items
    });
  } catch (error) {
    console.error('Error previewing payroll:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate payroll preview.' });
  }
}

/**
 * Execute and lock in a payroll run (Admin only)
 */
async function executePayrollRun(req, res) {
  try {
    const {
      periodMonth,
      periodYear,
      periodType = 'MONTHLY',
      startDate,
      endDate,
      notes = '',
      adjustments = {}
    } = req.body;

    const month = parseInt(periodMonth, 10);
    const year = parseInt(periodYear, 10);

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Valid month and year are required.' });
    }

    // Check if run already exists for this period
    const existing = await prisma.payrollRun.findFirst({
      where: {
        periodMonth: month,
        periodYear: year,
        periodType
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Payroll run already exists for ${periodType} ${month}/${year} (Run: ${existing.runNumber}).`
      });
    }

    // Fetch active employees
    const employees = await prisma.employeeProfile.findMany({
      where: { employmentStatus: { in: ['ACTIVE', 'ON_LEAVE'] } }
    });

    if (employees.length === 0) {
      return res.status(400).json({ success: false, message: 'No active employees found to process payroll.' });
    }

    // Generate unique Run Number
    const count = await prisma.payrollRun.count();
    const runNumber = `PR-${year}-${String(month).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`;

    let totalGross = 0;
    let totalNet = 0;
    let totalEmployeeEpf = 0;
    let totalEmployerEpf = 0;
    let totalEmployerEtf = 0;
    let totalApit = 0;
    let totalCostToCompany = 0;

    const itemsToCreate = employees.map(emp => {
      const adj = adjustments[emp.id] || {};
      const baseSalary = emp.baseSalary;
      const loggedHours = adj.loggedHours !== undefined ? adj.loggedHours : 160;
      const overtimeHours = adj.overtimeHours !== undefined ? adj.overtimeHours : 0;
      const allowances = adj.allowances !== undefined ? adj.allowances : 0;
      const bonuses = adj.bonuses !== undefined ? adj.bonuses : 0;
      const unpaidLeaveDays = adj.unpaidLeaveDays !== undefined ? adj.unpaidLeaveDays : 0;
      const otherDeductions = adj.otherDeductions !== undefined ? adj.otherDeductions : 0;

      const calc = calculateEmployeePayroll({
        baseSalary,
        loggedHours,
        overtimeHours,
        allowances,
        bonuses,
        unpaidLeaveDays,
        otherDeductions
      });

      totalGross += calc.grossPay;
      totalNet += calc.netPay;
      totalEmployeeEpf += calc.employeeEpf;
      totalEmployerEpf += calc.employerEpf;
      totalEmployerEtf += calc.employerEtf;
      totalApit += calc.apitTax;
      totalCostToCompany += calc.costToCompany;

      return {
        employeeId: emp.id,
        baseSalary: calc.baseSalary,
        loggedHours: calc.loggedHours,
        overtimeHours: calc.overtimeHours,
        overtimePay: calc.overtimePay,
        allowances: calc.allowances,
        bonuses: calc.bonuses,
        unpaidLeaveDays: calc.unpaidLeaveDays,
        unpaidLeaveDeduction: calc.unpaidLeaveDeduction,
        grossPay: calc.grossPay,
        employeeEpf: calc.employeeEpf,
        taxableIncome: calc.taxableIncome,
        apitTax: calc.apitTax,
        otherDeductions: calc.otherDeductions,
        netPay: calc.netPay,
        employerEpf: calc.employerEpf,
        employerEtf: calc.employerEtf,
        costToCompany: calc.costToCompany,
        status: 'ISSUED'
      };
    });

    const sDate = startDate ? new Date(startDate) : new Date(year, month - 1, 1);
    const eDate = endDate ? new Date(endDate) : new Date(year, month, 0);

    const payrollRun = await prisma.payrollRun.create({
      data: {
        runNumber,
        periodType,
        periodMonth: month,
        periodYear: year,
        startDate: sDate,
        endDate: eDate,
        executionDate: new Date(),
        status: 'PROCESSED',
        totalGross: round2(totalGross),
        totalNet: round2(totalNet),
        totalEmployeeEpf: round2(totalEmployeeEpf),
        totalEmployerEpf: round2(totalEmployerEpf),
        totalEmployerEtf: round2(totalEmployerEtf),
        totalApit: round2(totalApit),
        totalCostToCompany: round2(totalCostToCompany),
        processedById: req.user.id,
        notes,
        items: {
          create: itemsToCreate
        }
      },
      include: {
        items: {
          include: {
            employee: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: `Payroll run ${runNumber} processed successfully.`,
      data: payrollRun
    });
  } catch (error) {
    console.error('Error executing payroll run:', error);
    return res.status(500).json({ success: false, message: 'Failed to process payroll run.' });
  }
}

/**
 * Get all historical payroll runs
 */
async function getAllPayrollRuns(req, res) {
  try {
    const runs = await prisma.payrollRun.findMany({
      include: {
        processedBy: { select: { email: true } },
        _count: { select: { items: true } }
      },
      orderBy: { executionDate: 'desc' }
    });

    return res.json({ success: true, data: runs });
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll runs.' });
  }
}

/**
 * Get single payroll run with items and breakdown
 */
async function getPayrollRunById(req, res) {
  try {
    const { id } = req.params;

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        processedBy: { select: { email: true } },
        items: {
          include: {
            employee: true
          },
          orderBy: { employee: { employeeNumber: 'asc' } }
        }
      }
    });

    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found.' });
    }

    return res.json({ success: true, data: run });
  } catch (error) {
    console.error('Error fetching payroll run:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payroll run details.' });
  }
}

/**
 * Get Payslips list
 * Data isolated: Employee only sees their own payslips
 */
async function getPayslips(req, res) {
  try {
    const isAdmin = req.user.role === 'HR_ADMIN';
    const { runId, employeeId } = req.query;

    const where = {};

    if (!isAdmin) {
      where.employeeId = req.user.employeeProfileId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (runId) {
      where.payrollRunId = runId;
    }

    const payslips = await prisma.payrollItem.findMany({
      where,
      include: {
        payrollRun: true,
        employee: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: payslips });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payslips.' });
  }
}

/**
 * Get detailed single payslip with statutory breakdown
 */
async function getPayslipById(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'HR_ADMIN';

    const payslip = await prisma.payrollItem.findUnique({
      where: { id },
      include: {
        payrollRun: true,
        employee: {
          include: {
            user: { select: { email: true } }
          }
        }
      }
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found.' });
    }

    // Data isolation check
    if (!isAdmin && req.user.employeeProfileId !== payslip.employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own payslip.' });
    }

    // Format rich APIT bands breakdown for transparency
    const { calculateApitTax } = require('../services/payrollCalculator');
    const apitBreakdown = calculateApitTax(payslip.taxableIncome);

    return res.json({
      success: true,
      data: {
        ...payslip,
        apitBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching payslip:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payslip details.' });
  }
}

module.exports = {
  calculatePreview,
  executePayrollRun,
  getAllPayrollRuns,
  getPayrollRunById,
  getPayslips,
  getPayslipById
};
