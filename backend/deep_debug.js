const mongoose = require('mongoose');
require('dotenv').config();
const FollowUp = require('./models/FollowUp');
const User = require('./models/User');

async function deepDebug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const users = await User.find({}, 'name role _id');
        console.log("--- USERS IN DB ---");
        users.forEach(u => console.log(`${u.name} (${u.role}): ID = ${u._id}`));

        const followups = await FollowUp.find({});
        console.log("--- FOLLOWUPS IN DB ---");
        followups.forEach((f, i) => {
            console.log(`[${i+1}] Notes: ${f.notes}, TelecallerID: ${f.telecaller}, Status: ${f.status}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deepDebug();
