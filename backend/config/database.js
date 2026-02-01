// Kết nối MongoDB
const mongoose = require('mongoose');
const { DATABASE_URL } = require('./env');

function connectDatabase() {
    if (DATABASE_URL) {
        mongoose.connect(DATABASE_URL)
            .then(() => console.log("Connected to MongoDB"))
            .catch(err => console.error("MongoDB connection error:", err));
    } else {
        console.warn("Missing DATABASE_URL - comments APIs will not work.");
    }
}

module.exports = { connectDatabase, mongoose };
