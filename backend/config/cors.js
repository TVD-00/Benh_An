// Cấu hình CORS
const { CORS_ORIGINS } = require('./env');

const defaultCorsOrigins = ["https://tvd-00.github.io"];
const corsOrigins = Array.from(
    new Set(
        defaultCorsOrigins.concat(
            CORS_ORIGINS
                .split(",")
                .map(s => s.trim())
                .filter(Boolean)
        )
    )
);

const corsOptions = {
    origin: function (origin, cb) {
        // Cho phép request server-to-server (không có origin) hoặc request từ whitelist
        if (!origin) return cb(null, true);
        if (corsOrigins.length === 0) return cb(null, true);
        return corsOrigins.includes(origin)
            ? cb(null, true)
            : cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

module.exports = { corsOptions, corsOrigins };
