// WebSocket Server (Real-time Collaboration)
const WebSocket = require('ws');

// In-memory store cho các phòng chat/edit
// Structure: roomId -> { clients: Set, lastState: Object, locks: Map }
const rooms = new Map();

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, { clients: new Set(), lastState: null, locks: new Map() });
    }
    return rooms.get(roomId);
}

// Gửi tin nhắn an toàn (chỉ gửi khi kết nối còn mở)
function safeSend(ws, obj) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
    }
}

// Gửi tin nhắn cho tất cả client trong phòng (trừ người gửi nếu cần)
function broadcast(roomId, obj, exceptWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;
    for (const client of room.clients) {
        if (client !== exceptWs && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(obj));
        }
    }
}

// Thông báo số lượng người đang online trong phòng
function notifyPresence(roomId) {
    const room = rooms.get(roomId);
    const count = room ? room.clients.size : 0;
    broadcast(roomId, { type: "presence", room: roomId, count });
}

// Khởi tạo WebSocket server
function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        ws._roomId = null;
        ws._clientId = null;

        ws.on("message", (buf) => {
            let msg;
            try {
                msg = JSON.parse(buf.toString());
            } catch {
                return; // Bỏ qua tin nhắn rác/lỗi
            }

            const { type, room: roomId, clientId } = msg || {};
            const by = msg.by || clientId || ws._clientId || null;

            // Gán ID cho session nếu chưa có
            if (clientId && !ws._clientId) ws._clientId = clientId;
            if (msg.by && !ws._clientId) ws._clientId = msg.by;

            if (!type || !roomId) return;

            // --- JOIN ROOM ---
            if (type === "join") {
                const room = getRoom(roomId);
                room.clients.add(ws);
                ws._roomId = roomId;
                if (by && !ws._clientId) ws._clientId = by;

                // Gửi trạng thái hiện tại (state) của phòng cho người mới vào
                if (room.lastState) {
                    safeSend(ws, {
                        type: "state",
                        room: roomId,
                        clientId: "server",
                        payload: room.lastState
                    });
                }

                // Gửi danh sách các field đang bị khóa (đang có người khác edit)
                safeSend(ws, { type: "locks", room: roomId, payload: Object.fromEntries(room.locks) });
                safeSend(ws, { type: "joined", room: roomId });
                notifyPresence(roomId);
                return;
            }

            // Đảm bảo client luôn ở trong room đúng
            if (ws._roomId !== roomId) {
                const room = getRoom(roomId);
                room.clients.add(ws);
                ws._roomId = roomId;
                if (by && !ws._clientId) ws._clientId = by;
            }

            // --- LOCK FIELD (Khi người dùng focus vào 1 input) ---
            if (type === "lock") {
                const room = getRoom(roomId);
                const fieldId = String(msg.fieldId || "").trim();
                const locker = by;

                if (!fieldId || !locker) return;

                // Kiểm tra xem đã có ai khóa chưa
                const cur = room.locks.get(fieldId);
                if (cur && cur.by && cur.by !== locker) {
                    // Nếu đã bị người khác khóa -> Từ chối
                    safeSend(ws, { type: "lock-denied", room: roomId, fieldId, by: cur.by, at: cur.at || Date.now() });
                    return;
                }

                // Khóa thành công -> Thông báo cho tất cả để hiện thị "Ai đó đang nhập..."
                room.locks.set(fieldId, { by: locker, at: msg.at || Date.now() });
                broadcast(roomId, { type: "lock", room: roomId, fieldId, by: locker, at: msg.at || Date.now() }, ws);
                return;
            }

            // --- UNLOCK FIELD (Khi người dùng blur/rời khỏi input) ---
            if (type === "unlock") {
                const room = getRoom(roomId);
                const fieldId = String(msg.fieldId || "").trim();
                const locker = by;

                if (!fieldId || !locker) return;

                const cur = room.locks.get(fieldId);
                // Chỉ người khóa mới được mở khóa
                if (cur && cur.by === locker) {
                    room.locks.delete(fieldId);
                    broadcast(roomId, { type: "unlock", room: roomId, fieldId, by: locker, at: msg.at || Date.now() }, ws);
                }
                return;
            }

            // --- SYNC STATE (Đồng bộ dữ liệu form) ---
            if (type === "state") {
                const room = getRoom(roomId);
                if (msg.payload && typeof msg.payload === "object") {
                    room.lastState = msg.payload; // Cập nhật state mới nhất của phòng
                }
                // Gửi update cho tất cả client KHÁC (trừ người gửi)
                broadcast(
                    roomId,
                    { type: "state", room: roomId, clientId, payload: msg.payload },
                    ws
                );
                return;
            }

            // --- CLEAR DATA ---
            if (type === "clear") {
                const room = getRoom(roomId);
                room.lastState = null;
                room.locks.clear();
                broadcast(roomId, { type: "locks", room: roomId, payload: {} }, null);
                broadcast(roomId, { type: "clear", room: roomId, clientId }, ws);
            }
        });

        // --- DISCONNECT ---
        ws.on("close", () => {
            const roomId = ws._roomId;
            if (!roomId) return;
            const room = rooms.get(roomId);
            if (!room) return;

            // Tự động mở khóa các field mà user này đang giữ
            const cid = ws._clientId;
            if (cid) {
                const toUnlock = [];
                for (const [fieldId, meta] of room.locks.entries()) {
                    if (meta && meta.by === cid) toUnlock.push(fieldId);
                }
                if (toUnlock.length) {
                    for (const fieldId of toUnlock) room.locks.delete(fieldId);
                    for (const fieldId of toUnlock) {
                        broadcast(roomId, { type: "unlock", room: roomId, fieldId, by: cid, at: Date.now() }, null);
                    }
                    broadcast(roomId, { type: "locks", room: roomId, payload: Object.fromEntries(room.locks) }, null);
                }
            }

            room.clients.delete(ws);
            if (room.clients.size === 0) {
                rooms.delete(roomId); // Xóa phòng nếu không còn ai
            } else {
                notifyPresence(roomId);
            }
        });
    });

    return wss;
}

module.exports = { initWebSocket };
