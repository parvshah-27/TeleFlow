const CallLog = require('../models/CallLog');
const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');

exports.logCall = async (req, res, next) => {
    const { leadId, notes, followUpDate, status } = req.body;
    const telecallerId = req.user.id;

    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ msg: 'Lead not found' });
        }

        const newCallLog = new CallLog({
            lead: leadId,
            telecaller: telecallerId,
            notes,
            status
        });

        const callLog = await newCallLog.save();

        if (followUpDate) {
            console.log("Creating follow-up for date:", followUpDate);
            const newFollowUp = new FollowUp({
                lead: leadId,
                telecaller: telecallerId,
                notes,
                followUpDate
            });
            await newFollowUp.save();
            console.log("Follow-up saved successfully");
        }
        
        // Update lead status
        lead.status = status;
        await lead.save();

        res.json({ callLog });
    } catch (err) {
        next(err);
    }
};

exports.getCallHistory = async (req, res, next) => {
    try {
        const history = await CallLog.find({ lead: req.params.leadId })
            .populate("telecaller", "name")
            .sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        next(err);
    }
};
