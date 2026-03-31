const User = require("../models/User");
const Lead = require("../models/Lead");
const CallLog = require("../models/CallLog");
const FollowUp = require("../models/FollowUp");
const mongoose = require("mongoose");
const path = require("path");

const fs = require("fs");
const papa = require("papaparse");

exports.importLeads = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const filePath = path.join(__dirname, '..', req.file.path);
        const fileContent = fs.readFileSync(filePath, "utf8");

        papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    if (results.errors.length > 0) {
                        console.error("CSV Parsing Errors:", results.errors);
                    }

                    const leads = results.data.map(row => {
                        // Normalize keys to lowercase and remove non-alphanumeric chars for robust matching
                        const normalizedRow = {};
                        Object.keys(row).forEach(key => {
                            const normalizedKey = key.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                            normalizedRow[normalizedKey] = row[key];
                        });

                        return {
                            name: normalizedRow.name || normalizedRow.customername || normalizedRow.namewithtitle || normalizedRow.fullname,
                            email: normalizedRow.email || normalizedRow.emailaddress || normalizedRow.mailid,
                            phone: normalizedRow.phone || normalizedRow.phonenumber || normalizedRow.contactnumber || normalizedRow.mobile,
                            product: normalizedRow.product || normalizedRow.service || normalizedRow.interest,
                            status: "New"
                        };
                    });

                    // Filter out rows that are missing BOTH name and phone (minimal requirement)
                    const validLeads = leads.filter(l => l.name || l.phone);
                    
                    if (validLeads.length > 0) {
                        await Lead.insertMany(validLeads);
                    }

                    // Clean up: delete the file after processing
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    res.status(201).json({ 
                        msg: `${validLeads.length} leads imported successfully`,
                        count: validLeads.length 
                    });
                } catch (error) {
                    console.error("Import processing error:", error);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    res.status(500).json({ msg: "Error processing CSV data", error: error.message });
                }
            },
            error: (error) => {
                console.error("Papa Parse error:", error);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.status(500).json({ msg: "Error parsing CSV file" });
            }
        });
    } catch (error) {
        console.error("Import controller error:", error);
        next(error);
    }
};

exports.getManagerDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeTelecallers = await User.find({ role: "Telecaller", status: "Active" });
        const teamTarget = activeTelecallers.length * 50; 

        // Use Promise.all for parallel execution of main stats
        const [callsToday, pendingLeads, totalLeads, interestedLeadsCount, verifiedLeadsCount] = await Promise.all([
            CallLog.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
            Lead.countDocuments({ assignedTo: null }), // Mongoose translates { field: null } to { $or: [ { field: null }, { field: { $exists: false } } ] }
            Lead.countDocuments(),
            Lead.countDocuments({ status: "Interested" }),
            Lead.countDocuments({ status: "Verified" })
        ]);

        const conversionRate = totalLeads > 0 
            ? ((interestedLeadsCount + verifiedLeadsCount) / totalLeads * 100).toFixed(2) 
            : 0;

        const teamPerformance = await Promise.all(
            activeTelecallers.map(async (telecaller) => {
                // Get unique leads this telecaller marked as 'Interested' today
                const interestedLeadsToday = await CallLog.distinct("lead", {
                    telecaller: telecaller._id,
                    status: "Interested",
                    createdAt: { $gte: today, $lt: tomorrow },
                });

                const [callCount, totalAssigned] = await Promise.all([
                    CallLog.countDocuments({
                        telecaller: telecaller._id,
                        createdAt: { $gte: today, $lt: tomorrow },
                    }),
                    Lead.countDocuments({ assignedTo: telecaller._id })
                ]);

                return { 
                    id: telecaller._id,
                    name: telecaller.name, 
                    calls: callCount, 
                    interested: interestedLeadsToday.length,
                    totalAssigned,
                    status: telecaller.status
                };
            })
        );

        const leadStatusDistribution = await Lead.aggregate([
            { $match: { status: { $ne: null, $exists: true, $not: /^\s*$/ } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            teamTarget,
            callsToday,
            pendingLeads,
            totalLeads,
            conversionRate,
            teamPerformance,
            leadStatusDistribution,
        });
    } catch (error) {
        next(error);
    }
};


