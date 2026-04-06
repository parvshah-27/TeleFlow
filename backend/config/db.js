const mongoose = require("mongoose");
const dns = require("dns");

module.exports = async () => {
    try {
        // Fix for querySrv ECONNREFUSED issues on some networks
        dns.setServers(["8.8.8.8", "8.8.4.4"]);
        
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("❌ MONGO_URI is not defined in .env");
            process.exit(1);
        }
        const maskedUri = uri.replace(/:([^@]+)@/, ":****@");
        console.log(`📡 Attempting to connect to MongoDB: ${maskedUri}`);
        await mongoose.connect(uri);
        console.log(`🍃 MongoDB Connected Successfully to: ${mongoose.connection.host}`);
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};
