// Schema Comment/Góp ý với chức năng Reply
const mongoose = require('mongoose');

// Schema cho reply (phản hồi từ admin hoặc user)
const replySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    username: { type: String, required: true, maxlength: 50 },
    text: { type: String, required: true, maxlength: 1000 },
    isAdmin: { type: Boolean, default: false }, // Đánh dấu reply từ admin
    createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    username: { type: String, required: true, maxlength: 50 },
    type: {
        type: String,
        default: "gopy",
        enum: ["gopy", "bug", "feature", "question", "other"]
    },
    text: { type: String, required: true, maxlength: 2000 },
    status: {
        type: String,
        default: "new",
        enum: ["new", "reviewed", "resolved", "rejected"]
    },
    heart: { type: Boolean, default: false },
    ipHash: { type: String, default: "" },
    meta: { type: Object, default: {} },
    replies: [replySchema], // Danh sách các reply
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

commentSchema.pre("save", function () {
    this.updatedAt = new Date();
});

module.exports = mongoose.model("Comment", commentSchema);
