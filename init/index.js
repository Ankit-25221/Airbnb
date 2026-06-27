// Load environment variables from .env file
require('dotenv').config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

// Use Atlas URL from .env if available, otherwise fall back to local MongoDB
const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

main()
.then(() => {
    console.log("connected to DB");
})
.catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(MONGO_URL);    
}
const initDB = async () => {
    await Listing.deleteMany({});
    
    let user = await User.findOne({});
    if (!user) {
        let fakeUser = new User({ email: "demouser@gmail.com", username: "demouser" });
        user = await User.register(fakeUser, "password123");
    }

    initData.data = initData.data.map((obj) => ({ ...obj, owner: user._id}));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};

initDB();