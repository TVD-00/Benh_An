// ============================================================================
// HOOK: useWebSocket
// ============================================================================
// EN: Manage real-time WebSocket connection for collaboration.
// VI: Quản lý kết nối WebSocket thời gian thực cho tính năng cộng tác.
//
// EN: Main Features:
// 1. Connection Management: Auto-reconnect when connection lost.
// 2. State Sync: Synchronize form data between clients in the same room.
// 3. Locking: Handle field locking logic (prevents concurrent edits on same field).
// 4. Presence: Count online users in the room.
//
// VI: Chức năng chính:
// 1. Quản lý Connection: Tự động kết nối lại (auto-reconnect) khi rớt mạng.
// 2. Sync State: Đồng bộ dữ liệu form giữa các client trong cùng phòng.
// 3. Locking: Xử lý logic khóa field (khi A đang nhập field X, B không được sửa).
// 4. Presence: Đếm số lượng người đang online trong phòng.

import { useState, useEffect, useRef, useCallback } from 'react';

// EN: WebSocket URL from env (Defaults to localhost for dev)
// VI: URL WebSocket từ biến môi trường (Mặc định localhost cho dev)
const WS_URL = import.meta.env.VITE_WS_URL || '';
// EN: Check if WebSocket is configured (disabled in production if no WS_URL)
// VI: Kiểm tra WebSocket có được cấu hình không (tắt trong production nếu không có WS_URL)
const WS_ENABLED = !!import.meta.env.VITE_WS_URL || import.meta.env.DEV;
const RECONNECT_DELAY = 3000;    // EN: Wait time before reconnecting (3s) / VI: Thời gian chờ trước khi thử kết nối lại (3s)
const MAX_RECONNECT_ATTEMPTS = 5; // EN: Max retry attempts / VI: Số lần thử lại tối đa trước khi bỏ cuộc
const STATE_SEND_THROTTLE_MS = 200; // VI: Giảm spam khi nhập textarea dài

