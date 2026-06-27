const Joi = require('joi');

const CATEGORIES = ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles",
    "Amazing Pools", "Camping", "Farms", "Arctic", "Domes", "Boats", ""];

const listingSchema = Joi.object({
    listing: Joi.object({
        title:       Joi.string().required(),
        description: Joi.string().required(),
        location:    Joi.string().required(),
        country:     Joi.string().required(),
        price:       Joi.number().required().min(0),
        // image is a file upload handled by multer — req.body won't contain it, so it must be optional
        image:       Joi.string().allow("", null).optional(),
        // category is optional but must be one of the valid values if provided
        category:    Joi.string().valid(...CATEGORIES).allow("").optional(),
    }).required(),
});

module.exports.listingSchema = listingSchema;

// Reviews schema
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating:  Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});
