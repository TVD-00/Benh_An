# Hướng dẫn Deploy

## 1. Frontend - GitHub Pages

### Bước 1: Cấu hình
Sửa file `frontend/vite.config.js` và `frontend/package.json`:
- Thay `Benh_An` bằng tên repository của bạn
- Thay `yourusername` bằng GitHub username của bạn

### Bước 2: Cài đặt gh-pages
```bash
cd frontend
npm install gh-pages --save-dev
```

### Bước 3: Build và Deploy
```bash
npm run deploy
```

### Bước 4: Cấu hình GitHub
1. Vào Settings > Pages của repository
2. Source: chọn `gh-pages` branch
3. Chờ vài phút để GitHub build xong

### Lưu ý với React Router
GitHub Pages là static hosting, cần xử lý routing:
- Đã thêm file `404.html` để redirect về `index.html`

---

## 2. Backend - Render (Khuyến nghị)

### Bước 1: Tạo tài khoản Render
Đăng ký tại https://render.com (miễn phí)

### Bước 2: Tạo Web Service
1. Kết nối GitHub repository
2. Chọn thư mục `backend`
3. Build Command: `npm install`
4. Start Command: `npm start`

### Bước 3: Cấu hình Environment Variables
Thêm các biến từ file `.env`:
- DATABASE_URL
- ADMIN_PASSWORD
- ADMIN_TOKEN_SECRET
- USER_TOKEN_SECRET
- OPENROUTER_API_KEY
- (các biến khác...)

### Bước 4: Cập nhật Frontend
Sau khi backend deploy xong, cập nhật URL trong frontend:
- File: `frontend/.env.production`
```
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com
```

---

## 3. Cấu trúc Repository

```
Benh_An/
├── frontend/          # React app - deploy lên GitHub Pages
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Node.js API - deploy lên Render
│   ├── index.js
│   ├── package.json
│   └── .env           # Không commit file này!
└── README.md
```

---

## 4. Quan trọng

### Không commit file .env
Thêm vào `.gitignore`:
```
.env
.env.local
.env.*.local
```

### CORS
Sau khi deploy, cập nhật `CORS_ORIGINS` trong backend để cho phép domain GitHub Pages:
```
CORS_ORIGINS=https://yourusername.github.io
```
