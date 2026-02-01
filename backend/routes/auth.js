// Routes: Auth API (User login/register)
// Đăng nhập = Đăng ký: Nếu username chưa tồn tại sẽ tự tạo user mới
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { rateLimitFeedback } = require('../middleware/rateLimit');
const { makeUserToken, requireUser } = require('../middleware/auth');
const { normalizeUsername, normalizeDisplayName, verifyPassword, hashPassword } = require('../utils/helpers');
const { USER_TOKEN_SECRET } = require('../config/env');

const router = express.Router();

// User login (tự động tạo tài khoản nếu chưa tồn tại)
router.post("/login", rateLimitFeedback, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    if (!USER_TOKEN_SECRET) return res.status(500).json({ error: "User auth not configured" });

    try {
        const username = normalizeUsername(req.body?.username);
        const password = String(req.body?.password || "");
        const displayName = normalizeDisplayName(req.body?.displayName) || username;

        if (!username) return res.status(400).json({ error: "Thiếu username" });
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            return res.status(400).json({ error: "Username chỉ gồm a-zA-Z0-9_ và dài 3-30 ký tự" });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password tối thiểu 6 ký tự" });
        }

        let user = await User.findOne({ username }).lean();
        let isNewUser = false;

        if (!user) {
            // Tự động tạo user mới nếu chưa tồn tại
            const { salt, hash } = hashPassword(password);
            const newUser = new User({
                username,
                displayName,
                passwordSalt: salt,
                passwordHash: hash,
                role: 'user', // User mới mặc định role = user (không phải admin)
                isActive: true
            });
            await newUser.save();
            user = newUser.toObject();
            isNewUser = true;
        } else {
            // User đã tồn tại - kiểm tra password
            if (user.isActive === false) {
                return res.status(403).json({ error: "Tài khoản đã bị khóa" });
            }

            const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
            if (!ok) {
                return res.status(401).json({ error: "Sai mật khẩu" });
            }
        }

        const token = makeUserToken(user._id);
        return res.json({
            ok: true,
            token,
            isNewUser, // Frontend có thể hiển thị thông báo chào mừng user mới
            user: {
                id: String(user._id),
                username: user.username,
                displayName: user.displayName,
                role: user.role || 'user'
            }
        });
    } catch (e) {
        // Duplicate username (race condition)
        if (e && (e.code === 11000 || String(e.message || "").includes("duplicate"))) {
            return res.status(409).json({ error: "Username đã tồn tại, vui lòng thử lại" });
        }
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Get current user info
router.get("/me", requireUser, async (req, res) => {
    return res.json({ ok: true, user: req.user });
});

module.exports = router;
