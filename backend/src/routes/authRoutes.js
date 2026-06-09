const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, createAssociationMember, updateMemberStatus, getAllUsers, uploadProfilePicture, upload, signatureUpload, searchUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private routes
router.get('/profile', protect, getProfile);
router.get('/search', protect, searchUsers);
router.put('/profile', protect, signatureUpload.single('signature'), updateProfile);
router.post('/upload-profile', protect, upload.single('profileImage'), uploadProfilePicture);

// Admin-only routes
router.post('/create-association-member', protect, authorize('Admin'), createAssociationMember);
router.put('/member-status/:id', protect, authorize('Admin'), updateMemberStatus);
router.get('/users', protect, authorize('Admin'), getAllUsers);

module.exports = router;
