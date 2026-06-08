const express = require('express');
const router = express.Router();
const { 
    createTeam, 
    inviteMember, 
    handleInvitation 
} = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createTeam);
router.post('/:id/invite', protect, inviteMember);
router.put('/invitation/:teamId', protect, handleInvitation);

module.exports = router;
