const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require('dotenv').config({ path: __dirname + '/.env' });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB for seeding");

        const password = "admin123";
        const hashedPassword = await bcrypt.hash(password, 10);

        const users = [
            {
                name: "Admin User",
                email: "admin@test.com",
                password: hashedPassword,
                role: "Admin",
                status: "Active"
            },
            {
                name: "Manager User",
                email: "manager@test.com",
                password: hashedPassword,
                role: "Manager",
                status: "Active"
            },
            {
                name: "Telecaller User",
                email: "telecaller@test.com",
                password: hashedPassword,
                role: "Telecaller",
                status: "Active"
            }
        ];

        await User.deleteMany({});
        await User.insertMany(users);
        console.log("✅ Database seeded successfully. All users password: " + password);
        
        process.exit();
    } catch (err) {
        console.error("❌ Seeding error:", err);
        process.exit(1);
    }
};

seedUsers();
