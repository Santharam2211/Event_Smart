const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, createVolunteer, getAllUsers, uploadProfilePicture, upload, signatureUpload } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, signatureUpload.single('signature'), updateProfile);
router.post('/upload-profile', protect, upload.single('profileImage'), uploadProfilePicture);

// Admin-only routes
router.post('/create-volunteer', protect, authorize('Admin'), createVolunteer);
router.get('/users', protect, authorize('Admin'), getAllUsers);

module.exports = router;
