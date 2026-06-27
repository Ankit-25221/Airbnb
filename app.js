if(process.env.NODE_ENV != "production") {
require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
//const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
//const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
//const { listingSchema,reviewSchema } = require("./schema.js");
//const Review = require("./models/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const wishlistRouter = require("./routes/wishlist.js");
const bookingRouter = require("./routes/booking.js");
const apiRouter = require("./routes/api.js");


//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
async function main() {
    await mongoose.connect(dbUrl);
}
main()
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1); // Exit on DB failure — don't serve a broken app
    });



app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Trust proxy — required for Render, Railway, Heroku (fixes session/HTTPS)
app.set("trust proxy", 1);

const storeSecret = process.env.SECRET || "wanderlust_default_dev_secret_keys";

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: storeSecret,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.error("ERROR in MONGO SESSION STORE", err);
});

const isProduction = process.env.NODE_ENV === "production";

const sessionOptions = {
    store,
    secret: storeSecret,
    resave: false,
    saveUninitialized: false,  // Don't create session until something is stored
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,   // Only send over HTTPS in production
        sameSite: isProduction ? "strict" : "lax",
    },
};

//app.get("/", (req, res) => {
    //res.send("Hi, I am Root");
//});

// using session for cookie
app.use(session(sessionOptions));
// using flash for flash message
app.use(flash());

// middleware for passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//app.get("/demouser", async (req, res) => {
    //let fakeUser = new User({
        //email: "student@gmail.com",
        //username: "delta-student"
    //});

    //let registeredUser = await User.register(fakeUser,"Helloworld");
    //res.send(registeredUser);
//});

// Express router for listing
app.use("/listings", listingRouter);

// Express router for review
app.use("/listings/:id/reviews", reviewRouter);

// Express router for user
app.use("/", userRouter);

// Express router for wishlist
app.use("/wishlist", wishlistRouter);

// Express router for bookings
app.use("/bookings", bookingRouter);

// Express router for AI API
app.use("/api", apiRouter);

// Root redirect
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Static pages (fixes 404 on footer links)
app.get("/privacy", (req, res) => {
    res.render("privacy.ejs");
});

app.get("/terms", (req, res) => {
    res.render("terms.ejs");
});


//app.get("/testListing", async (req, res) => {
//    let sampleListing = new Listing ({
//        title:"My New Villa",
//        description: "By the beach",
//        price: 1200,
//        location: "Calangute, Goa",
//        country: "India",
//    });

//   await sampleListing.save();
//    console.log("sample was saved");
//    res.send("successful testing");
//});

//If user call any route which is not present the error hadler
//handle this type error
app.all("*", (req,res,next) => {
    next(new ExpressError(404,"Page Not found"));
});

//Middlewares for error handling
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    // In production, don't expose internal error details
    const displayMessage = process.env.NODE_ENV === "production" && statusCode === 500
        ? "An internal server error occurred. Please try again later."
        : message;
    if (process.env.NODE_ENV !== "production") {
        console.error("[ERROR]", err);
    }
    res.status(statusCode).render("error.ejs", { message: displayMessage });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});