# MediNote - Hồ Sơ Bệnh Án Điện Tử

Ứng dụng hỗ trợ viết bệnh án điện tử cho sinh viên y khoa. Tích hợp AI gợi ý nội dung, xuất file DOCX chuyên nghiệp.

## Tính năng

- Hỗ trợ nhiều chuyên khoa: Nội Khoa, Sản Khoa, Phụ Khoa, Nhi Khoa, Tiền Phẫu, Hậu Phẫu, GMHS, Răng Hàm Mặt, YHCT
- AI hỗ trợ phân tích và gợi ý nội dung bệnh án
- Xuất file Word (DOCX) theo mẫu chuẩn
- Giao diện thân thiện, hỗ trợ Dark Mode
- Responsive - sử dụng trên nhiều thiết bị

## Công nghệ sử dụng

### Frontend
- React 19
- React Router DOM
- Vite
- Lucide React (icons)
- docx (xuất file Word)

### Backend
- Node.js + Express
- MongoDB (Atlas)
- WebSocket (đồng bộ thời gian thực)
- OpenRouter API (AI)

### Deployment
- Frontend: GitHub Pages
- Backend: Pterodactyl Node.js
- API Proxy: Cloudflare Worker (HTTPS)

## Cấu trúc thư mục

```
Benh_An/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Các component dùng chung
│   │   ├── pages/      # Các trang bệnh án theo chuyên khoa
│   │   ├── hooks/      # Custom React hooks
│   │   └── utils/      # Tiện ích (xuất Word, validation...)
│   ├── public/         # Static files
│   └── .env.production # Cấu hình production
├── backend/            # Node.js backend
│   ├── config/         # Cấu hình (database, CORS, env)
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   └── websocket/      # WebSocket handlers
└── cloudflare-worker-proxy.js  # Cloudflare Worker proxy
```

## Cài đặt và chạy

### Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

Truy cập: http://localhost:5173

### Backend (Development)

```bash
cd backend
npm install
node index.js
```

Server chạy tại: http://localhost:3000

### Build Production

```bash
cd frontend
npm run build
```

## Deploy

Xem file DEPLOY.md để biết chi tiết cách deploy lên GitHub Pages và cấu hình Cloudflare Worker.

## Biến môi trường

### Frontend (.env.production)

```
VITE_API_URL=https://your-worker.workers.dev
```

### Backend (.env)

```
PORT=3000
MONGODB_URI=mongodb+srv://...
OPENROUTER_API_KEY=sk-...
CORS_ORIGINS=https://your-frontend.github.io
JWT_SECRET=your-secret
```

## Tác giả

TVD-00

## License

MIT
