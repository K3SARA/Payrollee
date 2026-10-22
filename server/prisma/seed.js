const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { calculateEmployeePayroll, round2 } = require('../src/services/payrollCalculator');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PayRolleey Sri Lanka database...');

  // Clean existing data
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. HR Admin Account
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@payrolleey.lk',
      passwordHash,
      role: 'HR_ADMIN',
      isActive: true,
      employeeProfile: {
        create: {
          employeeNumber: 'EMP-0001',
          firstName: 'Sanduni',
          lastName: 'Jayawardena',
          designation: 'Head of People & Culture',
          department: 'Human Resources',
          joinDate: new Date('2022-01-15'),
          phone: '+94 77 123 4567',
          address: '45/2 Alfred House Gardens, Colombo 03',
          nicNumber: '199056401234',
          taxIdentificationNumber: 'TIN-100234567',
          bankName: 'Commercial Bank of Ceylon',
          bankBranch: 'Kollupitiya',
          accountNumber: '8001045920',
          baseSalary: 380000.00,
          currency: 'LKR',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
          employmentStatus: 'ACTIVE'
        }
      }
    },
    include: { employeeProfile: true }
  });

  console.log('Created Admin:', adminUser.email);

  // 2. Sample Employees spanning all tax brackets
  const employeesData = [
    {
      email: 'kasun.perera@payrolleey.lk',
      firstName: 'Kasun',
      lastName: 'Perera',
      designation: 'Lead Full-Stack Engineer',
      department: 'Engineering',
      joinDate: new Date('2022-06-01'),
      phone: '+94 71 456 7890',
      address: '12/4 Temple Road, Nawala, Rajagiriya',
      nicNumber: '199321408899',
      taxIdentificationNumber: 'TIN-100876543',
      bankName: 'Hatton National Bank',
      bankBranch: 'Nawala',
      accountNumber: '023010488912',
      baseSalary: 450000.00, // Hits 36% bracket
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    {
      email: 'dinithi.fernando@payrolleey.lk',
      firstName: 'Dinithi',
      lastName: 'Fernando',
      designation: 'Senior Product Designer',
      department: 'Design',
      joinDate: new Date('2023-02-15'),
      phone: '+94 76 890 1234',
      address: '78 Galle Road, Mount Lavinia',
      nicNumber: '199578103344',
      taxIdentificationNumber: 'TIN-100456789',
      bankName: 'Sampath Bank',
      bankBranch: 'Mount Lavinia',
      accountNumber: '102390123845',
      baseSalary: 240000.00, // Hits intermediate APIT brackets
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
    },
    {
      email: 'nuwan.silva@payrolleey.lk',
      firstName: 'Nuwan',
      lastName: 'Silva',
      designation: 'Finance & Accounts Specialist',
      department: 'Finance',
      joinDate: new Date('2023-08-10'),
      phone: '+94 70 334 5566',
      address: '89 Baseline Road, Dematagoda, Colombo 09',
      nicNumber: '199214702211',
      taxIdentificationNumber: 'TIN-100987654',
      bankName: 'Commercial Bank of Ceylon',
      bankBranch: 'Borella',
      accountNumber: '8005432190',
      baseSalary: 175000.00, // Hits 6% bracket slightly above 150k relief
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
    },
    {
      email: 'anjali.wickramasinghe@payrolleey.lk',
      firstName: 'Anjali',
      lastName: 'Wickramasinghe',
      designation: 'Customer Operations Specialist',
      department: 'Operations',
      joinDate: new Date('2024-01-10'),
      phone: '+94 77 987 6543',
      address: '34 Flower Road, Colombo 07',
      nicNumber: '199763205566',
      taxIdentificationNumber: 'TIN-100345678',
      bankName: 'Bank of Ceylon',
      bankBranch: 'Colombo 07',
      accountNumber: '000349812738',
      baseSalary: 110000.00, // Below 150k relief => LKR 0 APIT
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
    },
    {
      email: 'ravindu.de.silva@payrolleey.lk',
      firstName: 'Ravindu',
      lastName: 'De Silva',
      designation: 'Staff DevOps & Cloud Architect',
      department: 'Engineering',
      joinDate: new Date('2021-11-01'),
      phone: '+94 72 112 2334',
      address: '56 Hill Street, Dehiwala',
      nicNumber: '198834907722',
      taxIdentificationNumber: 'TIN-100654321',
      bankName: 'Seylan Bank',
      bankBranch: 'Dehiwala',
      accountNumber: '045012399812',
      baseSalary: 620000.00, // High bracket executive
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
    }
  ];

  const createdProfiles = [adminUser.employeeProfile];

  let empNumCounter = 2;
  for (const emp of employeesData) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        passwordHash,
        role: 'EMPLOYEE',
        isActive: true,
        employeeProfile: {
          create: {
            employeeNumber: `EMP-${String(empNumCounter).padStart(4, '0')}`,
            firstName: emp.firstName,
            lastName: emp.lastName,
            designation: emp.designation,
            department: emp.department,
            joinDate: emp.joinDate,
            phone: emp.phone,
            address: emp.address,
            nicNumber: emp.nicNumber,
            taxIdentificationNumber: emp.taxIdentificationNumber,
            bankName: emp.bankName,
            bankBranch: emp.bankBranch,
            accountNumber: emp.accountNumber,
            baseSalary: emp.baseSalary,
            currency: 'LKR',
            avatarUrl: emp.avatarUrl,
            employmentStatus: 'ACTIVE'
          }
        }
      },
      include: { employeeProfile: true }
    });
    createdProfiles.push(user.employeeProfile);
    empNumCounter++;
    console.log(`Created Employee: ${user.email} (${emp.firstName} ${emp.lastName})`);
  }

  // 3. Seed Attendance records for the past 14 days
  const today = new Date();
  for (const prof of createdProfiles) {
    for (let i = 1; i <= 10; i++) {
      const recordDate = new Date(today);
      recordDate.setDate(today.getDate() - i);
      // Skip weekends
      if (recordDate.getDay() === 0 || recordDate.getDay() === 6) continue;

      const isLate = i % 5 === 0;
      const hasOvertime = i % 3 === 0;
      const otHours = hasOvertime ? (i % 2 === 0 ? 2.5 : 1.5) : 0;

      await prisma.attendanceRecord.create({
        data: {
          employeeId: prof.id,
          date: recordDate,
          checkIn: isLate ? '09:15' : '08:30',
          checkOut: hasOvertime ? '19:30' : '17:00',
          regularHours: 8.0,
          overtimeHours: otHours,
          status: isLate ? 'LATE' : (hasOvertime ? 'OVERTIME' : 'PRESENT'),
          notes: hasOvertime ? 'Project release support' : ''
        }
      });
    }
  }
  console.log('Seeded Attendance records.');

  // 4. Seed Leave requests (Approved, Pending, and Rejected)
  await prisma.leaveRequest.create({
    data: {
      employeeId: createdProfiles[1].id, // Kasun
      leaveType: 'ANNUAL',
      startDate: new Date('2026-03-25'),
      endDate: new Date('2026-03-27'),
      totalDays: 3,
      reason: 'Family trip to Nuwara Eliya',
      status: 'APPROVED',
      approvedById: adminUser.id,
      reviewNotes: 'Approved. Enjoy your vacation!'
    }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: createdProfiles[2].id, // Dinithi
      leaveType: 'CASUAL',
      startDate: new Date('2026-04-02'),
      endDate: new Date('2026-04-03'),
      totalDays: 2,
      reason: 'Personal urgent appointment',
      status: 'PENDING'
    }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: createdProfiles[3].id, // Nuwan
      leaveType: 'SICK',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-11'),
      totalDays: 2,
      reason: 'Viral flu medical recovery',
      status: 'APPROVED',
      approvedById: adminUser.id,
      reviewNotes: 'Medical certificate verified.'
    }
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: createdProfiles[4].id, // Anjali
      leaveType: 'UNPAID',
      startDate: new Date('2026-04-14'),
      endDate: new Date('2026-04-16'),
      totalDays: 3,
      reason: 'Extended family gathering overseas',
      status: 'PENDING'
    }
  });

  console.log('Seeded Leave requests.');

  // 5. Seed Past Historical Payroll Run (e.g. February 2026)
  const prevMonth = 2;
  const prevYear = 2026;
  const runNumber = `PR-2026-02-001`;

  let totalGross = 0;
  let totalNet = 0;
  let totalEmployeeEpf = 0;
  let totalEmployerEpf = 0;
  let totalEmployerEtf = 0;
  let totalApit = 0;
  let totalCostToCompany = 0;

  const itemsToCreate = createdProfiles.map(emp => {
    // Add realistic additions
    const allowances = emp.department === 'Engineering' ? 25000 : 15000;
    const bonuses = emp.baseSalary > 400000 ? 50000 : 0;
    const overtimeHours = emp.department === 'Operations' ? 8 : 0;

    const calc = calculateEmployeePayroll({
      baseSalary: emp.baseSalary,
      loggedHours: 160,
      overtimeHours,
      allowances,
      bonuses,
      unpaidLeaveDays: 0,
      otherDeductions: 2500 // Medical insurance
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
      unpaidLeaveDays: 0,
      unpaidLeaveDeduction: 0,
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

  await prisma.payrollRun.create({
    data: {
      runNumber,
      periodType: 'MONTHLY',
      periodMonth: prevMonth,
      periodYear: prevYear,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      executionDate: new Date('2026-02-28T16:00:00Z'),
      status: 'PAID',
      totalGross: round2(totalGross),
      totalNet: round2(totalNet),
      totalEmployeeEpf: round2(totalEmployeeEpf),
      totalEmployerEpf: round2(totalEmployerEpf),
      totalEmployerEtf: round2(totalEmployerEtf),
      totalApit: round2(totalApit),
      totalCostToCompany: round2(totalCostToCompany),
      processedById: adminUser.id,
      notes: 'February 2026 Official Payroll Run - Disbursed via Commercial Bank Corporate portal',
      items: {
        create: itemsToCreate
      }
    }
  });

  console.log(`Seeded Historical Payroll Run: ${runNumber}`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
