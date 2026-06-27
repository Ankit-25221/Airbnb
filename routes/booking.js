const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware.js");
const bookingsController = require("../controllers/bookings.js");

router.route("/")
    .get(isLoggedIn, wrapAsync(bookingsController.index));

router.post("/:listingId", isLoggedIn, wrapAsync(bookingsController.createBooking));
router.post("/:id/cancel", isLoggedIn, wrapAsync(bookingsController.cancelBooking));

module.exports = router;
