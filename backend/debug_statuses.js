const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Lead = require('./models/Lead');

async function debugStatuses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const distribution = await Lead.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        
        console.log("Lead Status Distribution in DB:");
        console.log(JSON.stringify(distribution, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugStatuses();
