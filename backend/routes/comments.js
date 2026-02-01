// Routes: Comments API
const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const { requireAdmin } = require('../middleware/auth');
const { formatDateLocal, getIpHash } = require('../utils/helpers');

const router = express.Router();

// Lấy danh sách comment (mới nhất trước, giới hạn 200)
router.get("/", async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const comments = await Comment.find().sort({ createdAt: -1 }).limit(200);
        const rows = comments.map(c => ({
            id: c._id,
            username: c.username,
            type: c.type || "gopy",
            status: c.status || "new",
            text: c.text,
            heart: c.heart,
            date: formatDateLocal(c.createdAt)
        }));
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "DB error" });
    }
});

// Tạo comment mới
router.post("/", async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const username = String(req.body?.username || "").trim();
        const text = String(req.body?.text || "").trim();
        const typeRaw = String(req.body?.type || "gopy").trim().toLowerCase();
        const allowedTypes = new Set(["gopy", "bug", "feature", "question", "other"]);
        const type = allowedTypes.has(typeRaw) ? typeRaw : "other";

        if (!username) return res.status(400).json({ error: "Vui lòng nhập nickname" });
        if (!text) return res.status(400).json({ error: "Vui lòng nhập nội dung góp ý" });

        const newComment = new Comment({
            userId: null,
            username,
            type,
            text,
            status: "new",
            ipHash: getIpHash(req),
            meta: {
                source: "comments",
                userAgent: String(req.headers["user-agent"] || "")
            }
        });
        await newComment.save();

        res.json({
            ok: true,
            item: {
                id: newComment._id,
                username: newComment.username,
                type: newComment.type,
                status: newComment.status,
                text: newComment.text,
                heart: newComment.heart,
                date: formatDateLocal(newComment.createdAt)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "DB error" });
    }
});

// Toggle heart status (Admin only)
router.post("/:id/toggle-heart", requireAdmin, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: "Not found" });

        comment.heart = !comment.heart;
        await comment.save();

        res.json({ ok: true, item: comment });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "DB error" });
    }
});

// Xóa comment (Admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
    try {
        const output = await Comment.findByIdAndDelete(req.params.id);
        if (!output) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, id: req.params.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "DB error" });
    }
});

module.exports = router;
