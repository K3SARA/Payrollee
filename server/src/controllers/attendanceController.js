const prisma = require('../prisma');

/**
 * Get attendance records
 */
async function getAttendanceRecords(req, res) {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    const isAdmin = req.user.role === 'HR_ADMIN';

    const where = {};

    // Data isolation
    if (!isAdmin) {
      where.employeeId = req.user.employeeProfileId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    return res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
}

/**
 * Helper to get date and time in Sri Lanka Standard Time (Asia/Colombo, UTC+05:30)
 */
function getSriLankaTime() {
  const now = new Date();
  
  // Time in Asia/Colombo (Sri Jayawardenepura Kotte)
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const timeStr = timeFormatter.format(now);

  // Date in Asia/Colombo
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const dateStr = dateFormatter.format(now);

  const [year, month, day] = dateStr.split('-').map(Number);
  const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  return { timeStr, dateStr, todayStart, todayEnd, now };
}

/**
 * Get current employee's check-in / check-out status for today (Sri Lanka Time)
 */
async function getTodayStatus(req, res) {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee profile.' });
    }

    const { todayStart, todayEnd, timeStr, dateStr } = getSriLankaTime();

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: {
        serverTimeSL: timeStr,
        serverDateSL: dateStr,
        timeZone: 'Asia/Colombo (UTC+05:30)',
        isCheckedIn: !!record && !!record.checkIn,
        isCheckedOut: !!record && !!record.checkOut,
        record
      }
    });
  } catch (error) {
    console.error('Error fetching today status:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch status.' });
  }
}

/**
 * Reset today's punch so user can test Punch In and Punch Out again
 */
async function resetTodayPunch(req, res) {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee profile.' });
    }

    const { todayStart, todayEnd } = getSriLankaTime();

    await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd }
      }
    });

    return res.json({
      success: true,
      message: "Today's punch has been reset to fresh state. You can check in now."
    });
  } catch (error) {
    console.error('Reset punch error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset punch.' });
  }
}

/**
 * Direct One-Click Check-In for current employee (Sri Lanka Time)
 */
async function checkIn(req, res) {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile associated.' });
    }

    const { timeStr, todayStart, todayEnd } = getSriLankaTime();

    let record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd }
      }
    });

    if (record && record.checkIn) {
      return res.status(400).json({
        success: false,
        message: `Already checked in today at ${record.checkIn}.`
      });
    }

    const checkInTime = req.body.checkInTime || timeStr;

    // Check if late based on Sri Lanka time: 09:15 AM
    const [h, m] = checkInTime.split(':').map(Number);
    const isLate = h > 9 || (h === 9 && m > 15);
    const status = isLate ? 'LATE' : 'PRESENT';

    if (record) {
      record = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkIn: checkInTime,
          status,
          notes: req.body.notes || record.notes || 'Punched in via web portal'
        }
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          employeeId,
          date: todayStart,
          checkIn: checkInTime,
          regularHours: 8.0,
          overtimeHours: 0.0,
          status,
          notes: req.body.notes || (isLate ? 'Late arrival' : 'Regular punch-in')
        }
      });
    }

    return res.json({
      success: true,
      message: `Checked in successfully at ${checkInTime} (Sri Lanka Time).`,
      data: record
    });
  } catch (error) {
    console.error('Check in error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check in.' });
  }
}

/**
 * Direct One-Click Check-Out for current employee
 */
async function checkOut(req, res) {
  try {
    const employeeId = req.user.employeeProfileId;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No employee profile associated.' });
    }

    const { timeStr, todayStart, todayEnd } = getSriLankaTime();

    let record = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd }
      }
    });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No active check-in found for today. Please punch in first.'
      });
    }

    if (record.checkOut) {
      return res.status(400).json({
        success: false,
        message: `Already checked out today at ${record.checkOut}.`
      });
    }

    const checkOutTime = req.body.checkOutTime || timeStr;

    // Compute duration between check-in and check-out
    const [inH, inM] = record.checkIn.split(':').map(Number);
    const [outH, outM] = checkOutTime.split(':').map(Number);

    let durationHours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
    if (durationHours < 0.5) durationHours = 8.0; // fallback if punch in and out immediately for demo

    durationHours = Math.round(durationHours * 100) / 100;
    const regularHours = Math.min(8.0, durationHours);
    const overtimeHours = durationHours > 8.0 ? Math.round((durationHours - 8.0) * 100) / 100 : 0.0;
    const status = overtimeHours > 0 ? 'OVERTIME' : record.status;

    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        regularHours,
        overtimeHours,
        status,
        notes: req.body.notes || (overtimeHours > 0 ? `Overtime shift: ${overtimeHours} hrs` : record.notes || 'Regular day completed')
      }
    });

    return res.json({
      success: true,
      message: `Checked out successfully at ${checkOutTime}. Logged ${durationHours} hours.`,
      data: record
    });
  } catch (error) {
    console.error('Check out error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check out.' });
  }
}

/**
 * Log daily attendance / timesheet entry (manual or admin entry)
 */
async function logAttendance(req, res) {
  try {
    const isAdmin = req.user.role === 'HR_ADMIN';
    const targetEmployeeId = isAdmin ? (req.body.employeeId || req.user.employeeProfileId) : req.user.employeeProfileId;

    if (!targetEmployeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID is required.' });
    }

    const {
      date = new Date().toISOString().split('T')[0],
      checkIn = '08:30',
      checkOut = '17:00',
      regularHours = 8.0,
      overtimeHours = 0.0,
      status = 'PRESENT',
      notes = ''
    } = req.body;

    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: targetEmployeeId,
        date: parsedDate,
        checkIn,
        checkOut,
        regularHours: parseFloat(regularHours) || 8.0,
        overtimeHours: parseFloat(overtimeHours) || 0.0,
        status,
        notes
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Attendance logged successfully.',
      data: record
    });
  } catch (error) {
    console.error('Error logging attendance:', error);
    return res.status(500).json({ success: false, message: 'Failed to log attendance.' });
  }
}

/**
 * Get leave requests
 */
async function getLeaveRequests(req, res) {
  try {
    const { status, employeeId } = req.query;
    const isAdmin = req.user.role === 'HR_ADMIN';

    const where = {};

    // Data isolation
    if (!isAdmin) {
      where.employeeId = req.user.employeeProfileId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            avatarUrl: true
          }
        },
        approvedBy: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leave requests.' });
  }
}

/**
 * Submit a leave request (Employee or Admin)
 */
async function submitLeaveRequest(req, res) {
  try {
    const { leaveType, startDate, endDate, totalDays, reason } = req.body;
    const employeeId = req.user.employeeProfileId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'No associated employee profile found for user.' });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required leave fields.' });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays: parseFloat(totalDays) || 1.0,
        reason,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: leave
    });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit leave request.' });
  }
}

/**
 * Review leave request (Approve/Reject - HR_ADMIN only)
 */
async function updateLeaveStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewNotes: reviewNotes || (status === 'APPROVED' ? 'Approved by HR Administrator' : 'Denied by HR Administrator'),
        approvedById: req.user.id
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true, email: false }
        }
      }
    });

    return res.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}.`,
      data: updated
    });
  } catch (error) {
    console.error('Error reviewing leave:', error);
    return res.status(500).json({ success: false, message: 'Failed to update leave status.' });
  }
}

module.exports = {
  getAttendanceRecords,
  getTodayStatus,
  checkIn,
  checkOut,
  resetTodayPunch,
  logAttendance,
  getLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus
};
