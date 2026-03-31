const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function cleanLeads() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const db = mongoose.connection.db;
        const leadsCollection = db.collection('leads');

        const leads = await leadsCollection.find({}).toArray();
        console.log(`Checking ${leads.length} leads in raw mode...`);

        let fixCount = 0;
        for (const doc of leads) {
            const update = {};
            const unset = {};
            let needsUpdate = false;

            // Map and cleanup
            if (doc.Name && !doc.name) { update.name = doc.Name; needsUpdate = true; }
            if (doc.Email && !doc.email) { update.email = doc.Email; needsUpdate = true; }
            if (doc["Phone Number"] && !doc.phone) { update.phone = doc["Phone Number"]; needsUpdate = true; }
            if (doc["Product"] && !doc.product) { update.product = doc["Product"]; needsUpdate = true; }

            // Always unset the capitalized ones if they exist
            if (doc.Name !== undefined) { unset.Name = ""; needsUpdate = true; }
            if (doc.Email !== undefined) { unset.Email = ""; needsUpdate = true; }
            if (doc["Phone Number"] !== undefined) { unset["Phone Number"] = ""; needsUpdate = true; }
            if (doc["Product"] !== undefined) { unset["Product"] = ""; needsUpdate = true; }
            if (doc["Company Name"] !== undefined) { unset["Company Name"] = ""; needsUpdate = true; }

            if (needsUpdate) {
                const op = {};
                if (Object.keys(update).length > 0) op.$set = update;
                if (Object.keys(unset).length > 0) op.$unset = unset;

                await leadsCollection.updateOne({ _id: doc._id }, op);
                fixCount++;
            }
        }

        console.log(`Cleaned up ${fixCount} leads.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanLeads();
