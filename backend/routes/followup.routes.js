const express = require('express');
const router = express.Router();
const {
    getFollowUps,
    createFollowUp,
    updateFollowUpStatus
} = require('../controllers/followup.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

// @route   GET api/followups
// @desc    Get all follow-ups for the logged-in telecaller for today
// @access  Private (Telecaller)
router.get('/', auth, role('Telecaller'), getFollowUps);

// @route   POST api/followups
// @desc    Create a follow-up
// @access  Private (Telecaller)
router.post('/', auth, role('Telecaller'), createFollowUp);

// @route   PUT api/followups/:id
// @desc    Update a follow-up status
// @access  Private (Telecaller)
router.put('/:id', auth, role('Telecaller'), updateFollowUpStatus);

module.exports = router;
