const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { generateToken } = require('../middleware/auth');

/**
 * Login user with email & password
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        employeeProfile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or inactive account.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.employeeProfile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
}

/**
 * Get current authenticated user
 */
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        employeeProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.employeeProfile
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

/**
 * Returns available demo accounts for instant 1-click testing
 */
async function getDemoAccounts(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 6,
      include: {
        employeeProfile: true
      },
      orderBy: { role: 'asc' }
    });

    const accounts = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.employeeProfile ? `${u.employeeProfile.firstName} ${u.employeeProfile.lastName}` : 'System Admin',
      designation: u.employeeProfile ? u.employeeProfile.designation : 'HR Administrator',
      department: u.employeeProfile ? u.employeeProfile.department : 'Human Resources',
      salary: u.employeeProfile ? u.employeeProfile.baseSalary : null,
      avatarUrl: u.employeeProfile ? u.employeeProfile.avatarUrl : null,
      defaultPassword: 'password123'
    }));

    return res.json({ success: true, accounts });
  } catch (error) {
    console.error('Error fetching demo accounts:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
}

module.exports = {
  login,
  me,
  getDemoAccounts
};
