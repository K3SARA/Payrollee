const prisma = require('../prisma');
const { calculateEmployeePayroll, round2 } = require('../services/payrollCalculator');

/**
 * Get Dashboard Data (dynamically tailored to HR_ADMIN vs EMPLOYEE)
 */
async function getDashboard(req, res) {
  try {
    const isAdmin = req.user.role === 'HR_ADMIN';

    if (isAdmin) {
      // HR ADMIN METRICS
      const [
        totalEmployees,
        activeEmployees,
        pendingLeaves,
        latestRun,
        allActiveEmployees,
        recentRuns,
        recentPendingLeaves
      ] = await Promise.all([
        prisma.employeeProfile.count(),
        prisma.employeeProfile.count({ where: { employmentStatus: 'ACTIVE' } }),
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        prisma.payrollRun.findFirst({ orderBy: { executionDate: 'desc' } }),
        prisma.employeeProfile.findMany({
          where: { employmentStatus: 'ACTIVE' },
          select: { id: true, department: true, baseSalary: true }
        }),
        prisma.payrollRun.findMany({
          orderBy: { executionDate: 'desc' },
          take: 6
        }),
        prisma.leaveRequest.findMany({
          where: { status: 'PENDING' },
          include: {
            employee: {
              select: { firstName: true, lastName: true, employeeNumber: true, department: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      // Calculate department expense breakdown
      const deptMap = {};
      let projectedGross = 0;
      let projectedCostToCompany = 0;

      for (const emp of allActiveEmployees) {
        const dept = emp.department || 'General';
        const calc = calculateEmployeePayroll({ baseSalary: emp.baseSalary });

        if (!deptMap[dept]) {
          deptMap[dept] = { department: dept, count: 0, totalSalary: 0, costToCompany: 0 };
        }
        deptMap[dept].count += 1;
        deptMap[dept].totalSalary = round2(deptMap[dept].totalSalary + emp.baseSalary);
        deptMap[dept].costToCompany = round2(deptMap[dept].costToCompany + calc.costToCompany);

        projectedGross += calc.grossPay;
        projectedCostToCompany += calc.costToCompany;
      }

      const departmentBreakdown = Object.values(deptMap).sort((a, b) => b.costToCompany - a.costToCompany);

      // Determine upcoming payroll date (e.g. 25th - 28th of current month)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const upcomingRunDate = new Date(currentYear, currentMonth, 28);

      return res.json({
        success: true,
        role: 'HR_ADMIN',
        metrics: {
          totalPayrollCost: latestRun ? latestRun.totalCostToCompany : round2(projectedCostToCompany),
          latestGrossPayroll: latestRun ? latestRun.totalGross : round2(projectedGross),
          activeEmployeesCount: activeEmployees,
          totalEmployeesCount: totalEmployees,
          pendingLeaveRequestsCount: pendingLeaves,
          upcomingPayrollDate: upcomingRunDate.toISOString().split('T')[0],
          lastRunNumber: latestRun ? latestRun.runNumber : 'No runs yet',
          lastRunDate: latestRun ? latestRun.executionDate : null
        },
        departmentBreakdown,
        payrollTrends: recentRuns.reverse().map(r => ({
          runNumber: r.runNumber,
          period: `${r.periodYear}-${String(r.periodMonth).padStart(2, '0')}`,
          totalGross: r.totalGross,
          totalNet: r.totalNet,
          costToCompany: r.totalCostToCompany,
          apitTax: r.totalApit,
          employerContributions: round2(r.totalEmployerEpf + r.totalEmployerEtf)
        })),
        recentPendingLeaves
      });

    } else {
      // EMPLOYEE METRICS (Data Isolation)
      const empId = req.user.employeeProfileId;
      if (!empId) {
        return res.status(404).json({ success: false, message: 'Employee profile not associated.' });
      }

      const [profile, pendingLeavesCount, latestPayslip, recentAttendance, recentLeaves] = await Promise.all([
        prisma.employeeProfile.findUnique({ where: { id: empId } }),
        prisma.leaveRequest.count({ where: { employeeId: empId, status: 'PENDING' } }),
        prisma.payrollItem.findFirst({
          where: { employeeId: empId },
          include: { payrollRun: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.attendanceRecord.findMany({
          where: { employeeId: empId },
          orderBy: { date: 'desc' },
          take: 7
        }),
        prisma.leaveRequest.findMany({
          where: { employeeId: empId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      const baseCalc = calculateEmployeePayroll({ baseSalary: profile.baseSalary });

      return res.json({
        success: true,
        role: 'EMPLOYEE',
        metrics: {
          baseSalary: profile.baseSalary,
          estimatedGross: baseCalc.grossPay,
          estimatedNet: baseCalc.netPay,
          employeeEpf: baseCalc.employeeEpf,
          estimatedApit: baseCalc.apitTax,
          pendingLeavesCount,
          latestPayslip: latestPayslip ? {
            id: latestPayslip.id,
            runNumber: latestPayslip.payrollRun.runNumber,
            periodMonth: latestPayslip.payrollRun.periodMonth,
            periodYear: latestPayslip.payrollRun.periodYear,
            grossPay: latestPayslip.grossPay,
            netPay: latestPayslip.netPay,
            date: latestPayslip.createdAt
          } : null
        },
        profile,
        recentAttendance,
        recentLeaves
      });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
}

module.exports = {
  getDashboard
};
