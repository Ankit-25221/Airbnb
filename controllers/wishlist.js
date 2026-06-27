const User = require("../models/user");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: "wishlist",
        populate: {
            path: "owner"
        }
    });
    if (!user) {
        req.flash("error", "User not found!");
        return res.redirect("/listings");
    }
    res.render("wishlist/index.ejs", { wishlist: user.wishlist });
};

module.exports.toggleWishlist = async (req, res) => {
    const { listingId } = req.params;
    
    // Validate that the listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(404).json({ success: false, error: "Listing not found" });
        }
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ success: false, error: "Not authenticated" });
        }
        return res.redirect("/login");
    }
    
    // Use string comparison for ObjectId matching
    const existingIndex = user.wishlist.findIndex(id => id.toString() === listingId.toString());
    let added = false;
    
    if (existingIndex === -1) {
        user.wishlist.push(listingId);
        added = true;
    } else {
        user.wishlist.splice(existingIndex, 1);
        added = false;
    }
    
    await user.save();
    
    // Support both AJAX JSON responses and traditional redirects
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.json({ success: true, added });
    }
    
    req.flash("success", added ? "Listing added to wishlist!" : "Listing removed from wishlist!");
    // Safe redirect — use referrer or fallback to listings
    const redirectTo = req.headers.referer || `/listings/${listingId}`;
    res.redirect(redirectTo);
};
