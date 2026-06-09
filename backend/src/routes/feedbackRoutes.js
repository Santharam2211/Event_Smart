const express = require('express');
const router = express.Router();
const { 
    submitFeedback, 
    getEventFeedback, 
    checkFeedbackStatus,
    sendFeedbackEmails
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, submitFeedback);

router.route('/event/:eventId')
    .get(protect, authorize('Admin'), getEventFeedback);

router.route('/send/:eventId')
    .post(protect, authorize('Admin'), sendFeedbackEmails);

router.route('/check/:eventId')
    .get(protect, checkFeedbackStatus);

module.exports = router;
