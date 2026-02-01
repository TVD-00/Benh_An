// Cấu hình đọc biến môi trường
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 10000,
    DATABASE_URL: process.env.DATABASE_URL || "",

    // Admin Auth
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
    ADMIN_TOKEN_SECRET: process.env.ADMIN_TOKEN_SECRET || "",
    ADMIN_TOKEN_TTL_MS: parseInt(process.env.ADMIN_TOKEN_TTL_MS || "", 10) || 12 * 60 * 60 * 1000,

    // User Auth
    USER_TOKEN_SECRET: process.env.USER_TOKEN_SECRET || "",
    USER_TOKEN_TTL_MS: parseInt(process.env.USER_TOKEN_TTL_MS || "", 10) || 7 * 24 * 60 * 60 * 1000,

    // Rate Limit - Chat
    CHAT_RATE_LIMIT_WINDOW_MS: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS || "", 10) || 60_000,
    CHAT_RATE_LIMIT_MAX: parseInt(process.env.CHAT_RATE_LIMIT_MAX || "", 10) || 20,

    // Rate Limit - Feedback
    FEEDBACK_RATE_LIMIT_WINDOW_MS: parseInt(process.env.FEEDBACK_RATE_LIMIT_WINDOW_MS || "", 10) || 60_000,
    FEEDBACK_RATE_LIMIT_MAX: parseInt(process.env.FEEDBACK_RATE_LIMIT_MAX || "", 10) || 20,

    // IP Hash
    IP_HASH_SECRET: process.env.IP_HASH_SECRET || "",

    // OpenRouter AI
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    CUSTOM_MODEL: process.env.CUSTOM_MODEL || "google/gemini-2.0-flash-001",
    FALLBACK_MODEL: String(process.env.FALLBACK_MODEL || "").trim(),

    // Chat Config
    CHAT_MAX_CONTEXT: parseInt(process.env.CHAT_MAX_CONTEXT) || 8000,
    CHAT_MAX_OUTPUT: parseInt(process.env.CHAT_MAX_OUTPUT) || 4000,
    CHAT_AUTO_SUMMARIZE: process.env.CHAT_AUTO_SUMMARIZE === 'true',
    MODEL_CONTEXT_LIMIT: 131000,

    // CORS
    CORS_ORIGINS: process.env.CORS_ORIGINS || ""
};
