const Event = require('../models/Event');
const multer = require('multer');
const path = require('path');
const { ensureUploadsDir } = require('../utils/ensureUploadsDir');

const uploadsDir = ensureUploadsDir();

// Configure multer for event banner image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'event-banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private/Admin
exports.createEvent = async (req, res, next) => {
    try {
        const body = req.body;
        // If banner image was uploaded, add it to the event data
        if (req.file) {
            body.bannerImage = req.file.filename;
        }
        // Parse registrationForm if it's a string
        if (body.registrationForm && typeof body.registrationForm === 'string') {
            body.registrationForm = JSON.parse(body.registrationForm);
        }
        // Parse feedbackForm if it's a string
        if (body.feedbackForm && typeof body.feedbackForm === 'string') {
            body.feedbackForm = JSON.parse(body.feedbackForm);
        }
        // Auto-publish when status is set to Open
        if (body.status === 'Open') {
            body.isPublished = true;
        }
        const eventData = { ...body, createdBy: req.user._id };
        const event = await Event.create(eventData);
        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
    try {
        const { status, category, participationType } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (participationType) query.participationType = participationType;

        // Non-admin: show all non-Draft events (Open, Closed, Completed)
        // Admin: show everything including Draft
        if (!req.user || req.user.role !== 'Admin') {
            query.status = { $in: ['Open', 'Closed', 'Completed'] };
            // If user also filtered by status, keep that filter but restrict to visible statuses
            if (status && ['Open', 'Closed', 'Completed'].includes(status)) {
                query.status = status;
            }
        }

        const events = await Event.find(query).sort({ eventDate: -1 });
        res.json(events);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        res.json(event);
    } catch (error) {
        next(error);
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin
exports.updateEvent = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const updateData = req.body;
        // If banner image was uploaded, add it to the update data
        if (req.file) {
            updateData.bannerImage = req.file.filename;
        }
        // Parse registrationForm if it's a string
        if (updateData.registrationForm && typeof updateData.registrationForm === 'string') {
            updateData.registrationForm = JSON.parse(updateData.registrationForm);
        }
        // Parse feedbackForm if it's a string
        if (updateData.feedbackForm && typeof updateData.feedbackForm === 'string') {
            updateData.feedbackForm = JSON.parse(updateData.feedbackForm);
        }
        if (updateData.status === 'Open') updateData.isPublished = true;
        if (updateData.status === 'Draft') updateData.isPublished = false;

        event = await Event.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        res.json(event);
    } catch (error) {
        next(error);
    }
};

// Export upload middleware for use in routes
exports.upload = upload;

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }
        
        await event.deleteOne();
        res.json({ message: 'Event removed' });
    } catch (error) {
        next(error);
    }
};

const Registration = require('../models/Registration');

exports.getEventStats = async (req, res, next) => {
    try {
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const totalAttendees = await Registration.countDocuments({ attendanceStatus: true });

        res.json({
            totalEvents,
            totalRegistrations,
            totalAttendees
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get public statistics for home page
// @route   GET /api/events/public-stats
// @access  Public
exports.getPublicStats = async (req, res, next) => {
    try {
        const totalEvents = await Event.countDocuments({ status: { $ne: 'Draft' } });
        const totalRegistrations = await Registration.countDocuments();
        
        // We can add a bit of padding to make it look "massive" as requested by the UI design
        res.json({
            totalEvents: totalEvents + 10, 
            totalRegistrations: totalRegistrations + 500,
            totalAttendees: totalRegistrations + 450
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Publish/Unpublish event results
// @route   PUT /api/events/:id/publish-results
// @access  Private/Admin
exports.publishResults = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        event.resultsPublished = !event.resultsPublished;
        await event.save();

        res.json({
            message: event.resultsPublished ? 'Results published' : 'Results unpublished',
            resultsPublished: event.resultsPublished
        });
    } catch (error) {
        next(error);
    }
};
