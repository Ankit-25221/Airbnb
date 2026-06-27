// Load environment variables from .env file
require('dotenv').config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const Booking = require("../models/booking.js");

const { config, geocoding } = require('@maptiler/client');
const mapToken = process.env.MAPTILER_API_KEY || "gvBIbPqheh0w6MhQoDnM";
config.apiKey = mapToken;

const MONGO_URL = process.argv[2] || process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

const seedDB = async () => {
    try {
        console.log("Connecting to Database...");
        await main();
        console.log("Connected successfully!");

        // 1. Clean existing database collections
        console.log("Clearing existing listings, reviews, bookings, and wishlists...");
        await Listing.deleteMany({});
        await Review.deleteMany({});
        await Booking.deleteMany({});
        await User.updateMany({}, { $set: { wishlist: [] } });

        // 2. Find or register default user
        let user = await User.findOne({});
        if (!user) {
            console.log("No users found. Creating a default demo user...");
            let fakeUser = new User({ email: "demouser@gmail.com", username: "demouser" });
            user = await User.register(fakeUser, "password123");
            console.log(`Demo user created: ${user.username} (email: ${user.email}, password: password123)`);
        } else {
            console.log(`Using existing user: ${user.username} (${user._id})`);
        }

        // 3. Geocode and populate listings
        // We will seed the first 10 listings from initData.data
        const listingsToSeed = initData.data.slice(0, 10);

        console.log(`Geocoding and preparing ${listingsToSeed.length} listings...`);
        for (let i = 0; i < listingsToSeed.length; i++) {
            const item = listingsToSeed[i];
            console.log(`[${i+1}/${listingsToSeed.length}] Geocoding: ${item.title} in ${item.location}, ${item.country}`);
            
            let geometry = { type: "Point", coordinates: [77.209, 28.6139] }; // Fallback
            try {
                const response = await geocoding.forward(`${item.location}, ${item.country}`, { limit: 1 });
                if (response && response.features && response.features.length > 0) {
                    geometry = response.features[0].geometry;
                }
            } catch (err) {
                console.error(`Geocoding failed for ${item.location}:`, err.message);
            }

            const listing = new Listing({
                ...item,
                owner: user._id,
                geometry: geometry
            });

            // Save listing to get an _id
            await listing.save();

            // 4. Create and add 2 reviews for this listing
            const review1 = new Review({
                comment: "Beautiful place! Had an absolutely amazing stay.",
                rating: 5,
                author: user._id
            });
            await review1.save();

            const review2 = new Review({
                comment: "Nice location and friendly host. Highly recommended!",
                rating: 4,
                author: user._id
            });
            await review2.save();

            listing.reviews.push(review1._id, review2._id);
            await listing.save();

            console.log(`Saved: ${listing.title} with 2 reviews and geometry:`, geometry);
        }

        console.log("Database seeded successfully with valid geocoded listings and reviews!");

    } catch (err) {
        console.error("Error during database seeding:", err);
    } finally {
        mongoose.connection.close();
        console.log("Connection closed.");
    }
};

seedDB();
