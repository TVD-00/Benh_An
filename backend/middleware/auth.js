// Middleware Authentication (Admin & User)
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const {
    ADMIN_TOKEN_SECRET,
    ADMIN_TOKEN_TTL_MS,
    USER_TOKEN_SECRET,
    USER_TOKEN_TTL_MS
} = require('../config/env');

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

// Tạo token session (HMAC) cho admin
function makeAdminToken() {
    const issuedAt = Date.now();
    const nonce = crypto.randomBytes(24).toString("hex");
    const raw = `${issuedAt}_${nonce}`;
    const sig = crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(raw).digest("hex");
    return `${raw}.${sig}`;
}

// Xác thực token admin
function verifyAdminToken(token) {
    if (!token || !ADMIN_TOKEN_SECRET) return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [raw, sig] = parts;
    const expected = crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(raw).digest("hex");

    // Kiểm tra hết hạn nếu raw có prefix timestamp
    const m = String(raw).match(/^(\d{10,})_/);
    if (m) {
        const issuedAt = parseInt(m[1], 10);
        if (Number.isFinite(issuedAt)) {
            const age = Date.now() - issuedAt;
            if (age > ADMIN_TOKEN_TTL_MS) return false;
        }
    }

    try {
        // So sánh an toàn (timing-safe) để tránh tấn công timing attack
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
        return false;
    }
}

// Middleware bảo vệ các route admin
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : "";
    if (!verifyAdminToken(token)) return res.status(401).json({ error: "Unauthorized" });
    next();
}

// ============================================================================
// USER AUTHENTICATION
// ============================================================================

// Tạo token cho user
function makeUserToken(userId) {
    if (!USER_TOKEN_SECRET) return "";
    const issuedAt = Date.now();
    const raw = `${String(userId)}.${issuedAt}`;
    const sig = crypto.createHmac("sha256", USER_TOKEN_SECRET).update(raw).digest("hex");
    return `${raw}.${sig}`;
}

// Xác thực token user
function verifyUserToken(token) {
    if (!token || !USER_TOKEN_SECRET) return null;
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    const [userId, issuedAtStr, sig] = parts;
    if (!userId || !issuedAtStr || !sig) return null;

    const issuedAt = parseInt(issuedAtStr, 10);
    if (!Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > USER_TOKEN_TTL_MS) return null;

    const raw = `${userId}.${issuedAtStr}`;
    const expected = crypto.createHmac("sha256", USER_TOKEN_SECRET).update(raw).digest("hex");
    try {
        const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
        return ok ? { userId, issuedAt } : null;
    } catch {
        return null;
    }
}

// Middleware bảo vệ các route user
async function requireUser(req, res, next) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : "";

    const decoded = verifyUserToken(token);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });

    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const user = await User.findById(decoded.userId).lean();
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (user.isActive === false) return res.status(403).json({ error: "User is disabled" });
        req.user = {
            id: String(user._id),
            username: user.username,
            displayName: user.displayName,
            role: user.role || 'user' // Thêm role
        };
        return next();
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
}

// Lấy user từ request (không bắt buộc)
async function getOptionalUserFromRequest(req) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : "";
    const decoded = verifyUserToken(token);
    if (!decoded) return null;
    if (mongoose.connection.readyState !== 1) return null;
    try {
        const user = await User.findById(decoded.userId).lean();
        if (!user || user.isActive === false) return null;
        return user;
    } catch {
        return null;
    }
}

// Middleware bao ve cac route admin - kiem tra user co role admin
// Su dung token cua user thay vi admin password rieng
async function requireAdminUser(req, res, next) {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : "";

    const decoded = verifyUserToken(token);
    if (!decoded) return res.status(401).json({ error: "Unauthorized" });

    if (mongoose.connection.readyState !== 1) return res.status(500).json({ error: "DB not connected" });
    try {
        const user = await User.findById(decoded.userId).lean();
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (user.isActive === false) return res.status(403).json({ error: "User is disabled" });
        if (user.role !== 'admin') return res.status(403).json({ error: "Admin required" });

        req.user = {
            id: String(user._id),
            username: user.username,
            displayName: user.displayName,
            role: user.role
        };
        return next();
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: "DB error" });
    }
}

module.exports = {
    makeAdminToken,
    verifyAdminToken,
    requireAdmin,
    makeUserToken,
    verifyUserToken,
    requireUser,
    requireAdminUser,
    getOptionalUserFromRequest
};
