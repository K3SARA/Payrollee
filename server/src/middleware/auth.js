const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'payrolleey_super_secret_jwt_token_sl_2026_enterprise_secure';

/**
 * Authentication Middleware: Validates JWT token and loads user profile
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        employeeProfile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or not found.'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfileId: user.employeeProfile ? user.employeeProfile.id : null,
      employeeProfile: user.employeeProfile
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

/**
 * RBAC Middleware: Restricts access exclusively to HR_ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'HR_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires HR_ADMIN administrative privileges.'
    });
  }
  next();
}

/**
 * Sign JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeProfileId: user.employeeProfile ? user.employeeProfile.id : null
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = {
  requireAuth,
  requireAdmin,
  generateToken,
  JWT_SECRET
};
