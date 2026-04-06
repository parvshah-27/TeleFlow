const mongoose = require('mongoose');
const dns = require('dns');

// Override DNS servers to Google's public DNS to bypass local resolver issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = "mongodb+srv://shahparv4327_db_user:Parv1234@parvshah27.g7oqgyi.mongodb.net/telecaller_db";

async function test() {
    console.log("Testing connection to: ", MONGO_URI);
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ Connection successful!");
        await mongoose.connection.close();
    } catch (err) {
        console.error("❌ Connection failed!");
        console.error(err);
    }
}

test();
