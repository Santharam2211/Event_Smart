const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { ensureUploadsDir } = require('../utils/ensureUploadsDir');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const generateCertificate = require('../utils/certificateGenerator');
const { protect, authorize } = require('../middlewares/authMiddleware');

const uploadsDir = ensureUploadsDir();

// Configure multer for certificate template uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cert-template-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png, webp)'));
        }
    }
});

// @desc    Upload certificate template and update config
// @route   POST /api/certificates/config/:eventId
// @access  Private/Admin
router.post('/config/:eventId', protect, authorize('Admin'), upload.single('template'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const config = JSON.parse(req.body.config);
        if (req.file) {
            config.template = req.file.filename;
        } else {
            // Keep existing template if not uploading new one
            config.template = event.certificateConfig?.template;
        }

        event.certificateConfig = config;
        await event.save();

        res.json(event.certificateConfig);
    } catch (error) {
        next(error);
    }
});

// @desc    Get certificate config
// @route   GET /api/certificates/config/:eventId
// @access  Private/Admin
router.get('/config/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        res.json(event.certificateConfig || { fields: [] });
    } catch (error) {
        next(error);
    }
});

// @desc    Download certificate (Participant version)
router.get('/download/:regId', protect, async (req, res, next) => {
    try {
        const registration = await Registration.findById(req.params.regId)
            .populate('participant')
            .populate('event');

        if (!registration) {
            res.status(404);
            throw new Error('Registration not found');
        }

        // Eligibility check
        if (!registration.attendanceStatus) {
            res.status(403);
            throw new Error('Attendance required for certificate');
        }

        // Feedback check (if feedback form exists)
        if (registration.event.feedbackForm && registration.event.feedbackForm.length > 0) {
            if (!registration.feedbackSubmitted) {
                res.status(403);
                throw new Error('Feedback submission required for certificate');
            }
        }

        const event = registration.event;
        if (!event.certificateConfig || !event.certificateConfig.template) {
            res.status(404);
            throw new Error('Certificate is not yet configured for this event by the administrator.');
        }

        const pdfBuffer = await generateCertificate(registration, event.certificateConfig);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=certificate_${registration.registrationId}.pdf`,
            'Content-Length': pdfBuffer.byteLength
        });

        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
});

// @desc    Preview certificate
// @route   POST /api/certificates/preview/:eventId
// @access  Private/Admin
router.post('/preview/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Dummy registration for preview
        const dummyReg = {
            participant: {
                username: 'John Doe',
                gender: 'Male',
                yearAndDept: 'III B.E. CSE',
                section: 'A',
                registrationNumber: 'ST12345'
            },
            event: event
        };

        const config = req.body; // Expect config in body
        const pdfBuffer = await generateCertificate(dummyReg, config);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.byteLength
        });
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        next(error);
    }
});

// @desc    Bulk send certificates via email
// @route   POST /api/certificates/bulk-send/:eventId
// @access  Private/Admin
router.post('/bulk-send/:eventId', protect, authorize('Admin'), async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event || !event.certificateConfig || !event.certificateConfig.template) {
            res.status(400);
            throw new Error('Certificate configuration is missing. Please upload a template and save the configuration first.');
        }

        const eligibleRegs = await Registration.find({
            event: req.params.eventId,
            attendanceStatus: true
        }).populate('participant');

        const { sendEmail } = require('../utils/emailService');
        let successCount = 0;

        for (const reg of eligibleRegs) {
            // Check feedback if required
            if (event.feedbackForm && event.feedbackForm.length > 0 && !reg.feedbackSubmitted) {
                continue;
            }

            try {
                const pdfBuffer = await generateCertificate(reg, event.certificateConfig);
                
                await sendEmail({
                    to: reg.participant.email,
                    subject: `Certificate of Participation: ${event.title}`,
                    htmlContent: `
                        <p>Hello ${reg.participant.username},</p>
                        <p>Congratulations! Your certificate for <strong>${event.title}</strong> is ready.</p>
                        <p>Please find it attached to this email.</p>
                    `,
                    attachments: [
                        {
                            content: Buffer.from(pdfBuffer).toString('base64'),
                            filename: `certificate_${reg.registrationId}.pdf`,
                            type: 'application/pdf',
                            disposition: 'attachment'
                        }
                    ]
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send cert to ${reg.participant.email}:`, err);
            }
        }

        res.json({ message: `Certificates sent to ${successCount} eligible participants` });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
