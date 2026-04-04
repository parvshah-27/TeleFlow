const Script = require("../models/Script");
const CallLog = require("../models/CallLog");

// Get analytics for all scripts (Success rate)
exports.getAnalytics = async (req, res, next) => {
    try {
        const stats = await CallLog.aggregate([
            { $match: { script: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$script",
                    totalUsed: { $sum: 1 },
                    interested: {
                        $sum: { $cond: [{ $eq: ["$status", "Interested"] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "scripts",
                    localField: "_id",
                    foreignField: "_id",
                    as: "scriptDetails"
                }
            },
            { $unwind: "$scriptDetails" },
            {
                $project: {
                    title: "$scriptDetails.title",
                    totalUsed: 1,
                    interested: 1,
                    successRate: {
                        $cond: [
                            { $eq: ["$totalUsed", 0] },
                            0,
                            { $multiply: [{ $divide: ["$interested", "$totalUsed"] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { successRate: -1 } }
        ]);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

// Get recent script activity (Live Feed)
exports.getActivityFeed = async (req, res, next) => {
    try {
        const feed = await CallLog.find({ script: { $exists: true, $ne: null } })
            .populate("telecaller", "name")
            .populate("lead", "name")
            .populate("script", "title")
            .sort({ createdAt: -1 })
            .limit(15);
        res.json(feed);
    } catch (error) {
        next(error);
    }
};

// Create a new script (Manager/Admin only)
exports.createScript = async (req, res, next) => {
    try {
        const { title, content, assignedTo, isActive } = req.body;
        const script = await Script.create({
            title,
            content,
            assignedTo: assignedTo || [],
            createdBy: req.user.id,
            isActive: isActive !== undefined ? isActive : true
        });
        
        const populatedScript = await Script.findById(script._id)
            .populate("createdBy", "name")
            .populate("assignedTo", "name email");
            
        res.status(201).json(populatedScript);
    } catch (error) {
        console.error("Error creating script:", error);
        next(error);
    }
};

// Get all scripts (Manager sees all, Telecaller sees assigned)
exports.getScripts = async (req, res, next) => {
    try {
        let query = {};
        const role = req.user.role?.toLowerCase();
        
        if (role === "telecaller") {
            query = { assignedTo: req.user.id, isActive: true };
        }
        
        const scripts = await Script.find(query)
            .populate("createdBy", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });
        res.json(scripts);
    } catch (error) {
        console.error("Error fetching scripts:", error);
        next(error);
    }
};

// Update a script
exports.updateScript = async (req, res, next) => {
    try {
        const script = await Script.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate("createdBy", "name")
            .populate("assignedTo", "name email");
            
        if (!script) {
            return res.status(404).json({ msg: "Script not found" });
        }
        res.json(script);
    } catch (error) {
        console.error("Error updating script:", error);
        next(error);
    }
};

// Delete a script
exports.deleteScript = async (req, res, next) => {
    try {
        const script = await Script.findByIdAndDelete(req.params.id);
        if (!script) {
            return res.status(404).json({ msg: "Script not found" });
        }
        res.json({ msg: "Script deleted successfully" });
    } catch (error) {
        console.error("Error deleting script:", error);
        next(error);
    }
};
