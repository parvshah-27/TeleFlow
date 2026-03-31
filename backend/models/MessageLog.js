const mongoose = require("mongoose");

const messageLogSchema = new mongoose.Schema({
    leads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead"
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    message: String,
    status: { type: String, default: "Sent" },
    type: { type: String, default: "WhatsApp" }
}, { timestamps: true });

module.exports = mongoose.model("MessageLog", messageLogSchema);
