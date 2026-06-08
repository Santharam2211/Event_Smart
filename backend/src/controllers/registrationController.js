const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Team = require('../models/Team');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const { sendEmail } = require('../utils/emailService');
const { ensureUploadsDir } = require('../utils/ensureUploadsDir');

const uploadsDir = ensureUploadsDir();

const registrationFileUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'reg-file-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('Allowed file types: jpeg, jpg, png, gif, webp, pdf, doc, docx'));
    }
});

exports.registrationFileUpload = registrationFileUpload;

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
exports.registerForEvent = async (req, res, next) => {
    try {
        let { eventId, teamId, formData } = req.body;
        const userId = req.user._id;

        if (typeof formData === 'string') {
            formData = JSON.parse(formData);
        }
        formData = formData || {};

        // Attach uploaded files to form data (field name = field label)
        if (req.files && req.files.length) {
            req.files.forEach((file) => {
                formData[file.fieldname] = file.filename;
            });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Check registration deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            res.status(400);
            throw new Error('Registration deadline has passed');
        }

        // Check if already registered
        const existingReg = await Registration.findOne({ event: eventId, participant: userId });
        if (existingReg) {
            res.status(400);
            throw new Error('You are already registered for this event');
        }

        // Check participant limit
        const regCount = await Registration.countDocuments({ event: eventId });
        if (regCount >= event.maxParticipants) {
            res.status(400);
            throw new Error('Event is full');
        }

        // Generate Registration ID
        const registrationId = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Generate QR Code Data
        const qrData = JSON.stringify({
            eventId: event._id,
            participantId: userId,
            registrationId: registrationId,
            token: uuidv4()
        });

        const qrCodeImage = await QRCode.toDataURL(qrData);

        const registration = await Registration.create({
            event: eventId,
            participant: userId,
            registrationId,
            formData,
            qrCode: qrCodeImage,
            team: teamId
        });

        // Send Confirmation Email
        await sendEmail({
            to: req.user.email,
            subject: `Registration Confirmed: ${event.title}`,
            htmlContent: `
                <h1>Registration Confirmed!</h1>
                <p>Hello ${req.user.username},</p>
                <p>You have successfully registered for <strong>${event.title}</strong>.</p>
                <p><strong>Registration ID:</strong> ${registrationId}</p>
                <p>Please find your entry QR code in your dashboard.</p>
                <br>
                <p>See you at the venue!</p>
            `
        });

        res.status(201).json(registration);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's registrations
// @route   GET /api/registrations/my
// @access  Private
exports.getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ participant: req.user._id })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(registrations);
    } catch (error) {
        next(error);
    }
};

// @desc    Get event registrations (for admin/staff)
// @route   GET /api/registrations/event/:eventId
// @access  Private/Staff
exports.getEventRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber');
        res.json(registrations);
    } catch (error) {
        next(error);
    }
};
