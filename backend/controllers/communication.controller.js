const Lead = require("../models/Lead");
const MessageLog = require("../models/MessageLog");
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

let client;
try {
    if (accountSid && authToken) {
        client = twilio(accountSid, authToken);
        console.log("✅ Twilio Client Initialized with SID:", accountSid);
    } else {
        console.error("❌ Twilio Credentials Missing: SID or AuthToken");
    }
} catch (err) {
    console.error("❌ Failed to initialize Twilio client:", err.message);
}

exports.sendBulkWhatsApp = async (req, res, next) => {
    try {
        console.log("Bulk WhatsApp request received from user:", req.user.id);
        const { leadIds, message } = req.body;

        if (!client) {
            return res.status(500).json({ msg: "Twilio client is not configured" });
        }

        if (!leadIds || leadIds.length === 0) {
            return res.status(400).json({ msg: "No leads selected" });
        }
        if (!message) {
            return res.status(400).json({ msg: "Message content is required" });
        }

        const leads = await Lead.find({ _id: { $in: leadIds } });
        console.log(`🔍 Found ${leads.length} leads for broadcast out of ${leadIds.length} requested.`);

        const results = {
            success: 0,
            failed: 0,
            details: []
        };

        let lastError = "";
        // For Trial accounts, you MUST use the Sandbox number until your own number is approved for WhatsApp
        // Sandbox number is usually +14155238886
        const fromWhatsApp = "whatsapp:+14155238886"; 

        for (const lead of leads) {
            try {
                if (!lead.phone) {
                    results.failed++;
                    results.details.push({ lead: lead.name, status: "Failed", error: "No phone number" });
                    continue;
                }

                // Format phone number to E.164
                let rawPhone = lead.phone.trim();
                let cleaned = rawPhone.replace(/[^\d+]/g, '');

                if (!cleaned.startsWith('+')) {
                    cleaned = cleaned.replace(/^0+/, '');
                    if (cleaned.length === 10) {
                        cleaned = `+91${cleaned}`;
                    } else {
                        cleaned = `+${cleaned}`;
                    }
                }
                
                const toWhatsApp = `whatsapp:${cleaned}`;

                // Personalize message
                const personalizedMessage = message
                    .replace(/{{name}}/g, lead.name || "Customer")
                    .replace(/{{phone}}/g, lead.phone || "")
                    .replace(/{{product}}/g, lead.product || "Service")
                    .replace(/{{sender}}/g, req.user.name || "TeleFlow");

                console.log(`Attempting WhatsApp to ${toWhatsApp} from ${fromWhatsApp}`);

                const msgResponse = await client.messages.create({
                    body: personalizedMessage,
                    from: fromWhatsApp,
                    to: toWhatsApp
                });
                
                console.log(`WhatsApp Sent! SID: ${msgResponse.sid}, Status: ${msgResponse.status}`);

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
            finalMsg += ` Error: ${lastError}`;
        }

        res.json({
            success: results.success > 0,
            msg: finalMsg,
            logId: log._id,
            results: results
        });
    } catch (error) {
        console.error("Error in communication controller:", error);
        next(error);
    }
};

exports.sendBulkSMS = async (req, res, next) => {
    try {
        console.log("Bulk SMS request received from user:", req.user.id);
        const { leadIds, message } = req.body;

        if (!client) {
            return res.status(500).json({ msg: "Twilio client is not configured" });
        }

        if (!leadIds || leadIds.length === 0) {
            return res.status(400).json({ msg: "No leads selected" });
        }
        if (!message) {
            return res.status(400).json({ msg: "Message content is required" });
        }

        const leads = await Lead.find({ _id: { $in: leadIds } });
        console.log(`🔍 Found ${leads.length} leads for broadcast out of ${leadIds.length} requested.`);

        const results = {
            success: 0,
            failed: 0,
            details: []
        };

        let lastError = "";

        for (const lead of leads) {
            try {
                if (!lead.phone) {
                    results.failed++;
                    results.details.push({ lead: lead.name, status: "Failed", error: "No phone number" });
                    continue;
                }

                // Format phone number to E.164
                let rawPhone = lead.phone.trim();
                
                // Keep only numbers and + sign
                let cleaned = rawPhone.replace(/[^\d+]/g, '');

                if (!cleaned.startsWith('+')) {
                    // Remove any leading zeros if they exist (e.g., 091...)
                    cleaned = cleaned.replace(/^0+/, '');

                    // If it's a 10-digit number, assume it's Indian and needs +91
                    if (cleaned.length === 10) {
                        cleaned = `+91${cleaned}`;
                    } else if (cleaned.length > 10 && (cleaned.startsWith('91') || cleaned.startsWith('1'))) {
                        cleaned = `+${cleaned}`;
                    } else {
                        cleaned = `+${cleaned}`;
                    }
                }
                
                const phoneNumber = cleaned;

                // Personalize message
                const personalizedMessage = message
                    .replace(/{{name}}/g, lead.name || "Customer")
                    .replace(/{{phone}}/g, lead.phone || "")
                    .replace(/{{product}}/g, lead.product || "Service")
                    .replace(/{{sender}}/g, req.user.name || "TeleFlow");

                // Use the configured number EXACTLY as it is in .env per user request
                const fromNumber = twilioNumber.trim();

                console.log(`📡 BROADCAST: Attempting SMS to ${phoneNumber} from ${fromNumber}`);

                const msgResponse = await client.messages.create({
                    body: personalizedMessage,
                    from: fromNumber,
                    to: phoneNumber
                });
                
                console.log(`✅ BROADCAST: SMS Sent to ${phoneNumber}. SID: ${msgResponse.sid}`);

                results.success++;
                results.details.push({ lead: lead.name, status: "Success" });
            } catch (error) {
                console.error(`Twilio Error for ${lead.name} (${lead.phone}):`, error.message);
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
            finalMsg += ` Error: ${lastError}`;
        }

        // Use appropriate status code for partial or total failure
        const statusCode = results.success > 0 ? 200 : (results.failed > 0 ? 400 : 200);

        res.status(statusCode).json({
            success: results.success > 0,
            msg: finalMsg,
            logId: log._id,
            results: results
        });
    } catch (error) {
        console.error("Error in communication controller:", error);
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
        console.error("Error in communication controller:", error);
        next(error);
    }
};
