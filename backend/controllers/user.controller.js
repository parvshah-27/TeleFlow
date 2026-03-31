const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendOTP } = require("../utils/mailer");
const crypto = require("crypto");

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        console.log("DEBUG: Fetching profile for user ID:", userId);
        
        if (!userId) {
            console.error("DEBUG: No user ID found in request object. req.user:", req.user);
            return res.status(401).json({ msg: "Authentication failed: No user ID" });
        }

        const user = await User.findById(userId).select("-password -emailOTP -emailOTPExpires");
        if (!user) {
            console.warn("DEBUG: User not found in database for ID:", userId);
            const allUsersCount = await User.countDocuments();
            console.log(`DEBUG: Total users in DB: ${allUsersCount}`);
            return res.status(404).json({ msg: "User account not found" });
        }
        console.log(`DEBUG: User found for profile: ${user.email}`);
        res.json(user);
    } catch (error) {
        console.error("Error in getProfile controller:", error);
        next(error);
    }
};

exports.sendEmailOTP = async (req, res, next) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!newEmail) return res.status(400).json({ msg: "New email is required" });

        // Check if email already exists
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) return res.status(400).json({ msg: "Email already in use" });

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await User.findByIdAndUpdate(userId, {
            emailOTP: otp,
            emailOTPExpires: otpExpires
        });

        const sent = await sendOTP(newEmail, otp);
        if (!sent) {
            return res.status(500).json({ msg: "Failed to send OTP. Please check SMTP settings." });
        }

        res.json({ msg: "OTP sent to " + newEmail });
    } catch (error) {
        console.error("Error in sendEmailOTP:", error);
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, email, password, oldPassword, otp } = req.body;
        const userId = req.user?.id || req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ msg: "Authentication failed: No user ID" });
        }

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ msg: "User not found" });

        // If trying to change password, verify old password first
        if (password) {
            if (!oldPassword) {
                return res.status(400).json({ msg: "Old password is required to set a new password" });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: "Incorrect old password" });
            }
            user.password = password; 
        }

        // Handle Email Change with OTP
        if (email && email !== user.email) {
            if (!otp) {
                return res.status(400).json({ msg: "OTP is required to change email" });
            }

            if (user.emailOTP !== otp || Date.now() > user.emailOTPExpires) {
                return res.status(400).json({ msg: "Invalid or expired OTP" });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ msg: "Email already in use" });
            }

            user.email = email;
            user.emailOTP = undefined;
            user.emailOTPExpires = undefined;
        }

        if (name) user.name = name;

        await user.save();
        res.json({ msg: "Profile updated successfully", name: user.name, email: user.email });
    } catch (error) {
        console.error("Error in updateProfile controller:", error);
        next(error);
    }
};
