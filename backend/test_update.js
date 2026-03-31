const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testUpdate() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const testEmail = "test_update_" + Date.now() + "@example.com";
    
    // 1. Create user
    let user = new User({
        name: "Test Update",
        email: testEmail,
        password: "Password123!",
        role: "Telecaller"
    });
    await user.save();
    console.log("User created. Initial Hash:", user.password);

    // 2. Update user password
    const newPassword = "NewPassword123!";
    const userId = user._id;
    
    // Simulate what admin.controller.js does
    const foundUser = await User.findById(userId);
    foundUser.password = newPassword;
    await foundUser.save();
    
    console.log("User updated. New Hash:", foundUser.password);

    // 3. Verify comparison
    const isMatch = await bcrypt.compare(newPassword, foundUser.password);
    console.log("Bcrypt comparison match:", isMatch);

    if (foundUser.password === newPassword) {
        console.error("ERROR: Password was NOT hashed!");
    } else {
        console.log("SUCCESS: Password was hashed.");
    }

    await User.deleteOne({ _id: userId });
    await mongoose.connection.close();
}

testUpdate().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