exports.getPerformanceInsights = async (req, res, next) => {
    try {
        const telecallerId = req.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const statusDistributionRaw = await CallLog.aggregate([
            { 
                $match: { 
                    telecaller: new mongoose.Types.ObjectId(telecallerId),
                    createdAt: { $gte: thirtyDaysAgo }
                } 
            },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Ensure we have at least these common statuses for the UI to look "full"
        const commonStatuses = ["New", "Interested", "Not Interested", "Call Back", "Wrong Number"];
        const statusDistribution = commonStatuses.map(status => {
            const found = statusDistributionRaw.find(s => s._id === status);
            return { name: status, value: found ? found.count : 0 };
        });

        // Add any other statuses found in DB that aren't in commonStatuses
        statusDistributionRaw.forEach(s => {
            if (!commonStatuses.includes(s._id)) {
                statusDistribution.push({ name: s._id, value: s.count });
            }
        });

        const hourlyCallsRaw = await CallLog.aggregate([
            {
                $match: {
                    telecaller: new mongoose.Types.ObjectId(telecallerId),
                    createdAt: { $gte: todayStart }
                }
            },
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Create a 24-hour timeline for the histogram so it's always "full"
        const hourlyCalls = Array.from({ length: 24 }, (_, i) => {
            const found = hourlyCallsRaw.find(h => h._id === i);
            return { hour: `${i}:00`, count: found ? found.count : 0 };
        });

        const recentLogs = await CallLog.find({ telecaller: telecallerId })
            .populate("lead", "name email phone")
            .sort({ createdAt: -1 })
            .limit(20);

        const pendingFollowUps = await FollowUp.find({
            telecaller: telecallerId,
            status: "pending"
        }).populate("lead", "name phone email").sort({ followUpDate: 1 });

        res.json({
            statusDistribution,
            hourlyCalls,
            recentLogs,
            pendingFollowUps
        });

    } catch (error) {
        console.error("Performance Insights Error:", error);
        next(error);
    }
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const telecallerId = req.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const terminalStatuses = ["Interested", "Not Interested", "Wrong Number", "Verified", "Rejected"];

        // 1. Identify the "Active Set" for today: 
        // Leads that are either NOT in a terminal status OR were moved to a terminal status TODAY.
        const activeLeads = await Lead.find({
            assignedTo: telecallerId,
            $or: [
                { status: { $nin: terminalStatuses } },
                { 
                    status: { $in: terminalStatuses },
                    updatedAt: { $gte: todayStart, $lt: tomorrowStart }
                }
            ]
        });

        const todaysTarget = activeLeads.length;

        // 2. Identify leads contacted today
        const uniqueLeadsContactedToday = await CallLog.distinct("lead", {
            telecaller: telecallerId,
            createdAt: { $gte: todayStart, $lt: tomorrowStart }
        });
        const contactedIds = uniqueLeadsContactedToday.map(id => id.toString());

        // 3. Leads Remaining: 
        // Leads from the active set that are NOT terminal AND have NOT been contacted today.
        const leadsRemainingCount = activeLeads.filter(lead => {
            const isTerminal = terminalStatuses.includes(lead.status);
            const isContacted = contactedIds.includes(lead._id.toString());
            return !isTerminal && !isContacted;
        }).length;

        const callsCompletedCount = uniqueLeadsContactedToday.length;

        // 4. Follow-ups for TODAY
        const followUpsToday = await FollowUp.countDocuments({
            telecaller: telecallerId,
            followUpDate: { $gte: todayStart, $lt: tomorrowStart },
            status: "pending"
        });

        // 5. Overdue Follow-ups
        const overdueFollowUps = await FollowUp.countDocuments({
            telecaller: telecallerId,
            followUpDate: { $lt: todayStart },
            status: "pending"
        });

        // 6. Daily Success Distribution (for charts)
        const statusStats = await Lead.aggregate([
            { 
                $match: { 
                    assignedTo: new mongoose.Types.ObjectId(telecallerId),
                    updatedAt: { $gte: todayStart }
                } 
            },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const dailyModifiedTotal = await Lead.countDocuments({ 
            assignedTo: telecallerId,
            updatedAt: { $gte: todayStart }
        });
        
        const successStats = statusStats.map(stat => ({
            label: stat._id,
            value: dailyModifiedTotal > 0 ? Math.round((stat.count / dailyModifiedTotal) * 100) : 0
        }));

        res.json({
            todaysTarget: todaysTarget,
            totalAssigned: todaysTarget,
            callsCompleted: callsCompletedCount,
            leadsRemaining: leadsRemainingCount,
            followUps: followUpsToday,
            pendingLeads: leadsRemainingCount,
            overdueFollowUps,
            successStats
        });

    } catch (error) {
        next(error);
    }
};


exports.createLead = async (req, res, next) => {
    try {
        const lead = await Lead.create(req.body);
        res.json(lead);
    } catch (error) {
        next(error);
    }
};

exports.getAllLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [leads, totalLeads, unassignedCount, assignedCount] = await Promise.all([
            Lead.find()
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Lead.countDocuments(),
            Lead.countDocuments({ assignedTo: { $in: [null, undefined] } }),
            Lead.countDocuments({ assignedTo: { $ne: null, $exists: true } })
        ]);

        res.json({
            leads,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                limit
            },
            summary: {
                total: totalLeads,
                unassigned: unassignedCount,
                assigned: assignedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const query = { assignedTo: req.user.id };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }

        const totalLeads = await Lead.countDocuments(query);
        let leads = await Lead.find(query)
            .sort({ createdAt: -1 });

        // Custom sorting: Interested leads at the bottom
        leads.sort((a, b) => {
            if (a.status === "Interested" && b.status !== "Interested") return 1;
            if (a.status !== "Interested" && b.status === "Interested") return -1;
            return 0;
        });

        // Apply manual pagination after custom sort
        const paginatedLeads = leads.slice(skip, skip + limit);

        res.json({
            leads: paginatedLeads,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getUnassignedLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { assignedTo: { $in: [null, undefined] } };
        const [leads, totalInView, totalCount, unassignedCount, assignedCount] = await Promise.all([
            Lead.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Lead.countDocuments(query),
            Lead.countDocuments(),
            Lead.countDocuments({ assignedTo: { $in: [null, undefined] } }),
            Lead.countDocuments({ assignedTo: { $ne: null, $exists: true } })
        ]);

        res.json({
            leads,
            pagination: {
                totalLeads: totalInView,
                totalPages: Math.ceil(totalInView / limit),
                currentPage: page,
                limit
            },
            summary: {
                total: totalCount,
                unassigned: unassignedCount,
                assigned: assignedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAssignedLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { assignedTo: { $ne: null, $exists: true } };
        const [leads, totalInView, totalCount, unassignedCount, assignedCount] = await Promise.all([
            Lead.find(query)
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Lead.countDocuments(query),
            Lead.countDocuments(),
            Lead.countDocuments({ assignedTo: { $in: [null, undefined] } }),
            Lead.countDocuments({ assignedTo: { $ne: null, $exists: true } })
        ]);

        res.json({
            leads,
            pagination: {
                totalLeads: totalInView,
                totalPages: Math.ceil(totalInView / limit),
                currentPage: page,
                limit
            },
            summary: {
                total: totalCount,
                unassigned: unassignedCount,
                assigned: assignedCount
            }
        });
    } catch (error) {
        next(error);
    }
};


exports.assignLead = async (req, res, next) => {
    try {
        const { leadId, telecallerId } = req.body;
        const lead = await Lead.findByIdAndUpdate(
            leadId,
            { assignedTo: telecallerId },
            { new: true }
        );
        res.json(lead);
    } catch (error) {
        next(error);
    }
};

exports.bulkAssign = async (req, res, next) => {
    try {
        const unassignedLeads = await Lead.find({ assignedTo: { $in: [null, undefined] } });
        const telecallers = await User.find({ role: "Telecaller", status: "Active" });

        if (unassignedLeads.length === 0) {
            return res.status(400).json({ msg: "No unassigned leads found" });
        }
        if (telecallers.length === 0) {
            return res.status(400).json({ msg: "No active telecallers found" });
        }

        const assignments = unassignedLeads.map((lead, index) => {
            const telecaller = telecallers[index % telecallers.length];
            return Lead.findByIdAndUpdate(lead._id, { assignedTo: telecaller._id });
        });

        await Promise.all(assignments);

        res.json({ msg: `Successfully assigned ${unassignedLeads.length} leads across ${telecallers.length} telecallers.` });
    } catch (error) {
        next(error);
    }
};

exports.updateLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes, callbackDate } = req.body;

        const lead = await Lead.findOne({ _id: id, assignedTo: req.user.id });

        if (!lead) {
            return res.status(404).json({ msg: "Lead not found or not assigned to you" });
        }

        if (status) lead.status = status;
        if (notes) lead.notes = notes;
        if (callbackDate) lead.callbackDate = callbackDate;

        await lead.save();

        res.json(lead);
    } catch (error) {
        next(error);
    }
};

exports.getCompletedLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const terminalStatuses = ["Interested", "Not Interested", "Wrong Number", "Verified", "Rejected"];
        
        const query = { status: { $in: terminalStatuses } };
        const totalLeads = await Lead.countDocuments(query);
        const leads = await Lead.find(query)
            .populate("assignedTo", "name email")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
            
        res.json({
            leads,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getLeadsForVerification = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { status: "Interested" };
        const totalLeads = await Lead.countDocuments(query);
        const leads = await Lead.find(query)
            .populate("assignedTo", "name")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            leads,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // "Verified" or "Rejected"

        const lead = await Lead.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ msg: "Lead not found" });
        }

        res.json(lead);
    } catch (error) {
        next(error);
    }
};
