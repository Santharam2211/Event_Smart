const Team = require('../models/Team');
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create a team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res, next) => {
    try {
        const { name, eventId } = req.body;
        
        const event = await Event.findById(eventId);
        if (event.participationType !== 'Team') {
            res.status(400);
            throw new Error('This event does not allow team participation');
        }

        const team = await Team.create({
            name,
            event: eventId,
            leader: req.user._id,
            members: [{ user: req.user._id, status: 'Accepted' }]
        });

        res.status(201).json(team);
    } catch (error) {
        next(error);
    }
};

// @desc    Invite a member to team
// @route   POST /api/teams/:id/invite
// @access  Private/Leader
exports.inviteMember = async (req, res, next) => {
    try {
        const { userIdentifier } = req.body; // Email or username
        const team = await Team.findById(req.params.id);

        if (!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        if (team.leader.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Only team leader can invite members');
        }

        const user = await User.findOne({
            $or: [
                { email: userIdentifier },
                { username: userIdentifier },
                { registrationNumber: userIdentifier }
            ]
        });

        if (!user) {
            res.status(404);
            throw new Error('User not found on platform');
        }

        // Check if already a member or invited
        const alreadyMember = team.members.find(m => m.user.toString() === user._id.toString());
        if (alreadyMember) {
            res.status(400);
            throw new Error('User is already invited or a member');
        }

        team.members.push({ user: user._id, status: 'Pending' });
        await team.save();

        // TODO: Send notification/email
        
        res.json({ message: 'Invitation sent successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Accept/Reject Invitation
// @route   PUT /api/teams/invitation/:teamId
// @access  Private
exports.handleInvitation = async (req, res, next) => {
    try {
        const { status } = req.body; // 'Accepted' or 'Rejected'
        const team = await Team.findById(req.params.teamId);

        if (!team) {
            res.status(404);
            throw new Error('Team not found');
        }

        const memberIndex = team.members.findIndex(m => m.user.toString() === req.user._id.toString());
        if (memberIndex === -1) {
            res.status(403);
            throw new Error('You are not invited to this team');
        }

        team.members[memberIndex].status = status;
        
        if (status === 'Rejected') {
            team.members.splice(memberIndex, 1);
        }

        await team.save();
        res.json({ message: `Invitation ${status.toLowerCase()} successfully` });
    } catch (error) {
        next(error);
    }
};
