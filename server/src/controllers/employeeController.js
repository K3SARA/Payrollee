const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

/**
 * Get all employees with search and department filtering (Admin only)
 */
async function getAllEmployees(req, res) {
  try {
    const { search, department, status, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 50 } = req.query;

    const where = {};

    if (status) {
      where.employmentStatus = status;
    }

    if (department && department !== 'ALL') {
      where.department = department;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { employeeNumber: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { nicNumber: { contains: q, mode: 'insensitive' } },
        { taxIdentificationNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, employees] = await Promise.all([
      prisma.employeeProfile.count({ where }),
      prisma.employeeProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, role: true, isActive: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum
      })
    ]);

    return res.json({
      success: true,
      data: employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employees.' });
  }
}

/**
 * Get single employee profile
 */
async function getEmployeeById(req, res) {
  try {
    const { id } = req.params;

    // Check data isolation: if not HR_ADMIN, employee can only access their own profile
    if (req.user.role !== 'HR_ADMIN' && req.user.employeeProfileId !== id) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only view your own profile.' });
    }

    const employee = await prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, isActive: true } },
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 30
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payrollItems: {
          include: { payrollRun: true },
          orderBy: { createdAt: 'desc' },
          take: 12
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    return res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch employee details.' });
  }
}

/**
 * Create new employee with User account (HR_ADMIN only)
 */
async function createEmployee(req, res) {
  try {
    const {
      email,
      password = 'password123',
      role = 'EMPLOYEE',
      firstName,
      lastName,
      designation,
      department,
      joinDate,
      phone,
      address,
      nicNumber,
      taxIdentificationNumber,
      bankName,
      bankBranch,
      accountNumber,
      baseSalary,
      avatarUrl
    } = req.body;

    if (!email || !firstName || !lastName || !baseSalary || !nicNumber || !taxIdentificationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: email, firstName, lastName, baseSalary, nicNumber, taxIdentificationNumber.'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate unique employee number
    const count = await prisma.employeeProfile.count();
    const employeeNumber = `EMP-${String(count + 101).padStart(4, '0')}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User and EmployeeProfile in transaction
    const newRecord = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          role: role === 'HR_ADMIN' ? 'HR_ADMIN' : 'EMPLOYEE',
          isActive: true
        }
      });

      const profile = await tx.employeeProfile.create({
        data: {
          userId: user.id,
          employeeNumber,
          firstName,
          lastName,
          designation: designation || 'Associate',
          department: department || 'Operations',
          joinDate: joinDate ? new Date(joinDate) : new Date(),
          phone: phone || '',
          address: address || '',
          nicNumber,
          taxIdentificationNumber,
          bankName: bankName || 'Commercial Bank of Ceylon',
          bankBranch: bankBranch || 'Colombo Fort',
          accountNumber: accountNumber || '8001234567',
          baseSalary: parseFloat(baseSalary),
          currency: 'LKR',
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-${1534528741775 + count}?w=150&auto=format&fit=crop&q=80`
        },
        include: {
          user: { select: { id: true, email: true, role: true } }
        }
      });

      return profile;
    });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({ success: false, message: 'Failed to create employee.' });
  }
}

/**
 * Update employee profile
 * HR_ADMIN can update everything.
 * EMPLOYEE can only update contact information (phone, address).
 */
async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'HR_ADMIN';

    // Data isolation check
    if (!isAdmin && req.user.employeeProfileId !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this employee.' });
    }

    const existing = await prisma.employeeProfile.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    let updateData = {};

    if (isAdmin) {
      // HR Admin can update all fields
      const {
        firstName,
        lastName,
        designation,
        department,
        joinDate,
        phone,
        address,
        nicNumber,
        taxIdentificationNumber,
        bankName,
        bankBranch,
        accountNumber,
        baseSalary,
        employmentStatus,
        avatarUrl
      } = req.body;

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (designation !== undefined) updateData.designation = designation;
      if (department !== undefined) updateData.department = department;
      if (joinDate !== undefined) updateData.joinDate = new Date(joinDate);
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (nicNumber !== undefined) updateData.nicNumber = nicNumber;
      if (taxIdentificationNumber !== undefined) updateData.taxIdentificationNumber = taxIdentificationNumber;
      if (bankName !== undefined) updateData.bankName = bankName;
      if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
      if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
      if (baseSalary !== undefined) updateData.baseSalary = parseFloat(baseSalary);
      if (employmentStatus !== undefined) updateData.employmentStatus = employmentStatus;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    } else {
      // Employee self-update: only phone & address allowed
      const { phone, address } = req.body;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
    }

    const updated = await prisma.employeeProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true, role: true } }
      }
    });

    return res.json({
      success: true,
      message: 'Employee profile updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ success: false, message: 'Failed to update employee.' });
  }
}

/**
 * Delete employee (HR_ADMIN only)
 */
async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    const employee = await prisma.employeeProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Deleting the user will cascade delete employee profile
    await prisma.user.delete({
      where: { id: employee.userId }
    });

    return res.json({
      success: true,
      message: 'Employee and associated user account deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete employee.' });
  }
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
