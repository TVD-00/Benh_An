// Các helper functions
const crypto = require('crypto');
const { IP_HASH_SECRET } = require('../config/env');

// Lấy IP client từ request
function getClientIp(req) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.trim()) {
        return xff.split(",")[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || "unknown";
}

// Hash IP để chống spam (không lưu IP thô)
function getIpHash(req) {
    if (!IP_HASH_SECRET) return "";
    const ip = getClientIp(req);
    return crypto.createHmac("sha256", IP_HASH_SECRET).update(String(ip)).digest("hex");
}

// Format ngày giờ theo múi giờ Việt Nam
function formatDateLocal(date) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date).replace(',', '');
}

// Lấy HTTP status từ error object
function getErrStatus(err) {
    const s = err?.status ?? err?.statusCode ?? err?.response?.status;
    if (typeof s === "number") return s;
    const n = parseInt(String(s || ""), 10);
    return Number.isFinite(n) ? n : null;
}

// Kiểm tra lỗi rate limit 429
function isRateLimit429(err) {
    const status = getErrStatus(err);
    if (status === 429) return true;
    const code = err?.code;
    return code === 429 || code === "rate_limit_exceeded";
}

// Normalize username
function normalizeUsername(input) {
    return String(input || "").trim();
}

// Normalize displayName
function normalizeDisplayName(input) {
    return String(input || "").trim();
}

// Hash password với salt
function hashPassword(password) {
    const pwd = String(password || "");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(pwd, salt, 64).toString("hex");
    return { salt, hash };
}

// Xác thực password
function verifyPassword(password, salt, hashHex) {
    try {
        const pwd = String(password || "");
        const computed = crypto.scryptSync(pwd, String(salt || ""), 64);
        const expected = Buffer.from(String(hashHex || ""), "hex");
        if (expected.length !== computed.length) return false;
        return crypto.timingSafeEqual(computed, expected);
    } catch {
        return false;
    }
}

// Ước lượng số token (heuristic cho tiếng Việt/Anh)
function estimateTokens(text) {
    return Math.ceil((text || '').length / 3.5);
}

module.exports = {
    getClientIp,
    getIpHash,
    formatDateLocal,
    getErrStatus,
    isRateLimit429,
    normalizeUsername,
    normalizeDisplayName,
    hashPassword,
    verifyPassword,
    estimateTokens
};
