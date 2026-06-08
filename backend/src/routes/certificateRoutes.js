const express = require('express');
const router = express.Router();
const { downloadCertificate } = require('../controllers/certificateController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/download/:regId', protect, downloadCertificate);

module.exports = router;
