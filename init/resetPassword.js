// Load environment variables from .env file
require('dotenv').config();

const mongoose = require("mongoose");
const User = require("../models/user.js");

const MONGO_URL = process.argv[4] || process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
const targetUsernameOrEmail = process.argv[2];
const newPassword = process.argv[3];

if (!targetUsernameOrEmail || !newPassword) {
    console.error("Usage: node init/resetPassword.js <username_or_email> <new_password> [optional_database_url]");
    process.exit(1);
}

async function main() {
    await mongoose.connect(MONGO_URL);
}

const resetPassword = async () => {
    try {
        console.log("Connecting to Database...");
        await main();
        console.log("Connected successfully!");

        // Try to find user by username or email
        let user = await User.findOne({
            $or: [
                { username: targetUsernameOrEmail },
                { email: targetUsernameOrEmail }
            ]
        });

        if (!user) {
            console.error(`User matching "${targetUsernameOrEmail}" not found.`);
            process.exit(1);
        }

        console.log(`User found: ${user.username} (${user.email})`);
        console.log("Setting new password...");
        
        await user.setPassword(newPassword);
        await user.save();

        console.log("Password reset successfully!");
    } catch (err) {
        console.error("Error resetting password:", err);
    } finally {
        mongoose.connection.close();
        console.log("Connection closed.");
    }
};

resetPassword();
