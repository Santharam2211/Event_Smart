const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { generateExcelReport } = require('../utils/reportGenerator');

// @desc    Mark attendance via QR scan or Manual ID
// @route   POST /api/attendance/mark
// @access  Private/Staff
exports.markAttendance = async (req, res, next) => {
    try {
        const { registrationId, eventId, signature } = req.body;

        // Find registration either by the unique registrationId (QR) or student's roll number
        let registration = await Registration.findOne({ 
            registrationId, 
            event: eventId 
        }).populate('participant', 'username email signature registrationNumber').populate('team');

        if (!registration) {
            // Try searching by student registration number (roll number)
            const userWithRoll = await User.findOne({ registrationNumber: registrationId });
            if (userWithRoll) {
                registration = await Registration.findOne({
                    participant: userWithRoll._id,
                    event: eventId
                }).populate('participant', 'username email signature registrationNumber').populate('team');
            }
        }

        if (!registration) {
            res.status(404);
            throw new Error('Invalid registration or student ID for this event');
        }

        // If it's a team registration, the leader holds the QR, but any member ID marks the team
        // (The previous logic specifically tried to find the leader, but we can just use the team._id from any member)

        if (registration.attendanceStatus && !registration.team) {
            return res.status(400).json({
                message: 'Attendance already marked',
                participant: registration.participant.username,
                time: registration.attendanceTime
            });
        }

        const event = await Event.findById(eventId);
        if (event.status === 'Completed' || event.status === 'Cancelled') {
            res.status(400);
            throw new Error(`Event is already ${event.status}`);
        }

        let message = `Attendance marked successfully for ${registration.participant.username}`;
        let participantName = registration.participant.username;

        let memberNames = [];
        if (registration.team) {
            // Find all members of this team for this event
            const teamMembers = await Registration.find({ 
                event: eventId, 
                team: registration.team._id
            }).populate('participant', 'username signature');

            const now = new Date();
            let markedCount = 0;
            memberNames = teamMembers.map(m => m.participant?.username);

            // Check if ALL members are already marked
            const allAlreadyMarked = teamMembers.every(m => m.attendanceStatus);
            if (allAlreadyMarked) {
                return res.status(400).json({
                    message: `Attendance already marked for all members of team "${registration.team.name}"`,
                    participant: registration.team.name,
                    members: memberNames
                });
            }

            for (const reg of teamMembers) {
                if (!reg.attendanceStatus) {
                    reg.attendanceStatus = true;
                    reg.attendanceTime = now;
                    reg.markedBy = req.user._id;
                    // Auto-use profile signature if none exists
                    if (!reg.signature && reg.participant && reg.participant.signature) {
                        reg.signature = reg.participant.signature;
                    }
                    await reg.save();
                    markedCount++;
                }
            }
            
            message = `Team "${registration.team.name}" attendance marked! (${markedCount} new, ${teamMembers.length} total)`;
            participantName = registration.team.name;
        } else {
            registration.attendanceStatus = true;
            registration.attendanceTime = new Date();
            registration.markedBy = req.user._id;
            
            // Auto-use profile signature if none exists
            if (!registration.signature && registration.participant && registration.participant.signature) {
                registration.signature = registration.participant.signature;
            }
            await registration.save();
            participantName = registration.participant.username;
        }

        res.json({
            success: true,
            message,
            participant: participantName,
            members: memberNames,
            timestamp: new Date()
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance reports
// @route   GET /api/attendance/report/:eventId
// @access  Private/Staff
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const registrations = await Registration.find({ 
            event: req.params.eventId,
            attendanceStatus: true
        }).populate('participant', 'username email registrationNumber');

        const totalRegistrations = await Registration.countDocuments({ event: req.params.eventId });
        
        res.json({
            count: registrations.length,
            total: totalRegistrations,
            percentage: totalRegistrations > 0
                ? ((registrations.length / totalRegistrations) * 100).toFixed(2)
                : '0.00',
            attendees: registrations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full attendance records for an event (all registrants)
// @route   GET /api/attendance/records/:eventId
// @access  Private/Staff
exports.getAttendanceRecords = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber phone gender yearAndDept section')
            .populate('team', 'name')
            .populate('markedBy', 'username')
            .sort({ attendanceStatus: -1, createdAt: 1 });

        const attended = registrations.filter(r => r.attendanceStatus).length;

        res.json({
            event: { _id: event._id, title: event.title, eventDate: event.eventDate, venue: event.venue },
            summary: {
                total: registrations.length,
                attended,
                absent: registrations.length - attended,
                percentage: registrations.length > 0
                    ? ((attended / registrations.length) * 100).toFixed(1)
                    : '0.0'
            },
            records: registrations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export attendance report to Excel
// @route   GET /api/attendance/export/:eventId
// @access  Private/Staff
exports.exportReport = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        const registrations = await Registration.find({ event: req.params.eventId })
            .populate('participant', 'username email registrationNumber');

        const buffer = await generateExcelReport(registrations, event.title);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=Report_${event.title.replace(/\s/g, '_')}.xlsx`,
            'Content-Length': buffer.byteLength
        });

        res.send(Buffer.from(buffer));
    } catch (error) {
        next(error);
    }
};
