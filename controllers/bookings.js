const Booking = require("../models/booking");
const Listing = require("../models/listing");

// List all bookings for the logged-in user
module.exports.index = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate({
            path: "listing",
            populate: {
                path: "owner"
            }
        })
        .sort({ startDate: 1 });
        
    res.render("bookings/index.ejs", { bookings });
};

// Create a new booking
module.exports.createBooking = async (req, res) => {
    const { listingId } = req.params;
    const { startDate, endDate } = req.body.booking;
    
    const listing = await Listing.findById(listingId);
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    
    // Check if the user trying to book is the listing owner
    const ownerId = (listing.owner && listing.owner._id) ? listing.owner._id : listing.owner;
    if (ownerId && ownerId.toString() === req.user._id.toString()) {
        req.flash("error", "You cannot book your own listing!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Date validation
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        req.flash("error", "Invalid dates selected!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    if (start < today) {
        req.flash("error", "Start date cannot be in the past!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    if (end <= start) {
        req.flash("error", "Check-out date must be after check-in date!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    // Check for conflicting bookings (overlap check query)
    const conflictingBooking = await Booking.findOne({
        listing: listingId,
        status: "confirmed",
        $or: [
            {
                startDate: { $lt: end },
                endDate: { $gt: start }
            }
        ]
    });
    
    if (conflictingBooking) {
        req.flash("error", "These dates are already booked by someone else!");
        return res.redirect(`/listings/${listingId}`);
    }
    
    // Calculate total price (including 18% GST)
    const timeDiff = end.getTime() - start.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const subtotal = nights * listing.price;
    const gst = Math.round(subtotal * 0.18);
    const totalPrice = subtotal + gst;
    
    const newBooking = new Booking({
        listing: listingId,
        user: req.user._id,
        startDate: start,
        endDate: end,
        totalPrice,
        status: "confirmed"
    });
    
    await newBooking.save();
    req.flash("success", "Booking confirmed! Have a great trip!");
    res.redirect("/bookings");
};

// Cancel a booking
module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/bookings");
    }
    
    // Verify booking belongs to the logged-in user
    if (!booking.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to cancel this booking.");
        return res.redirect("/bookings");
    }
    
    // Cancel the booking
    booking.status = "cancelled";
    await booking.save();
    
    req.flash("success", "Booking cancelled successfully.");
    res.redirect("/bookings");
};
