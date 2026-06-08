const express = require('express');
const router = express.Router();
const { 
    registerForEvent, 
    getMyRegistrations, 
    getEventRegistrations,
    registrationFileUpload
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, registrationFileUpload.any(), registerForEvent);
router.get('/my', protect, getMyRegistrations);
router.get('/event/:eventId', protect, authorize('Admin', 'Volunteer'), getEventRegistrations);

module.exports = router;
