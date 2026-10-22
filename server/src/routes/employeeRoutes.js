const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employeeController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All employee routes require authentication
router.use(requireAuth);

// Admin-only endpoints
router.get('/', requireAdmin, getAllEmployees);
router.post('/', requireAdmin, createEmployee);
router.delete('/:id', requireAdmin, deleteEmployee);

// Shared / RBAC-guarded endpoints
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);

module.exports = router;
