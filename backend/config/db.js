const mongoose = require("mongoose");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
// This fixes the 'querySrv ECONNREFUSED' issue often caused by ISP DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`🍃 MongoDB Connected Successfully to: ${mongoose.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
