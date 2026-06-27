const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

// Valid categories matching the filter buttons on the index page
const CATEGORIES = ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles",
    "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"];

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    // NEW: category field to support filter buttons
    category: {
        type: String,
        enum: [...CATEGORIES, ""],
        default: "",
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    reviewSummary: {
        type: String,
        default: "",
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
        },
    },
});

// Cascade delete: when a listing is deleted, also delete all its reviews
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
