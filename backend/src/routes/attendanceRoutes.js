const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceReport, getAttendanceRecords, exportReport } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/mark', protect, authorize('Admin', 'Volunteer'), markAttendance);
router.get('/report/:eventId', protect, authorize('Admin', 'Volunteer'), getAttendanceReport);
router.get('/records/:eventId', protect, authorize('Admin', 'Volunteer'), getAttendanceRecords);
router.get('/export/:eventId', protect, authorize('Admin', 'Volunteer'), exportReport);

module.exports = router;
