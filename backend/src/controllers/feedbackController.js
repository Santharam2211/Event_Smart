const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendEmail } = require('../utils/emailService');

// @desc    Submit feedback for an event
// @route   POST /api/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
    try {
        const { eventId, responses } = req.body;
        const userId = req.user._id;

        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        // Check if event has a feedback form
        if (!event.feedbackForm || event.feedbackForm.length === 0) {
            res.status(400);
            throw new Error('This event has no feedback form');
        }

        // Check if user attended the event
        const registration = await Registration.findOne({ 
            event: eventId, 
            participant: userId,
            attendanceStatus: true 
        });

        if (!registration) {
            res.status(403);
            throw new Error('You can only submit feedback for events you attended');
        }

        // Check if already submitted
        const existingFeedback = await Feedback.findOne({ event: eventId, user: userId });
        if (existingFeedback) {
            res.status(400);
            throw new Error('You have already submitted feedback for this event');
        }

        const feedback = await Feedback.create({
            event: eventId,
            user: userId,
            responses
        });

        // Mark registration as feedback submitted
        registration.feedbackSubmitted = true;
        await registration.save();

        res.status(201).json(feedback);
    } catch (error) {
        next(error);
    }
};

// @desc    Get feedback for an event (Admin only)
// @route   GET /api/feedback/event/:eventId
// @access  Private/Admin
exports.getEventFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.find({ event: req.params.eventId })
            .populate('user', 'username email')
            .sort({ createdAt: -1 });
        res.json(feedback);
    } catch (error) {
        next(error);
    }
};

// @desc    Check if current user has submitted feedback for an event
// @route   GET /api/feedback/check/:eventId
// @access  Private
exports.checkFeedbackStatus = async (req, res, next) => {
    try {
        const feedback = await Feedback.findOne({ 
            event: req.params.eventId, 
            user: req.user._id 
        });
        res.json({ submitted: !!feedback });
    } catch (error) {
        next(error);
    }
};

// @desc    Send feedback form emails to all attendees of an event
// @route   POST /api/feedback/send/:eventId
// @access  Private/Admin
exports.sendFeedbackEmails = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            res.status(404);
            throw new Error('Event not found');
        }

        if (!event.feedbackForm || event.feedbackForm.length === 0) {
            res.status(400);
            throw new Error('This event has no feedback form to send');
        }

        // Get all attendees
        const attendedRegistrations = await Registration.find({
            event: req.params.eventId,
            attendanceStatus: true
        }).populate('participant', 'username email');

        if (attendedRegistrations.length === 0) {
            res.status(400);
            throw new Error('No attendees found for this event');
        }

        // Build the frontend URL (use env variable if available)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const feedbackUrl = `${frontendUrl}/dashboard`;

        // Send email to each attendee
        let successCount = 0;
        for (const reg of attendedRegistrations) {
            try {
                await sendEmail({
                    to: reg.participant.email,
                    subject: `Share Your Feedback: ${event.title}`,
                    htmlContent: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
                            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">How was the event? 💬</h1>
                            </div>
                            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px;">
                                <p style="font-size: 18px; color: #1e293b;">Hello <strong>${reg.participant.username}</strong>,</p>
                                <p style="color: #475569; line-height: 1.6;">Thank you for attending <strong>${event.title}</strong>! We hope you had a great experience.</p>
                                <p style="color: #475569; line-height: 1.6;">Your feedback is important to us and helps us improve future events. Please take a few minutes to fill out our feedback form.</p>
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="${feedbackUrl}" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                                        Give Feedback →
                                    </a>
                                </div>
                                <p style="color: #94a3b8; font-size: 14px; text-align: center;">Visit your dashboard and click the <strong>Feedback</strong> button next to the event.</p>
                                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                                <p style="color: #94a3b8; font-size: 12px; text-align: center;">EventSmart — Making every event better, together.</p>
                            </div>
                        </div>
                    `
                });
                successCount++;
            } catch (emailError) {
                console.error(`Failed to send feedback email to ${reg.participant.email}:`, emailError);
            }
        }

        res.json({ 
            message: `Feedback emails sent to ${successCount} out of ${attendedRegistrations.length} attendees`,
            sent: successCount,
            total: attendedRegistrations.length
        });
    } catch (error) {
        next(error);
    }
};
