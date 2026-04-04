const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    product: String,
    price: { type: Number, default: 0 },
    notes: String,
    callbackDate: Date,
    status: { type: String, default: "New" },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

module.exports = mongoose.model("Lead", leadSchema);
