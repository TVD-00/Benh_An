// Routes: Feedback API (Góp ý) với chức năng Reply
const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const { rateLimitFeedback } = require('../middleware/rateLimit');
const { getOptionalUserFromRequest, requireUser } = require('../middleware/auth');
const { formatDateLocal, getIpHash } = require('../utils/helpers');

const router = express.Router();

// Lấy danh sách góp ý (mới nhất trước, giới hạn 200)
router.get("/", async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const rows = await Comment.find().sort({ createdAt: -1 }).limit(200).lean();
        const out = rows.map(c => ({
            id: c._id,
            username: c.username,
            type: c.type || "gopy",
            status: c.status || "new",
            text: c.text,
            heart: !!c.heart,
            date: formatDateLocal(c.createdAt),
            replies: (c.replies || []).map(r => ({
                id: r._id,
                username: r.username,
                text: r.text,
                isAdmin: !!r.isAdmin,
                date: formatDateLocal(r.createdAt)
            }))
        }));
        return res.json(out);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Tạo góp ý mới (user đăng nhập HOẶC guest nickname)
router.post("/", rateLimitFeedback, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const typeRaw = String(req.body?.type || "gopy").trim().toLowerCase();
        const allowedTypes = new Set(["gopy", "bug", "feature", "question", "other"]);
        const type = allowedTypes.has(typeRaw) ? typeRaw : "other";

        const text = String(req.body?.text ?? req.body?.message ?? "").trim();
        const guestName = String(req.body?.username || "").trim();

        const user = await getOptionalUserFromRequest(req);
        const username = user ? String(user.displayName || user.username || "").trim() : guestName;
        const userId = user ? user._id : null;

        if (!username) return res.status(400).json({ error: "Vui lòng nhập nickname hoặc đăng nhập" });
        if (!text) return res.status(400).json({ error: "Vui lòng nhập nội dung góp ý" });
        if (text.length > 2000) return res.status(400).json({ error: "Nội dung quá dài (tối đa 2000 ký tự)" });

        const meta = (req.body?.meta && typeof req.body.meta === "object" && !Array.isArray(req.body.meta))
            ? req.body.meta
            : {};

        const item = new Comment({
            userId,
            username,
            type,
            text,
            status: "new",
            ipHash: getIpHash(req),
            meta: {
                ...meta,
                source: "feedback",
                userAgent: String(req.headers["user-agent"] || "")
            }
        });
        await item.save();

        return res.json({
            ok: true,
            item: {
                id: item._id,
                username: item.username,
                type: item.type,
                status: item.status,
                text: item.text,
                heart: item.heart,
                date: formatDateLocal(item.createdAt),
                replies: []
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

// Thêm reply vào góp ý (yêu cầu đăng nhập)
router.post("/:id/reply", requireUser, async (req, res) => {
    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });

    try {
        const text = String(req.body?.text || "").trim();
        if (!text) return res.status(400).json({ error: "Vui lòng nhập nội dung phản hồi" });
        if (text.length > 1000) return res.status(400).json({ error: "Nội dung quá dài (tối đa 1000 ký tự)" });

        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: "Không tìm thấy góp ý" });

        const isAdmin = req.user.role === 'admin';
        const reply = {
            userId: req.user.id,
            username: req.user.displayName || req.user.username,
            text,
            isAdmin,
            createdAt: new Date()
        };

        comment.replies.push(reply);
        await comment.save();

        // Lấy reply vừa thêm (có _id)
        const newReply = comment.replies[comment.replies.length - 1];

        return res.json({
            ok: true,
            reply: {
                id: newReply._id,
                username: newReply.username,
                text: newReply.text,
                isAdmin: newReply.isAdmin,
                date: formatDateLocal(newReply.createdAt)
            }
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
});

module.exports = router;
