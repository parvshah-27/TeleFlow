const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOTP } = require("../utils/mailer");

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        console.log("Registration request received for:", normalizedEmail);

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ msg: "User with this email already exists" });
        }

        const newUser = new User({ name, email: normalizedEmail, password, role });
        await newUser.save();
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(`DEBUG: Login raw email: "${email}"`);
        const normalizedEmail = email ? email.toLowerCase().trim() : "";
        console.log(`DEBUG: Login normalized email: "${normalizedEmail}"`);
        
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log(`DEBUG: User not found in DB: "${normalizedEmail}"`);
            return res.status(404).json({ msg: "User not found" });
        }
        console.log(`DEBUG: User found in DB: ${user.email}, ID: ${user._id}`);

        console.log(`User found. Stored hash starts with: ${user.password.substring(0, 10)}...`);
        const ok = await bcrypt.compare(password, user.password);
        console.log(`Bcrypt compare result: ${ok}`);

        if (!ok) return res.status(401).json({ msg: "Wrong password" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ role: user.role, name: user.name, token });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.json({ msg: "Logged out successfully" });
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ msg: "User with this email not found" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user.emailOTP = otp;
        user.emailOTPExpires = otpExpires;
        await user.save();

        const sent = await sendOTP(email, otp);
        if (!sent) {
            return res.status(500).json({ msg: "Failed to send OTP. Please check SMTP settings." });
        }

        res.json({ msg: "OTP sent to " + email });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ msg: "User not found" });

        if (user.emailOTP !== otp || Date.now() > user.emailOTPExpires) {
            return res.status(400).json({ msg: "Invalid or expired OTP" });
        }

        user.password = password;
        user.emailOTP = undefined;
        user.emailOTPExpires = undefined;
        await user.save();

        res.json({ msg: "Password reset successfully. You can now login with your new password." });
    } catch (error) {
        next(error);
    }
};
