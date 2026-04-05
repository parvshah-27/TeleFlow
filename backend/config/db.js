const mongoose = require("mongoose");

module.exports = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log(`🍃 MongoDB Connected Successfully to: ${mongoose.connection.host}`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
