const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage });


// router.route combine all those route which start same route
router
    .route("/")
    .get(wrapAsync(listingController.index)) //Index.ejs route
    .post(  //Create Route
        isLoggedIn,
        //validateListing,
        upload.single("listing[image]"),
        wrapAsync ( listingController.createListing)
    );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);   
    
 router
    .route("/:id")
    .get( //shows Route
        wrapAsync (listingController.showListing))
        .put( //Update Route
            isLoggedIn,
            isOwner,
            upload.single("listing[image]"),
            validateListing,// we pass middleware see line 39
            wrapAsync (listingController.updateListing)
        )
        .delete( //Delete Route
            isLoggedIn,
            isOwner,
            wrapAsync ( listingController.destroyListing )
        );  

//Edit Route
router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync ( listingController.renderEditForm));

module.exports = router;