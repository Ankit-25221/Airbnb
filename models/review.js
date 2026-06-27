const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    // FIX: Renamed 'createAt' → 'createdAt' (typo fix)
    // FIX: Changed Date.now() → Date.now (function ref, not evaluated at schema load)
    createdAt: {
        type: Date,
        default: Date.now,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

module.exports = mongoose.model("Review", reviewSchema);