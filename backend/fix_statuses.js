const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Lead = require('./models/Lead');

async function fixStatuses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const result = await Lead.updateMany(
            { $or: [ { status: null }, { status: { $exists: false } } ] },
            { $set: { status: "New" } }
        );

        console.log(`Updated ${result.modifiedCount} leads to status: "New"`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixStatuses();
