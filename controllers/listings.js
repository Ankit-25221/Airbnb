const { model } = require("mongoose");
const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const { query, response } = require("express");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

//index route
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

//new route
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

//show route
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
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
    };


    //create route
module.exports.createListing = async (req, res,next) => {
    // use mapbox
    //let response = await geocodingClient
        //.forwardGeocode({
        //query: req.body.listing.location,
        //limit: 1,
    //})
    //.send();


        
        //  if(!req.body.listing) {
        //      throw new ExpressError(400,"Send Valid Data for Listing");
        //  }
          // we handling error on schema module if any data is missing
          // But this method is not good because code line so large
          // So we Use joi ---> npm install joi first 
  
         // const newListing = new Listing(req.body.listing);
         // if(newListing.title) {
          //    throw new ExpressError(400,"Title is missing!");
         // }
          //if(newListing.description) {
           //   throw new ExpressError(400,"Description is missing!");
          //}
          //if(newListing.location) {
           //   throw new ExpressError(400,"Location is missing!");
          //}
  
          // let {title, description, image, price, country, location} = req.body;
      let url = req.file.path;
      let filename = req.file.filename;
          
      const newListing = new Listing(req.body.listing);
      newListing.owner = req.user._id;     
      newListing.image = {url, filename};
      //newListing.geometry =  response.body.features[0].geometry;
      await newListing.save();

      //let savedListing = await newListing.save();
      //console.log(savedListing);
      req.flash("success", "Now Listing Created!");
      res.redirect("/listings");
  };

  //edit route
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing , originalImageUrl});
};

//update route
module.exports.updateListing = async (req, res) => {
    //if(!req.body.listing) {
        //throw new ExpressError(400,"Send Valid Data for Listing");
   // }
let { id } = req.params;
let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

if (typeof req.file !== "undefined") {
let url = req.file.path;
let filename = req.file.filename;
listing.image = {url, filename};
await listing.save();
}
req.flash("success", "Listing Updated!");
res.redirect(`/listings/${ id }`);
};

//delete route
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};