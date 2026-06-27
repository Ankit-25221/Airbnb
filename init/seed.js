// Load environment variables from .env file
require('dotenv').config();

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const { config, geocoding } = require('@maptiler/client');

const mapToken = process.env.MAPTILER_API_KEY || process.env.MAP_TOKEN || process.env.MAPBOX_TOKEN;
config.apiKey = mapToken;

const MONGO_URL = process.argv[2] || process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

const seedSampleListings = [
    {
        title: "Cozy Beachfront Cottage",
        description: "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy access to the beach.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60"
        },
        price: 1500,
        location: "Malibu, California",
        country: "United States",
        category: "Trending"
    },
    {
        title: "Modern Loft in Downtown",
        description: "Stay in the heart of the city in this stylish loft apartment. Perfect for urban explorers!",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60"
        },
        price: 900,
        location: "New York City, New York",
        country: "United States",
        category: "Rooms"
    },
    {
        title: "Historic Villa in Tuscany",
        description: "Experience the charm of Tuscany in this beautifully restored villa. Explore the rolling hills and vineyards.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=60"
        },
        price: 2500,
        location: "Florence, Tuscany",
        country: "Italy",
        category: "Iconic Cities"
    },
    {
        title: "Alpine Ski Chalet",
        description: "Unplug and unwind in this peaceful mountain cabin. Surrounded by nature, it's a perfect place to recharge.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=60"
        },
        price: 4500,
        location: "Aspen, Colorado",
        country: "United States",
        category: "Mountains"
    },
    {
        title: "Medieval Castle Chamber",
        description: "Step back in time with a stay in this beautifully preserved castle suite, featuring stone walls and classic tapestries.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=800&q=60"
        },
        price: 8500,
        location: "Edinburgh, Scotland",
        country: "United Kingdom",
        category: "Castles"
    },
    {
        title: "Tropical Oasis Pool House",
        description: "Indulge in island living with private access to a beautiful infinity pool surrounded by lush tropical gardens.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=60"
        },
        price: 3000,
        location: "Bali",
        country: "Indonesia",
        category: "Amazing Pools"
    },
    {
        title: "Serene Lakefront Tent",
        description: "Go glamping in style in this heavy-duty canvas tent right next to the crystal-clear waters of the lake.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=60"
        },
        price: 600,
        location: "Banff, Alberta",
        country: "Canada",
        category: "Camping"
    },
    {
        title: "Organic Farmhouse Stay",
        description: "Live the quiet life at this functioning organic farm. Fresh milk and eggs are provided every morning!",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=60"
        },
        price: 1100,
        location: "Pienza, Tuscany",
        country: "Italy",
        category: "Farms"
    },
    {
        title: "Modern Glass Igloo",
        description: "Watch the northern lights dance across the night sky directly from the comfort of your warm bed.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=60"
        },
        price: 7500,
        location: "Tromso",
        country: "Norway",
        category: "Arctic"
    },
    {
        title: "Luxury Dome Retreat",
        description: "A gorgeous geodesic dome situated in the heart of the red rocks. Perfect for stargazing and hiking.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=60"
        },
        price: 3800,
        location: "Sedona, Arizona",
        country: "United States",
        category: "Domes"
    },
    {
        title: "Classic Houseboat Cruise",
        description: "Sleep on the canals of Amsterdam in this fully furnished modern houseboat with an outdoor deck.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=60"
        },
        price: 2000,
        location: "Amsterdam",
        country: "Netherlands",
        category: "Boats"
    },
    {
        title: "Sunset Beach Villa",
        description: "A luxury beach house with floor-to-ceiling windows offering a panoramic view of the Arabian Sea sunset.",
        image: {
            filename: "listingimage",
            url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=60"
        },
        price: 5000,
        location: "Goa",
        country: "India",
        category: "Trending"
    }
];

const seedDB = async () => {
    try {
        console.log("Connecting to Database...");
        await main();
        console.log("Connected successfully!");

        // 1. Get or create a user to own these listings
        let user = await User.findOne({});
        if (!user) {
            console.log("No users found. Creating a demouser...");
            let fakeUser = new User({ email: "demouser@gmail.com", username: "demouser" });
            user = await User.register(fakeUser, "password123");
            console.log("Demouser created successfully!");
        } else {
            console.log(`Using existing user: ${user.username} (${user.email})`);
        }

        // 2. Clear old listings
        console.log("Clearing old listings...");
        await Listing.deleteMany({});
        await Review.deleteMany({});
        console.log("Old listings cleared.");

        // 3. Geocode and insert each listing
        console.log("Geocoding and inserting listings...");
        for (let item of seedSampleListings) {
            console.log(`Geocoding: ${item.location}...`);
            let geometry = { type: "Point", coordinates: [77.209, 28.6139] }; // Fallback to New Delhi
            try {
                const response = await geocoding.forward(item.location, { limit: 1 });
                if (response && response.features && response.features.length > 0) {
                    geometry = response.features[0].geometry;
                    console.log(`Geocoding success for ${item.location}: ${JSON.stringify(geometry.coordinates)}`);
                } else {
                    console.log(`Geocoding returned no features for ${item.location}. Using fallback.`);
                }
            } catch (err) {
                console.error(`Geocoding failed for ${item.location}:`, err.message);
            }

            const newListing = new Listing({
                ...item,
                owner: user._id,
                geometry: geometry
            });

            // 4. Add a sample review
            const sampleReview = new Review({
                comment: `Absolutely amazing experience! The ${item.category} vibe here was beautiful and clean.`,
                rating: 5,
                author: user._id
            });
            await sampleReview.save();

            newListing.reviews.push(sampleReview._id);
            await newListing.save();
            console.log(`Saved listing: "${item.title}" with a sample review!`);
        }

        console.log("Database seeded successfully with geocoded listings and reviews!");
    } catch (err) {
        console.error("Error during database seeding:", err);
    } finally {
        mongoose.connection.close();
        console.log("Connection closed.");
    }
};

seedDB();
