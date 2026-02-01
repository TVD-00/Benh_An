// Middleware Rate Limiting
const {
    CHAT_RATE_LIMIT_WINDOW_MS,
    CHAT_RATE_LIMIT_MAX,
    FEEDBACK_RATE_LIMIT_WINDOW_MS,
    FEEDBACK_RATE_LIMIT_MAX
} = require('../config/env');
const { getClientIp } = require('../utils/helpers');

const chatRequestLog = new Map();
const feedbackRequestLog = new Map();

// Rate limit cho Chat API
function rateLimitChat(req, res, next) {
    const key = getClientIp(req);
    const now = Date.now();
    const prev = chatRequestLog.get(key) || [];
    const keep = prev.filter(t => typeof t === "number" && (now - t) < CHAT_RATE_LIMIT_WINDOW_MS);

    if (keep.length >= CHAT_RATE_LIMIT_MAX) {
        const oldest = Math.min(...keep);
        const retryAfterMs = Math.max(0, CHAT_RATE_LIMIT_WINDOW_MS - (now - oldest));
        const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
        res.setHeader("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
            error: "Too many requests",
            retryAfterSeconds
        });
    }

    keep.push(now);
    chatRequestLog.set(key, keep);
    return next();
}

// Rate limit cho Feedback API
function rateLimitFeedback(req, res, next) {
    const key = getClientIp(req);
    const now = Date.now();
    const prev = feedbackRequestLog.get(key) || [];
    const keep = prev.filter(t => typeof t === "number" && (now - t) < FEEDBACK_RATE_LIMIT_WINDOW_MS);

    if (keep.length >= FEEDBACK_RATE_LIMIT_MAX) {
        const oldest = Math.min(...keep);
        const retryAfterMs = Math.max(0, FEEDBACK_RATE_LIMIT_WINDOW_MS - (now - oldest));
        const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
        res.setHeader("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
            error: "Too many requests",
            retryAfterSeconds
        });
    }

    keep.push(now);
    feedbackRequestLog.set(key, keep);
    return next();
}

module.exports = { rateLimitChat, rateLimitFeedback };
