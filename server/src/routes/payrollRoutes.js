const express = require('express');
const router = express.Router();
const {
  calculatePreview,
  executePayrollRun,
  getAllPayrollRuns,
  getPayrollRunById,
  getPayslips,
  getPayslipById
} = require('../controllers/payrollController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// Admin-only payroll execution & calculation
router.post('/preview', requireAdmin, calculatePreview);
router.post('/execute', requireAdmin, executePayrollRun);
router.get('/runs', requireAdmin, getAllPayrollRuns);
router.get('/runs/:id', requireAdmin, getPayrollRunById);

// Payslips (Employee sees own, Admin sees all)
router.get('/payslips', getPayslips);
router.get('/payslips/:id', getPayslipById);

module.exports = router;