export const useWebSocket = (roomId) => {
    // --- STATE ---
    const [isConnected, setIsConnected] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0); // EN: Users in room / VI: Số người đang trong phòng
    const [locks, setLocks] = useState({});            // EN: Locked fields { fieldId: { by: 'userId', at: timestamp } } / VI: Danh sách các field đang bị khóa
    const [clientId, setClientId] = useState(null);    // EN: Current session ID / VI: ID định danh của phiên làm việc hiện tại
    const [remoteData, setRemoteData] = useState(null); // EN: Data received from peers / VI: Dữ liệu nhận được từ người khác
    const [error, setError] = useState(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // --- REFS (Keep latest values in Event Listener closure) ---
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const clientIdRef = useRef(null);
    const handleMessageRef = useRef(null); // EN: Ref for message handler / VI: Ref function xử lý message
    const dismountedRef = useRef(false); // Kiểm tra component đã unmount chưa

    // Throttle gửi state để giảm lag UI + giảm tải mạng
    const pendingStateRef = useRef(null);
    const stateSendTimeoutRef = useRef(null);
    const lastStateSentAtRef = useRef(0);

    // EN: Handle messages from Server
    // VI: Hàm xử lý tin nhắn từ Server
    const handleMessage = useCallback((msg) => {
        // Không update state nếu đã unmount
        if (dismountedRef.current) return;

        switch (msg.type) {
            case 'presence':
                // EN: Update online count / VI: Cập nhật số người online
                setOnlineCount(msg.count);
                break;
            case 'locks':
                // EN: Sync full lock list (on join) / VI: Đồng bộ toàn bộ danh sách khóa (khi mới vào phòng)
                setLocks(msg.payload || {});
                break;
            case 'lock':
                // EN: Someone locked a field / VI: Có ai đó vừa khóa 1 field
                setLocks(prev => ({ ...prev, [msg.fieldId]: { by: msg.by, at: msg.at } }));
                break;
            case 'unlock':
                // EN: Someone unlocked a field / VI: Ai đó mở khóa field
                setLocks(prev => {
                    const next = { ...prev };
                    delete next[msg.fieldId];
                    return next;
                });
                break;
            case 'state':
                // EN: Receive latest form data from peer / VI: Nhận dữ liệu form mới nhất từ người khác
                if (msg.payload) {
                    setRemoteData(msg.payload);
                }
                break;
            case 'error':
                console.error('WS Server Error:', msg.message);
                setError(msg.message);
                break;
            default:
                break;
        }
    }, []);

    // EN: Update handleMessage ref when logic changes
    // VI: Cập nhật ref handleMessage mỗi khi logic thay đổi (để dùng trong onmessage)
    useEffect(() => {
        handleMessageRef.current = handleMessage;
    }, [handleMessage]);

    // EN: Connect WebSocket
    // VI: Hàm kết nối WebSocket
    const connect = useCallback(() => {
        // VI: Không kết nối nếu WebSocket disabled hoặc không có roomId
        if (!WS_ENABLED || !roomId || dismountedRef.current || !WS_URL) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (dismountedRef.current) {
                    ws.close();
                    return;
                }
                console.log('WS Connected');
                setIsConnected(true);
                setError(null);
                setReconnectAttempts(0); // EN: Reset retry count on success / VI: Reset số lần retry khi kết nối thành công

                // EN: Generate random Client ID if not exists
                // VI: Sinh Client ID ngẫu nhiên nếu chưa có (để định danh người khóa)
                if (!clientIdRef.current) {
                    const myId = 'user_' + Math.random().toString(36).substr(2, 9);
                    clientIdRef.current = myId;
                    setClientId(myId);
                }

                // EN: Send Join command
                // VI: Gửi lệnh tham gia phòng
                ws.send(JSON.stringify({
                    type: 'join',
                    room: roomId,
                    by: clientIdRef.current
                }));
            };

            ws.onmessage = (event) => {
                if (dismountedRef.current) return;
                try {
                    const msg = JSON.parse(event.data);
                    // EN: Call handler via Ref to get latest state
                    // VI: Gọi hàm xử lý qua Ref để luôn lấy được state mới nhất
                    if (handleMessageRef.current) {
                        handleMessageRef.current(msg);
                    }
                } catch (err) {
                    console.error('WS Parse Error', err);
                    if (!dismountedRef.current) {
                        setError('Lỗi parse message từ server');
                    }
                }
            };

            ws.onerror = (err) => {
                console.error('WS Error', err);
                if (!dismountedRef.current) {
                    setError('Lỗi kết nối WebSocket');
                }
            };

            ws.onclose = () => {
                console.log('WS Disconnected');
                if (!dismountedRef.current) {
                    setIsConnected(false);
                    // Xóa error khi disconnect bình thường để không hiện thông báo lỗi
                }
                // EN: Reconnect logic triggered by useEffect below
                // VI: Logic reconnect sẽ được trigger bởi useEffect bên dưới
            };
        } catch (err) {
            console.error('WS Connection Error', err);
            if (!dismountedRef.current) {
                setError('Không thể tạo kết nối WebSocket');
            }
        }
    }, [roomId]);

    // --- RECONNECT LOGIC ---
    useEffect(() => {
        // EN: If disconnected and retries left -> Retry after 3s
        // VI: Nếu mất kết nối và chưa vượt quá số lần thử tối đa -> Thử lại sau 3s
        if (!isConnected && roomId && reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !dismountedRef.current) {
            const timeout = setTimeout(() => {
                if (dismountedRef.current) return;
                setReconnectAttempts(prev => prev + 1);
                connect();
            }, RECONNECT_DELAY);

            return () => clearTimeout(timeout);
        }
    }, [isConnected, roomId, reconnectAttempts, connect]);

    // --- INITIAL CONNECT ---
    useEffect(() => {
        dismountedRef.current = false;
        connect();

        // Cleanup
        return () => {
            dismountedRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (stateSendTimeoutRef.current) {
                clearTimeout(stateSendTimeoutRef.current);
                stateSendTimeoutRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connect]);

    // --- PUBLIC ACTIONS ---

    // EN: Send form data to server to broadcast
    // VI: Gửi dữ liệu form lên server để broadcast cho người khác
    const sendState = useCallback((data) => {
        pendingStateRef.current = data;
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const now = Date.now();
        const elapsed = now - lastStateSentAtRef.current;

        const doSend = () => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) return;
            try {
                wsRef.current.send(JSON.stringify({
                    type: 'state',
                    room: roomId,
                    payload: pendingStateRef.current
                }));
                lastStateSentAtRef.current = Date.now();
            } catch (err) {
                console.error('Error sending state:', err);
                setError('Lỗi gửi dữ liệu');
            }
        };

        // Nếu chưa có timer và đã đủ thời gian -> gửi ngay
        if (!stateSendTimeoutRef.current && elapsed >= STATE_SEND_THROTTLE_MS) {
            doSend();
            return;
        }

        // Nếu đang có timer -> để timer gửi payload mới nhất
        if (stateSendTimeoutRef.current) return;

        // Nếu gọi quá nhanh -> schedule gửi sau
        const waitMs = Math.max(0, STATE_SEND_THROTTLE_MS - elapsed);
        stateSendTimeoutRef.current = setTimeout(() => {
            stateSendTimeoutRef.current = null;
            doSend();
        }, waitMs);
    }, [roomId]);

    // EN: Lock a field (on focus)
    // VI: Gửi yêu cầu khóa field (khi focus)
    const lockField = useCallback((fieldId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify({
                    type: 'lock',
                    room: roomId,
                    fieldId,
                    by: clientIdRef.current
                }));
            } catch (err) {
                console.error('Error locking field:', err);
            }
        }
    }, [roomId]);

    // EN: Unlock a field (on blur)
    // VI: Gửi yêu cầu mở khóa field (khi blur)
    const unlockField = useCallback((fieldId) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify({
                    type: 'unlock',
                    room: roomId,
                    fieldId,
                    by: clientIdRef.current
                }));
            } catch (err) {
                console.error('Error unlocking field:', err);
            }
        }
    }, [roomId]);

    return {
        isEnabled: WS_ENABLED,  // VI: Cho UI biết WebSocket có enabled không
        isConnected: WS_ENABLED ? isConnected : false,
        onlineCount,
        locks,
        clientId,
        remoteData,
        error: WS_ENABLED ? error : null,  // VI: Không hiện lỗi nếu WS disabled
        reconnectAttempts,
        sendState,
        lockField,
        unlockField
    };
};
