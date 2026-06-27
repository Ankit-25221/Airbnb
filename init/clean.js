// Load environment variables from .env file
require('dotenv').config();

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");
const User = require("../models/user.js");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

const cleanDB = async () => {
    try {
        console.log("Connecting to Database...");
        await main();
        console.log("Connected successfully!");

        console.log("Deleting all Listings...");
        await Listing.deleteMany({});

        console.log("Deleting all Reviews...");
        await Review.deleteMany({});

        console.log("Deleting all Bookings...");
        await Booking.deleteMany({});

        console.log("Emptying all User wishlists...");
        await User.updateMany({}, { $set: { wishlist: [] } });

        console.log("Database cleared successfully!");
    } catch (err) {
        console.error("Error during database cleaning:", err);
    } finally {
        mongoose.connection.close();
        console.log("Connection closed.");
    }
};

cleanDB();
