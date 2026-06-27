const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["confirmed", "cancelled"],
        default: "confirmed"
    }
}, { timestamps: true });

// Add indexes for booking query performance and overlap check optimization
bookingSchema.index({ listing: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
