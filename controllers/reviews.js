const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id).populate("reviews");
    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }
    
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    await newReview.save();
    
    listing.reviews.push(newReview);
    
    // Regenerate and cache the AI review summary
    const { summarizeReviews } = require("./ai");
    listing.reviewSummary = await summarizeReviews(listing.reviews);

    await listing.save();
    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    
    // Fetch remaining reviews and update cached AI summary
    let listing = await Listing.findById(id).populate("reviews");
    if (listing) {
        const { summarizeReviews } = require("./ai");
        listing.reviewSummary = await summarizeReviews(listing.reviews);
        await listing.save();
    }
    
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
};

