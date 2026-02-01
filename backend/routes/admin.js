// Routes: Admin API
// Xac thuc bang role cua user (role = 'admin'), khong dung admin password rieng
const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { requireAdminUser } = require('../middleware/auth');
const { normalizeUsername, normalizeDisplayName, hashPassword } = require('../utils/helpers');

const router = express.Router();

// ============================================================================
// FEEDBACK MANAGEMENT
// ============================================================================

router.get("/feedback", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const rows = await Comment.find().sort({ createdAt: -1 }).limit(500).lean();
        const out = rows.map(c => ({
            id: c._id,
            userId: c.userId ? String(c.userId) : null,
            username: c.username,
            type: c.type || "gopy",
            status: c.status || "new",
            text: c.text,
            heart: !!c.heart,
            ipHash: c.ipHash || "",
            meta: c.meta || {},
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        }));
        return res.json(out);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

router.patch("/feedback/:id", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const id = String(req.params.id || "").trim();
        const update = {};

        if (typeof req.body?.heart === "boolean") {
            update.heart = req.body.heart;
        }

        if (typeof req.body?.status === "string") {
            const statusRaw = req.body.status.trim().toLowerCase();
            const allowed = new Set(["new", "reviewed", "resolved", "rejected"]);
            if (!allowed.has(statusRaw)) {
                return res.status(400).json({ error: "Status không hợp lệ" });
            }
            update.status = statusRaw;
        }

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ error: "Không có dữ liệu cập nhật" });
        }

        update.updatedAt = new Date();
        const output = await Comment.findByIdAndUpdate(id, update, { new: true });
        if (!output) return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true, item: output });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

router.delete("/feedback/:id", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const output = await Comment.findByIdAndDelete(req.params.id);
        if (!output) return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true, id: req.params.id });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Reply vào feedback (admin)
router.post("/feedback/:id/reply", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const text = String(req.body?.text || "").trim();
        if (!text) return res.status(400).json({ error: "Vui lòng nhập nội dung phản hồi" });
        if (text.length > 1000) return res.status(400).json({ error: "Nội dung quá dài" });

        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: "Không tìm thấy feedback" });

        const reply = {
            userId: req.user.id,
            username: req.user.displayName || req.user.username,
            text,
            isAdmin: true,
            createdAt: new Date()
        };

        comment.replies.push(reply);
        await comment.save();

        const newReply = comment.replies[comment.replies.length - 1];
        return res.json({
            ok: true,
            reply: {
                id: newReply._id,
                username: newReply.username,
                text: newReply.text,
                isAdmin: true,
                createdAt: newReply.createdAt
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

router.get("/users", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const rows = await User.find().sort({ createdAt: -1 }).limit(500).lean();
        const out = rows.map(u => ({
            id: u._id,
            username: u.username,
            displayName: u.displayName,
            role: u.role || 'user',
            isActive: u.isActive !== false,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt
        }));
        return res.json(out);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

router.post("/users", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const username = normalizeUsername(req.body?.username);
        const displayName = normalizeDisplayName(req.body?.displayName);
        const password = String(req.body?.password || "");
        const role = String(req.body?.role || "user").toLowerCase();

        if (!username) return res.status(400).json({ error: "Thiếu username" });
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            return res.status(400).json({ error: "username chỉ gồm a-zA-Z0-9_ và dài 3-30 ký tự" });
        }
        if (!displayName) return res.status(400).json({ error: "Thiếu displayName" });
        if (displayName.length > 50) return res.status(400).json({ error: "displayName quá dài" });
        if (!password || password.length < 8) {
            return res.status(400).json({ error: "password tối thiểu 8 ký tự" });
        }
        // Validate role
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: "role không hợp lệ" });
        }

        const { salt, hash } = hashPassword(password);
        const user = new User({
            username,
            displayName,
            passwordSalt: salt,
            passwordHash: hash,
            role: role,
            isActive: true
        });
        await user.save();

        return res.json({
            ok: true,
            user: {
                id: String(user._id),
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                isActive: true
            }
        });
    } catch (e) {
        // Duplicate username
        if (e && (e.code === 11000 || String(e.message || "").includes("duplicate"))) {
            return res.status(409).json({ error: "username đã tồn tại" });
        }
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

router.post("/users/:id/reset-password", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const newPassword = String(req.body?.password || "");
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "password tối thiểu 6 ký tự" });
        }

        const { salt, hash } = hashPassword(newPassword);
        const output = await User.findByIdAndUpdate(
            req.params.id,
            { passwordSalt: salt, passwordHash: hash, updatedAt: new Date() },
            { new: true }
        );
        if (!output) return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true, id: String(output._id) });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

router.post("/users/:id/toggle-active", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "Not found" });
        user.isActive = !(user.isActive !== false);
        await user.save();
        return res.json({ ok: true, id: String(user._id), isActive: user.isActive !== false });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Thay đổi role của user
router.patch("/users/:id/role", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const role = String(req.body?.role || "").trim().toLowerCase();
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: "Role không hợp lệ (user hoặc admin)" });
        }

        const output = await User.findByIdAndUpdate(
            req.params.id,
            { role, updatedAt: new Date() },
            { new: true }
        );
        if (!output) return res.status(404).json({ error: "Not found" });
        return res.json({
            ok: true,
            id: String(output._id),
            role: output.role
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Xóa user
router.delete("/users/:id", requireAdminUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        // Không cho xóa chính mình
        if (String(req.user.id) === String(req.params.id)) {
            return res.status(400).json({ error: "Không thể xóa chính mình" });
        }

        const output = await User.findByIdAndDelete(req.params.id);
        if (!output) return res.status(404).json({ error: "Not found" });
        return res.json({ ok: true, id: req.params.id });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

module.exports = router;
