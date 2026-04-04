const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Lead = require('./models/Lead');

async function debugData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB: ${mongoose.connection.host}`);

        const totalLeads = await Lead.countDocuments({});
        console.log(`Total Leads in DB: ${totalLeads}`);

        const unassigned_null = await Lead.countDocuments({ assignedTo: null });
        console.log(`Leads with assignedTo: null: ${unassigned_null}`);

        const unassigned_not_exists = await Lead.countDocuments({ assignedTo: { $exists: false } });
        console.log(`Leads where assignedTo doesn't exist: ${unassigned_not_exists}`);

        const assigned = await Lead.countDocuments({ assignedTo: { $exists: true, $ne: null } });
        console.log(`Leads with a valid assignedTo: ${assigned}`);

        const sampleUnassigned = await Lead.findOne({ 
            $or: [
                { assignedTo: null },
                { assignedTo: { $exists: false } }
            ]
        });
        
        if (sampleUnassigned) {
            console.log("Sample Unassigned Lead structure:");
            console.log(JSON.stringify(sampleUnassigned, null, 2));
        } else {
            console.log("No unassigned leads found in database.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugData();
