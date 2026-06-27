const Listing = require("../models/listing");
const { config, geocoding } = require('@maptiler/client');
const mapToken = process.env.MAPTILER_API_KEY || process.env.MAP_TOKEN || process.env.MAPBOX_TOKEN;
config.apiKey = mapToken;

// INDEX route — supports ?search= and ?category= query params
module.exports.index = async (req, res) => {
    const { search, category } = req.query;
    let filter = {};

    if (search) {
        // Case-insensitive search across title, location, country
        filter.$or = [
            { title:    { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { country:  { $regex: search, $options: "i" } },
        ];
    }

    if (category && category !== "all") {
        filter.category = category;
    }

    const allListings = await Listing.find(filter);
    
    let userWishlist = [];
    if (req.user) {
        const User = require("../models/user");
        const user = await User.findById(req.user._id);
        userWishlist = user ? user.wishlist : [];
    }

    res.render("listings/index.ejs", { allListings, searchQuery: search || "", activeCategory: category || "", userWishlist });
};

// NEW route — render form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// SHOW route
module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let userWishlist = [];
    if (req.user) {
        const User = require("../models/user");
        const user = await User.findById(req.user._id);
        userWishlist = user ? user.wishlist : [];
    }

    // Retrieve confirmed booking dates to disable them on calendar
    const Booking = require("../models/booking");
    const bookings = await Booking.find({ listing: id, status: "confirmed" });
    const bookedDates = bookings.map(b => ({
        from: b.startDate,
        to: b.endDate
    }));

    res.render("listings/show.ejs", { listing, mapToken, userWishlist, bookedDates });
};

// CREATE route
module.exports.createListing = async (req, res, next) => {
    // Geocode the listing location to get coordinates for the map
    let response;
    try {
        response = await geocoding.forward(req.body.listing.location, { limit: 1 });
    } catch (err) {
        console.error("MapTiler geocoding error:", err);
    }

    let url = req.file.path;
    let filename = req.file.filename;
        
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    
    // Save the geocoded geometry (coordinates) for the map
    if (response && response.features && response.features.length > 0) {
        newListing.geometry = response.features[0].geometry;
    } else {
        // Fallback coordinates (New Delhi) if geocoding fails or returns no features
        newListing.geometry = {
            type: "Point",
            coordinates: [77.209, 28.6139]
        };
    }
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// EDIT route — render edit form
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// UPDATE route
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }

    // Re-geocode if the location has changed
    if (req.body.listing.location && req.body.listing.location !== listing.location) {
        try {
            let response = await geocoding.forward(req.body.listing.location, { limit: 1 });
            if (response && response.features && response.features.length > 0) {
                listing.geometry = response.features[0].geometry;
            }
        } catch (err) {
            console.error("MapTiler geocoding error on update:", err);
        }
    }

    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// DELETE route
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};