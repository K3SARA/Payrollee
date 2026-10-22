const express = require('express');
const router = express.Router();
const {
  getAttendanceRecords,
  getTodayStatus,
  checkIn,
  checkOut,
  resetTodayPunch,
  logAttendance,
  getLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus
} = require('../controllers/attendanceController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// Punch Clock / Quick Check-In & Check-Out
router.get('/today', getTodayStatus);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.post('/reset-today', resetTodayPunch);

// Attendance records ledger & manual log
router.get('/', getAttendanceRecords);
router.post('/log', logAttendance);

// Leave requests
router.get('/leaves', getLeaveRequests);
router.post('/leaves', submitLeaveRequest);
router.patch('/leaves/:id/status', requireAdmin, updateLeaveStatus);

module.exports = router;
