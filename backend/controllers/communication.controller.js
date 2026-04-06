const Lead = require("../models/Lead");
const MessageLog = require("../models/MessageLog");
const twilio = require('twilio');

// Helper to get Twilio client with fresh credentials from process.env
const getTwilioConfig = () => {
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    const twilioNumber = (process.env.TWILIO_PHONE_NUMBER || "").trim();
    
    return { accountSid, authToken, twilioNumber };
};

const getTwilioClient = () => {
    const { accountSid, authToken } = getTwilioConfig();
    
    if (!accountSid || !authToken) {
        console.error("❌ Twilio Credentials Missing in .env");
        return null;
    }
    
    try {
        return twilio(accountSid, authToken);
    } catch (err) {
        console.error("❌ Failed to initialize Twilio client:", err.message);
        return null;
    }
};

exports.sendBulkWhatsApp = async (req, res, next) => {
    try {
        console.log("Bulk WhatsApp request received from user:", req.user.id);
        const { leadIds, message } = req.body;

        const client = getTwilioClient();
        if (!client) {
            return res.status(500).json({ msg: "Twilio client is not configured. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env" });
        }

        if (!leadIds || leadIds.length === 0) {
            return res.status(400).json({ msg: "No leads selected" });
        }
        if (!message) {
            return res.status(400).json({ msg: "Message content is required" });
        }

        const leads = await Lead.find({ _id: { $in: leadIds } });
        const results = { success: 0, failed: 0, details: [] };
        let lastError = "";

        // WhatsApp Sandbox number
        const fromWhatsApp = "whatsapp:+14155238886"; 

        for (const lead of leads) {
            try {
                if (!lead.phone) {
                    results.failed++;
                    results.details.push({ lead: lead.name, status: "Failed", error: "No phone number" });
                    continue;
                }

                let cleaned = lead.phone.trim().replace(/[^\d+]/g, '');
                if (!cleaned.startsWith('+')) {
                    cleaned = cleaned.replace(/^0+/, '');
                    cleaned = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
                }
                
                const toWhatsApp = `whatsapp:${cleaned}`;
                const personalizedMessage = message
                    .replace(/{{name}}/g, lead.name || "Customer")
                    .replace(/{{phone}}/g, lead.phone || "")
                    .replace(/{{product}}/g, lead.product || "Service")
                    .replace(/{{sender}}/g, req.user.name || "TeleFlow");

                const msgResponse = await client.messages.create({
                    body: personalizedMessage,
                    from: fromWhatsApp,
                    to: toWhatsApp
                });
                
                results.success++;
                results.details.push({ lead: lead.name, status: "Success" });
            } catch (error) {
                console.error(`WhatsApp Error for ${lead.name}:`, error.message);
                lastError = error.message;
                results.failed++;
                results.details.push({ lead: lead.name, status: "Failed", error: error.message });
            }
        }

        const log = await MessageLog.create({
            leads: leadIds,
            sender: req.user.id,
            message: message,
            status: results.failed === 0 ? "Success" : (results.success > 0 ? "Partial" : "Failed"),
            type: "WhatsApp"
        });

        let finalMsg = `Successfully broadcasted to ${results.success} leads via WhatsApp. Failed for ${results.failed} leads.`;
        if (results.success === 0 && results.failed > 0) {
            finalMsg += ` Error: ${lastError === "Authenticate" ? "Invalid Twilio Credentials (401 Authenticate)" : lastError}`;
        }

        res.json({ success: results.success > 0, msg: finalMsg, logId: log._id, results });
    } catch (error) {
        console.error("Error in sendBulkWhatsApp:", error);
        next(error);
    }
};

exports.sendBulkSMS = async (req, res, next) => {
    try {
        console.log("Bulk SMS request received from user:", req.user.id);
        const { leadIds, message } = req.body;

        const config = getTwilioConfig();
        const client = getTwilioClient();
        
        if (!client || !config.twilioNumber) {
            return res.status(500).json({ msg: "Twilio is not fully configured. Check .env for SID, Token and Phone Number." });
        }

        if (!leadIds || leadIds.length === 0) {
            return res.status(400).json({ msg: "No leads selected" });
        }

        const leads = await Lead.find({ _id: { $in: leadIds } });
        const results = { success: 0, failed: 0, details: [] };
        let lastError = "";

        for (const lead of leads) {
            try {
                if (!lead.phone) {
                    results.failed++;
                    results.details.push({ lead: lead.name, status: "Failed", error: "No phone number" });
                    continue;
                }

                let cleaned = lead.phone.trim().replace(/[^\d+]/g, '');
                if (!cleaned.startsWith('+')) {
                    cleaned = cleaned.replace(/^0+/, '');
                    cleaned = cleaned.length === 10 ? `+91${cleaned}` : `+${cleaned}`;
                }
                
                const personalizedMessage = message
                    .replace(/{{name}}/g, lead.name || "Customer")
                    .replace(/{{phone}}/g, lead.phone || "")
                    .replace(/{{product}}/g, lead.product || "Service")
                    .replace(/{{sender}}/g, req.user.name || "TeleFlow");

                const msgResponse = await client.messages.create({
                    body: personalizedMessage,
                    from: config.twilioNumber,
                    to: cleaned
                });
                
                results.success++;
                results.details.push({ lead: lead.name, status: "Success" });
            } catch (error) {
                console.error(`SMS Error for ${lead.name}:`, error.message);
                lastError = error.message;
                results.failed++;
                results.details.push({ lead: lead.name, status: "Failed", error: error.message });
            }
        }

        const log = await MessageLog.create({
            leads: leadIds,
            sender: req.user.id,
            message: message,
            status: results.failed === 0 ? "Success" : (results.success > 0 ? "Partial" : "Failed"),
            type: "SMS"
        });

        let finalMsg = `Successfully sent SMS to ${results.success} leads. Failed for ${results.failed} leads.`;
        if (results.success === 0 && results.failed > 0) {
            finalMsg += ` Error: ${lastError === "Authenticate" ? "Invalid Twilio Credentials (401 Authenticate)" : lastError}`;
        }

        res.status(results.success > 0 ? 200 : 400).json({
            success: results.success > 0,
            msg: finalMsg,
            logId: log._id,
            results
        });
    } catch (error) {
        console.error("Error in sendBulkSMS:", error);
        next(error);
    }
};

exports.getMessageLogs = async (req, res, next) => {
    try {
        const logs = await MessageLog.find()
            .populate("sender", "name")
            .populate("leads", "name phone")
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(logs);
    } catch (error) {
        console.error("Error in getMessageLogs:", error);
        next(error);
    }
};
