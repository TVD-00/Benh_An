// Entry point - Backend Server
const http = require("http");
const express = require("express");
const cors = require("cors");

// Config
const { PORT } = require('./config/env');
const { corsOptions } = require('./config/cors');
const { connectDatabase } = require('./config/database');

// Routes
const commentsRoutes = require('./routes/comments');
const feedbackRoutes = require('./routes/feedback');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

// WebSocket
const { initWebSocket } = require('./websocket');

// ============================================================================
// EXPRESS CONFIGURATION & MIDDLEWARE
// ============================================================================
const app = express();

// CORS
app.use(cors(corsOptions));

// Body parser - tăng giới hạn để nhận dữ liệu bệnh án lớn (ảnh base64 hoặc văn bản dài)
app.use(express.json({ limit: "1mb" }));

// Middleware xử lý lỗi CORS tùy chỉnh để trả về JSON thay vì HTML lỗi mặc định
app.use((err, req, res, next) => {
  if (err && String(err.message || "").includes("Not allowed by CORS")) {
    return res.status(403).json({ error: "CORS blocked", origin: req.headers.origin || null });
  }
  return next(err);
});

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================
app.get("/", (req, res) => {
  res.send("WS + OpenRouter API + MongoDB server is running.");
});

app.get("/healthz", (req, res) => res.send("ok"));

// ============================================================================
// ROUTES
// ============================================================================
app.use("/comments", commentsRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/chat", chatRoutes);

// Route đặc biệt cho /chat-assist (giữ tương thích với frontend cũ)
app.post("/chat-assist", (req, res, next) => {
  req.url = '/assist';
  chatRoutes(req, res, next);
});

// Route đặc biệt cho /me (giữ tương thích với frontend cũ)
const { requireUser } = require('./middleware/auth');
app.get("/me", requireUser, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

// ============================================================================
// CONNECT DATABASE
// ============================================================================
connectDatabase();

// ============================================================================
// START SERVER
// ============================================================================
const server = http.createServer(app);

// Khởi tạo WebSocket
initWebSocket(server);

server.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
