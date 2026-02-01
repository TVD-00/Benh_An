// Schema User (cho bình luận/góp ý)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    displayName: { type: String, required: true, maxlength: 50 },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Phân quyền: user hoặc admin
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre("save", function () {
    this.updatedAt = new Date();
});

module.exports = mongoose.model("User", userSchema);
