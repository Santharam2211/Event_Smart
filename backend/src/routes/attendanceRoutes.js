const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceReport, getAttendanceRecords, exportReport } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/mark', protect, authorize('Admin', 'Association Member'), markAttendance);
router.get('/report/:eventId', protect, authorize('Admin', 'Association Member'), getAttendanceReport);
router.get('/records/:eventId', protect, authorize('Admin', 'Association Member'), getAttendanceRecords);
router.get('/export/:eventId', protect, authorize('Admin', 'Association Member'), exportReport);

module.exports = router;
