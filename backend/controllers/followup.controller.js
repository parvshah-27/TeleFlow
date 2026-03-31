const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');

// @desc    Get all follow-ups for the logged-in telecaller for today
// @route   GET /api/followups
// @access  Private (Telecaller)
exports.getFollowUps = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            telecaller: req.user.id,
            status: 'pending'
        };

        const totalFollowUps = await FollowUp.countDocuments(query);
        const followUps = await FollowUp.find(query)
            .populate('lead')
            .sort({ followUpDate: 1 })
            .skip(skip)
            .limit(limit);

        res.json({
            followUps,
            pagination: {
                totalFollowUps,
                totalPages: Math.ceil(totalFollowUps / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a follow-up
// @route   POST /api/followups
// @access  Private (Telecaller)
exports.createFollowUp = async (req, res, next) => {
    const { leadId, notes, followUpDate } = req.body;

    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ msg: 'Lead not found' });
        }

        const newFollowUp = new FollowUp({
            lead: leadId,
            telecaller: req.user.id,
            notes,
            followUpDate
        });

        const followUp = await newFollowUp.save();
        res.json(followUp);
    } catch (err) {
        next(err);
    }
};

// @desc    Update a follow-up status
// @route   PUT /api/followups/:id
// @access  Private (Telecaller)
exports.updateFollowUpStatus = async (req, res, next) => {
    try {
        let followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({ msg: 'Follow-up not found' });
        }

        // Make sure user owns follow-up
        if (followUp.telecaller.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        followUp = await FollowUp.findByIdAndUpdate(
            req.params.id,
            { status: 'completed' },
            { new: true }
        );

        res.json(followUp);
    } catch (err) {
        next(err);
    }
};
