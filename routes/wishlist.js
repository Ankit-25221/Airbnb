const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware.js");
const wishlistController = require("../controllers/wishlist.js");

router.route("/")
    .get(isLoggedIn, wrapAsync(wishlistController.index));

router.post("/toggle/:listingId", isLoggedIn, wrapAsync(wishlistController.toggleWishlist));

module.exports = router;
