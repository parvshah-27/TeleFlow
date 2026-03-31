const User = require("../models/User");
const Lead = require("../models/Lead");
const CallLog = require("../models/CallLog");
const bcrypt = require("bcryptjs");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalLeads = await Lead.countDocuments();
        const totalCalls = await CallLog.countDocuments();

        const interestedLeads = await Lead.countDocuments({ status: "Interested" });
        const conversionRate = totalLeads > 0 ? (interestedLeads / totalLeads) * 100 : 0;

        res.json({
            totalUsers,
            totalLeads,
            totalCalls,
            conversionRate: conversionRate.toFixed(2),
        });
    } catch (error) {
        next(error);
    }
};

exports.getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const totalUsers = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            users,
            pagination: {
                totalUsers,
                totalPages: Math.ceil(totalUsers / limit),
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.createUser = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    try {
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        user = new User({
            name,
            email: normalizedEmail,
            password,
            role,
        });

        await user.save();
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
};

exports.updateUser = async (req, res, next) => {
    const { name, email, password, role } = req.body;
    console.log(`Updating user ${req.params.id}. Email: ${email}, Password length: ${password ? password.length : 0}`);

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        user.name = name || user.name;
        user.email = email ? email.trim().toLowerCase() : user.email;
        user.role = role || user.role;
        
        // Explicitly check for non-empty string to avoid accidental clearing
        if (password && password.trim() !== "") {
            console.log("Setting new password for user...");
            user.password = password;
        }

        await user.save();
        console.log("User updated and saved. New hash check:", user.password.substring(0, 10) + "...");
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Unassign all leads assigned to this user before deleting
        await Lead.updateMany(
            { assignedTo: req.params.id },
            { $set: { assignedTo: null } }
        );

        await User.deleteOne({ _id: req.params.id });
        res.json({ msg: "User removed and their leads have been unassigned." });
    } catch (error) {
        next(error);
    }
};

exports.getGlobalReports = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const telecallers = await User.find({ role: "Telecaller" });

        const callsPerTelecaller = await Promise.all(
            telecallers.map(async (telecaller) => {
                const callCount = await CallLog.countDocuments({
                    telecaller: telecaller._id,
                    createdAt: { $gte: today, $lt: tomorrow },
                });
                return { name: telecaller.name, calls: callCount };
            })
        );

        const leadStatusDistribution = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        res.json({
            callsPerTelecaller,
            leadStatusDistribution,
        });
    } catch (error) {
        next(error);
    }
};

exports.getTelecallers = async (req, res, next) => {
    try {
        const telecallers = await User.find({ role: "Telecaller" });
        res.json(telecallers);
    } catch (error) {
        next(error);
    }
};
