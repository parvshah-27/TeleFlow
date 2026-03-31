const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // your SMTP user
        pass: process.env.SMTP_PASS, // your SMTP password
    },
});

exports.sendOTP = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"TeleFlow Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Verify your new email address",
            text: `Your OTP for email verification is: ${otp}. It expires in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #2563eb;">Email Verification</h2>
                    <p>You have requested to change your email address on TeleFlow.</p>
                    <p>Your 6-digit verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; text-align: center; margin: 20px 0; padding: 10px; background: #f8fafc; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this change, please ignore this email.</p>
                </div>
            `,
        });
        return true;
    } catch (error) {
        console.error("Mailer Error:", error);
        return false;
    }
};
