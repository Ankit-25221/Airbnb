const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware.js");
const aiController = require("../controllers/ai.js");

// Rate limiter: max 5 requests per minute per IP address
const aiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: { 
        success: false, 
        error: "Too many AI requests. Please try again after 1 minute." 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// AI Description generation endpoint
router.post("/ai-description", isLoggedIn, aiLimiter, wrapAsync(aiController.generateDescription));

module.exports = router;
