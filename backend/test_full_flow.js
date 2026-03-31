const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testFullFlow() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const testEmail = "flow_test_" + Date.now() + "@example.com";
    const initialPassword = "InitialPassword123!";
    const updatedPassword = "UpdatedPassword123!";

    // 1. Create user (Admin logic)
    console.log("\n--- STEP 1: CREATE USER ---");
    let user = new User({
        name: "Flow Test",
        email: testEmail,
        password: initialPassword,
        role: "Telecaller"
    });
    await user.save();
    console.log("Created. Hash:", user.password);

    // 2. Try Login (Auth logic)
    console.log("\n--- STEP 2: LOGIN WITH INITIAL ---");
    const user1 = await User.findOne({ email: testEmail });
    const match1 = await bcrypt.compare(initialPassword, user1.password);
    console.log("Login Initial Match:", match1);

    // 3. Update Password (Admin Update logic)
    console.log("\n--- STEP 3: UPDATE PASSWORD ---");
    const foundUser = await User.findById(user._id);
    foundUser.password = updatedPassword;
    await foundUser.save();
    console.log("Updated. New Hash:", foundUser.password);

    // 4. Try Login with New Password (Auth logic)
    console.log("\n--- STEP 4: LOGIN WITH UPDATED ---");
    const user2 = await User.findOne({ email: testEmail });
    console.log("Stored Hash in DB:", user2.password);
    const match2 = await bcrypt.compare(updatedPassword, user2.password);
    console.log("Login Updated Match:", match2);

    // 5. Check if double hashed
    const matchDouble = await bcrypt.compare(updatedPassword, await bcrypt.hash(updatedPassword, 10)); // just a sanity check
    console.log("Sanity Check (bcrypt works):", !!matchDouble);

    if (!match2) {
        console.error("\nFAIL: Login failed after update!");
        // Let's see if it's plain text by accident
        if (user2.password === updatedPassword) {
            console.error("DEBUG: Password was stored as PLAIN TEXT!");
        }
    } else {
        console.log("\nSUCCESS: Full flow works in script.");
    }

    await User.deleteOne({ _id: user._id });
    await mongoose.connection.close();
}

testFullFlow().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
