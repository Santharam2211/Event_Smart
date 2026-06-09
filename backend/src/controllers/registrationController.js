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
const User = require('../models/User');

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private
exports.registerForEvent = async (req, res, next) => {
    try {
        let { eventId, teamId, teamMembers, teamName, formData, memberFormData } = req.body;
        const userId = req.user._id;

        if (typeof formData === 'string') {
            formData = JSON.parse(formData);
        }
        if (typeof memberFormData === 'string') {
            memberFormData = JSON.parse(memberFormData);
        }
        if (typeof teamMembers === 'string') {
            teamMembers = JSON.parse(teamMembers);
        }
        formData = formData || {};
        memberFormData = memberFormData || {};

        // Attach uploaded files to form data
        if (req.files && req.files.length) {
            req.files.forEach((file) => {
                // Determine if it's a member file: memberFiles_{memberId}_{fieldLabel}
                if (file.fieldname.startsWith('memberFiles_')) {
                    const parts = file.fieldname.split('_');
                    const memberId = parts[1];
                    const fieldLabel = parts.slice(2).join('_');
                    
                    if (!memberFormData[memberId]) memberFormData[memberId] = {};
                    memberFormData[memberId][fieldLabel] = file.filename;
                } else {
                    // Regular file field
                    formData[file.fieldname] = file.filename;
                }
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

        // Generate Registration ID (per event/team/individual)
        const registrationId = `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        if (event.participationType === 'Team') {
            if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
                res.status(400);
                throw new Error('Please select team members for team event');
            }

            if (!teamName) {
                res.status(400);
                throw new Error('Please provide a team name');
            }

            // check team size constraints
            const totalSize = teamMembers.length + 1; // Members + Leader
            if (totalSize < event.minTeamSize || totalSize > event.maxTeamSize) {
                res.status(400);
                throw new Error(`Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}`);
            }

            // Check if leader or any member is already registered
            const participantsToCheck = [userId, ...teamMembers];
            const alreadyRegistered = await Registration.find({
                event: eventId,
                participant: { $in: participantsToCheck }
            }).populate('participant', 'username');

            if (alreadyRegistered.length > 0) {
                const names = alreadyRegistered.map(r => r.participant.username).join(', ');
                res.status(400);
                throw new Error(`The following users are already registered for this event: ${names}`);
            }

            // Check participant limit
            const regCount = await Registration.countDocuments({ event: eventId });
            if (regCount + participantsToCheck.length > event.maxParticipants) {
                res.status(400);
                throw new Error('Not enough slots left for the whole team');
            }

            // Create Team
            const team = await Team.create({
                name: teamName,
                event: eventId,
                leader: userId,
                members: [
                    { user: userId, status: 'Accepted' },
                    ...teamMembers.map(id => ({ user: id, status: 'Accepted' })) // Auto-acccepted as leader chose them
                ],
                isRegistrationComplete: true
            });

            // Generate QR Code Data (one for the team)
            const qrData = JSON.stringify({
                eventId: event._id,
                participantId: userId, // Leader's ID
                registrationId: registrationId,
                teamId: team._id,
                token: uuidv4()
            });
            const qrCodeImage = await QRCode.toDataURL(qrData);

            // Create Registration records for all
            const registrationRecords = [];
            
            // Leader registration
            registrationRecords.push({
                event: eventId,
                participant: userId,
                registrationId,
                formData,
                qrCode: qrCodeImage,
                team: team._id
            });

            // Member registrations
            teamMembers.forEach(memberId => {
                registrationRecords.push({
                    event: eventId,
                    participant: memberId,
                    registrationId,
                    formData: memberFormData[memberId] || formData, // Use member specific data or fallback to leader's
                    qrCode: qrCodeImage,
                    team: team._id
                });
            });

            const registrations = await Registration.insertMany(registrationRecords);

            // Send Confirmation Email to leader
            await sendEmail({
                to: req.user.email,
                subject: `Team Registration Confirmed: ${event.title}`,
                htmlContent: `
                    <h1>Team Registration Confirmed!</h1>
                    <p>Hello ${req.user.username},</p>
                    <p>Your team <strong>${teamName}</strong> has successfully registered for <strong>${event.title}</strong>.</p>
                    <p><strong>Team Registration ID:</strong> ${registrationId}</p>
                    <p>Please find your team's entry QR code in your dashboard. Any team member's ID or QR code can be used for team check-in at the venue.</p>
                    <br>
                    <p>See you at the venue!</p>
                `
            });

            return res.status(201).json(registrations[0]);

        } else {
            // Individual Registration Logic
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
                team: teamId || undefined
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

            return res.status(201).json(registration);
        }
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
