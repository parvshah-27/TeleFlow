const mongoose = require("mongoose");

const callSchema = new mongoose.Schema({
    lead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    telecaller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: String,
    notes: String,
    callbackDate: Date,
    script: { type: mongoose.Schema.Types.ObjectId, ref: "Script" }
}, { timestamps: true });

module.exports = mongoose.model("CallLog", callSchema);
