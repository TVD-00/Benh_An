// ============================================================================
// COMPONENT: ChatPanel
// ============================================================================
// EN: AI Assistant Interaction Interface
// VI: Giao diện tương tác với AI Assistant.
//
// EN: Main Features:
// 1. Chat UI: Display conversation history, render Markdown.
// 2. State Management: Persist chat history to LocalStorage.
// 3. AI Integration: Send requests to API /chat-assist.
// 4. Form Updates: Parse JSON from AI response to auto-fill form (with review UI).
// 5. Undo/Redo: Allow undoing AI-proposed changes.
//
// VI: Chức năng chính:
// 1. Chat UI: Hiển thị lịch sử hội thoại, render Markdown.
// 2. State Management: Lưu lịch sử chat vào LocalStorage (persistance).
// 3. AI Integration: Gửi request đến API /chat-assist.
// 4. Form Updates: Parse JSON từ phản hồi của AI để tự động điền form (kèm UI review thay đổi).
// 5. Undo/Redo: Cho phép hoàn tác các thay đổi do AI thực hiện.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const API_URL = `${API_BASE_URL}/chat-assist`;
// EN: 90s timeout - tăng lên để đợi AI model xử lý xong (đặc biệt với yêu cầu phức tạp)
// VI: Timeout 90 giây vì AI có thể mất nhiều thời gian để xử lý bệnh án phức tạp
const API_TIMEOUT = 90000;
// EN: Auto-retry when timeout (max attempts)
// VI: Số lần tự động thử lại khi timeout hoặc lỗi mạng
const MAX_RETRIES = 2;
const MAX_UNDO_STACK = 15; // EN: Max undo steps / VI: Giới hạn số bước hoàn tác

// Rate limit cục bộ để tránh spam request (giảm nguy cơ 429)
const LOCAL_RATE_LIMIT_WINDOW_MS = 60_000;
const LOCAL_RATE_LIMIT_MAX_REQUESTS = 12;

// EN: Helper: Safe LocalStorage (handle Private Browsing or Quota Exceeded)
// VI: Helper: LocalStorage an toàn (xử lý trường hợp Private Browsing hoặc Quota Exceeded)
const safeLocalStorage = {
    getItem: (key) => {
        try { return localStorage.getItem(key); }
        catch { return null; }
    },
    setItem: (key, value) => {
        try { localStorage.setItem(key, value); }
        catch { /* EN: Ignore error / VI: Bỏ qua lỗi nếu không lưu được */ }
    }
};

// EN: Helper: Filter updates from AI, only accept valid form fields
// VI: Helper: Lọc updates từ AI, chỉ chấp nhận các field có thực trong form
const validateUpdates = (updates, validFields) => {
    if (!updates || typeof updates !== 'object') return null;
    const validated = {};
    for (const [key, value] of Object.entries(updates)) {
        if (validFields.has(key) && value !== undefined) {
            validated[key] = value;
        }
    }
    return Object.keys(validated).length > 0 ? validated : null;
};

// EN: Mapping field names (code) to display labels (Vietnamese)
// VI: Mapping tên field (code) sang nhãn hiển thị (tiếng Việt)
const FIELD_LABELS = {
    hoTen: 'Họ tên', gioiTinh: 'Giới tính', namSinh: 'Năm sinh',
    danToc: 'Dân tộc', ngheNghiep: 'Nghề nghiệp', diaChi: 'Địa chỉ',
    tonGiao: 'Tôn giáo', benhVien: 'Bệnh viện', khoaPhongGiuong: 'Khoa/Phòng/Giường',
    lienHeNguoiThanTen: 'LH người thân (tên)', lienHeNguoiThanSdt: 'LH người thân (SĐT)',
    ngayVaoVien: 'Ngày giờ vào viện', ngayLamBenhAn: 'Ngày giờ làm bệnh án',
    lyDo: 'Lý do vào viện', benhSu: 'Bệnh sử', tienSu: 'Tiền sử',
    khamLucVaoVien: 'Khám lúc vào viện',
    chanDoanPhauThuat: 'CĐ phẫu thuật', phauThuatDuKien: 'PT/TT dự kiến',
    ngayMoDuKien: 'Ngày mổ dự kiến', phuongPhapVoCamDuKien: 'Vô cảm dự kiến',
    thuocDangDung: 'Thuốc đang dùng', diUng: 'Dị ứng', tienSuGayMe: 'Tiền sử gây mê', thoiQuen: 'Thói quen/nguy cơ',
    asa: 'ASA', airwayMallampati: 'Mallampati', airwayHaMiengCm: 'Há miệng (cm)', airwayCo: 'Cổ',
    airwayRangGia: 'Răng giả/lung lay', airwayDuKienKho: 'Dự kiến khó NKQ',
    nguyCoPhauthuat: 'Nguy cơ phẫu thuật', nguyCoVoCam: 'Nguy cơ vô cảm',
    keHoachVoCam: 'Kế hoạch vô cảm', keHoachGiamDau: 'Kế hoạch giảm đau', duPhongPONV: 'Dự phòng PONV', keHoachHoiSuc: 'Hồi sức sau mổ',
    ketLuanGMHS: 'Kết luận/đề xuất',
    khamNgoaiMat: 'Khám ngoài mặt', khamTrongMieng: 'Khám trong miệng', khamRang: 'Khám răng', khamNhaChu: 'Khám nha chu',
    khopCanTmj: 'Khớp cắn/TMJ', canLamSang: 'CLS chỉ định', ketQuaCLS: 'CLS kết quả', donThuoc: 'Đơn thuốc', henTaiKham: 'Hẹn tái khám',
    mach: 'Mạch', nhietDo: 'Nhiệt độ', haTren: 'HA tâm thu', haDuoi: 'HA tâm trương',
    nhipTho: 'Nhịp thở', chieuCao: 'Chiều cao', canNang: 'Cân nặng',
    toanThan: 'Toàn thân', timmach: 'Tim mạch', hohap: 'Hô hấp',
    tieuhoa: 'Tiêu hóa', than: 'Thận', thankinh: 'Thần kinh', cokhop: 'Cơ xương khớp',
    tomTat: 'Tóm tắt', chanDoan: 'Chẩn đoán', chanDoanPhanBiet: 'CĐ phân biệt',
    chanDoanXacDinh: 'CĐ xác định', huongDieuTri: 'Hướng ĐT', dieuTri: 'Điều trị',
    tienLuong: 'Tiên lượng',
    clsChuanDoan: 'CLS chẩn đoán', clsThuongQuy: 'CLS tìm nguyên nhân',
    clsHoTroDieuTri: 'CLS hỗ trợ điều trị', clsTheoDoiTienLuong: 'CLS theo dõi/tiên lượng',
    tuVanInDocx: 'In mục tư vấn', tuVanPresets: 'Tư vấn (preset)', tuVan: 'Tư vấn',
    bienLuan: 'Biện luận'
};

const ChatPanel = ({ isOpen, onClose, formData, setFormData, formType }) => {
    // --- STATE ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState(''); // EN: Detail loading status / VI: Trạng thái chi tiết khi đang tải
    const [retryPrompt, setRetryPrompt] = useState(null); // VI: Lưu prompt gần nhất để thử lại khi 429/timeout
    const [pendingUpdates, setPendingUpdates] = useState(null); // EN: Proposed changes waiting for approval / VI: Các thay đổi AI đề xuất chờ duyệt
    const [selectedFields, setSelectedFields] = useState(new Set()); // EN: Fields selected by user to apply / VI: Các field user chọn để apply
    const [undoStack, setUndoStack] = useState([]); // EN: Stack to store old states for Undo / VI: Stack lưu trạng thái cũ để Undo
    const [contextSummary, setContextSummary] = useState(''); // EN: Context summary (for long chats) / VI: Tóm tắt ngữ cảnh (khi chat dài)
    const messagesEndRef = useRef(null);

    // EN: Auto-scroll to bottom on new message
    // VI: Auto-scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- PERSISTENCE: Load/Save Chat History ---
    useEffect(() => {
        // EN: Load history by medical record type (Internal, Surgery...)
        // VI: Load history theo từng loại bệnh án (Nội khoa, Ngoại khoa...)
        const key = `chat_${formType || 'general'}`;
        const saved = safeLocalStorage.getItem(key);
        if (saved) try {
            const data = JSON.parse(saved);
            setMessages(data.messages || []);
            setContextSummary(data.summary || '');
        } catch { /* Ignore error */ }
    }, [formType]);

    useEffect(() => {
        // EN: Save history when messages change
        // VI: Save history khi messages thay đổi
        const key = `chat_${formType || 'general'}`;
        safeLocalStorage.setItem(key, JSON.stringify({ messages, summary: contextSummary }));
    }, [messages, formType, contextSummary]);

    // EN: Auto-select all fields when new proposed changes arrive
    // VI: Tự động chọn tất cả các field khi có đề xuất thay đổi mới
    useEffect(() => {
        if (pendingUpdates) {
            setSelectedFields(new Set(Object.keys(pendingUpdates)));
        }
    }, [pendingUpdates]);

    // EN: Create Set of valid field names for quick check
    // VI: Tạo Set chứa tên các field hợp lệ để check nhanh
    const validFieldNames = new Set(
        (formData && typeof formData === 'object' && Object.keys(formData).length > 0)
            ? Object.keys(formData)
            : Object.keys(FIELD_LABELS)
    );

    // --- SEND MESSAGE (GỬI TIN NHẮN) ---
    // EN: Helper function to perform single API call with timeout
    // VI: Helper thực hiện 1 lần gọi API với timeout
    const callApi = async (userMsg, signal) => {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // EN: Send only last 10 messages + new message to save tokens
                // VI: Chỉ gửi 10 tin nhắn gần nhất + tin nhắn mới để tiết kiệm token
                messages: messages.slice(-10).concat(userMsg),
                formData: formData || {},
                formType: formType || 'noikhoa',
                contextSummary
            }),
            signal
        });

        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('RATE_LIMIT_429');
            }
            throw new Error(`Server trả về lỗi ${res.status}`);
        }

        return await res.json();
    };

    const handleSend = async (overridePrompt) => {
        const promptText = String(overridePrompt ?? input).trim();
        if (!promptText) return;

        // Rate limit cục bộ (theo formType)
        const now = Date.now();
        const rlKey = `chat_rl_${formType || 'general'}`;
        let stamps = [];
        const raw = safeLocalStorage.getItem(rlKey);
        if (raw) {
            try { stamps = JSON.parse(raw); } catch { stamps = []; }
        }
        if (!Array.isArray(stamps)) stamps = [];
        stamps = stamps
            .filter(t => typeof t === 'number')
            .filter(t => (now - t) < LOCAL_RATE_LIMIT_WINDOW_MS);

        if (stamps.length >= LOCAL_RATE_LIMIT_MAX_REQUESTS) {
            const oldest = Math.min(...stamps);
            const waitMs = Math.max(0, LOCAL_RATE_LIMIT_WINDOW_MS - (now - oldest));
            const waitSec = Math.max(1, Math.ceil(waitMs / 1000));
            setRetryPrompt(promptText);
            setMessages(prev => [...prev, { role: 'assistant', content: `Bạn đang gửi quá nhanh. Vui lòng đợi khoảng ${waitSec}s rồi thử lại.` }]);
            return;
        }

        stamps.push(now);
        safeLocalStorage.setItem(rlKey, JSON.stringify(stamps));

        const userMsg = { role: 'user', content: promptText };

        // Optimistic UI update
        setMessages(prev => [...prev, userMsg]);
        if (overridePrompt === undefined) setInput('');
        setLoading(true);
        setLoadingStatus('Đang gửi yêu cầu...');
        setPendingUpdates(null);
        setRetryPrompt(null);

        // EN: Retry loop - try up to MAX_RETRIES times on timeout/network errors
        // VI: Vòng lặp retry - thử lại tối đa MAX_RETRIES lần khi timeout hoặc lỗi mạng
        let lastError = null;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            attempt++;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

            try {
                // Cập nhật status theo attempt
                if (attempt === 1) {
                    setLoadingStatus('Đang chờ AI xử lý...');
                } else {
                    setLoadingStatus(`Đang thử lại lần ${attempt}/${MAX_RETRIES}...`);
                }

                const data = await callApi(userMsg, controller.signal);
                clearTimeout(timeoutId);

                // Thành công - xử lý response
                if (data.answer) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);

                    // EN: If AI returns updates (JSON), show review panel
                    // VI: Nếu AI trả về updates (JSON), hiển thị bảng review
                    const validatedUpdates = validateUpdates(data.updates, validFieldNames);
                    if (validatedUpdates) setPendingUpdates(validatedUpdates);

                    // EN: If server says context truncated, update client-side summary
                    // VI: Nếu server báo context bị cắt, cập nhật summary
                    if (data.contextTruncated && messages.length > 5) {
                        const summary = messages.slice(0, -3)
                            .map(m => `${m.role === 'user' ? 'Yêu cầu' : 'Trả lời'}: ${m.content.substring(0, 100)}`)
                            .join('; ');
                        setContextSummary(summary.substring(0, 500));
                    }
                } else if (data.error) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `Lỗi: ${data.error}` }]);
                }

                // Thành công - thoát vòng lặp
                setLoading(false);
                setLoadingStatus('');
                return;

            } catch (err) {
                clearTimeout(timeoutId);
                lastError = err;

                // Nếu là 429 (rate limit) - không retry, báo lỗi ngay
                if (err?.message === 'RATE_LIMIT_429') {
                    setRetryPrompt(promptText);
                    setMessages(prev => [...prev, { role: 'assistant', content: 'Hệ thống đang quá tải hoặc đã vượt giới hạn (429). Vui lòng đợi 20-30 giây rồi bấm Thử lại.' }]);
                    setLoading(false);
                    setLoadingStatus('');
                    return;
                }

                // Nếu là timeout hoặc lỗi mạng - thử lại nếu còn lượt
                const isRetryable = err?.name === 'AbortError' ||
                    err?.message?.includes('Failed to fetch') ||
                    err?.message?.includes('NetworkError');

                if (isRetryable && attempt < MAX_RETRIES) {
                    // Còn lượt retry - đợi 2 giây rồi thử lại
                    setLoadingStatus(`Timeout, đang thử lại sau 2 giây... (${attempt}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                // Hết lượt retry hoặc lỗi không thể retry
                break;
            }
        }

        // Tất cả các lần retry đều thất bại
        setRetryPrompt(promptText);
        if (lastError?.name === 'AbortError') {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Yêu cầu quá thời gian chờ sau ${MAX_RETRIES} lần thử. AI có thể đang quá tải. Vui lòng thử lại sau.`
            }]);
        } else {
            setMessages(prev => [...prev, { role: 'assistant', content: `Lỗi: ${lastError?.message || 'Không xác định'}` }]);
        }
        setLoading(false);
        setLoadingStatus('');
    };

    // EN: Toggle field selection
    // VI: Toggle chọn field để apply
    const toggleField = (field) => {
        setSelectedFields(prev => {
            const next = new Set(prev);
            next.has(field) ? next.delete(field) : next.add(field);
            return next;
        });
    };

    // --- APPLY CHANGES (ÁP DỤNG THAY ĐỔI) ---
    const applySelected = useCallback(() => {
        if (!pendingUpdates || !setFormData || selectedFields.size === 0) return;

        const toApply = {}, oldVals = {};
        for (const f of selectedFields) {
            if (pendingUpdates[f] !== undefined) {
                toApply[f] = pendingUpdates[f];
                oldVals[f] = formData?.[f] || ''; // EN: Save old value for Undo / VI: Lưu giá trị cũ để Undo
            }
        }

        // EN: Push to Undo Stack
        // VI: Push vào Undo Stack
        setUndoStack(prev => {
            const next = [...prev, { fields: oldVals, count: Object.keys(toApply).length }];
            return next.length > MAX_UNDO_STACK ? next.slice(-MAX_UNDO_STACK) : next;
        });

        // Update Form Data
        setFormData(prev => ({ ...prev, ...toApply }));

        // EN: Remove applied fields from pending list
        // VI: Xóa các field đã apply khỏi list pending
        const remaining = {};
        for (const [k, v] of Object.entries(pendingUpdates)) {
            if (!selectedFields.has(k)) remaining[k] = v;
        }

        if (Object.keys(remaining).length > 0) {
            setPendingUpdates(remaining);
            setSelectedFields(new Set(Object.keys(remaining)));
        } else {
            setPendingUpdates(null);
            setSelectedFields(new Set());
        }
    }, [pendingUpdates, setFormData, selectedFields, formData]);

    // --- UNDO LOGIC (HOÀN TÁC) ---
    const handleUndo = useCallback(() => {
        if (undoStack.length === 0 || !setFormData) return;
        const last = undoStack[undoStack.length - 1]; // EN: Get last state / VI: Lấy state gần nhất
        setFormData(prev => ({ ...prev, ...last.fields })); // EN: Restore old values / VI: Restore giá trị cũ
        setUndoStack(prev => prev.slice(0, -1)); // Pop stack
    }, [undoStack, setFormData]);

    // EN: Reset session
    // VI: Reset session mới
    const handleNewSession = () => {
        if (messages.length > 0) {
            // EN: Save summary of old session as context for new session
            // VI: Lưu summary phiên cũ làm context cho phiên mới
            const summary = messages
                .slice(-6)
                .map(m => m.content.substring(0, 80))
                .join(' | ');
            setContextSummary(summary.substring(0, 400));
        }
        setMessages([]);
        setPendingUpdates(null);
    };

    const handleClear = () => {
        if (messages.length > 0 && !window.confirm('Xóa toàn bộ lịch sử chat?')) {
            return;
        }
        setMessages([]);
        setPendingUpdates(null);
        setUndoStack([]);
        setContextSummary('');
    };

    // EN: Quick Actions / Prompt Suggestions
    // VI: Các lệnh nhanh (Prompt suggestions)
    const quickActions = [
        { label: 'Phân tích', prompt: 'Phân tích bệnh án hiện tại và chỉ ra các điểm thiếu sót' },
        { label: 'Gợi ý', prompt: 'Gợi ý chẩn đoán sơ bộ và hướng điều trị dựa trên các triệu chứng trên' },
        { label: 'Hoàn thiện', prompt: 'Hãy viết giúp tôi phần Tóm tắt bệnh án dựa trên dữ liệu đã nhập' },
    ];

    if (!isOpen) return null;

    const hasChanges = pendingUpdates && Object.keys(pendingUpdates).length > 0;

    return (
        <div style={{
            position: 'fixed', right: '16px', bottom: '16px',
            display: 'flex', gap: '12px', zIndex: 1000, alignItems: 'flex-end'
        }}>
            {/* --- PANEL 1: REVIEW CHANGES (Show when updates proposed) --- */}
            {hasChanges && (
                <div style={{
                    width: '320px',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--accent-blue)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    overflow: 'hidden'
                }}>
                    {/* Header Changes */}
                    <div style={{
                        padding: '10px 12px',
                        background: 'var(--accent-blue)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>
                            Thay đổi đề xuất ({Object.keys(pendingUpdates).length})
                        </span>
                        <button
                            onClick={() => {
                                const all = Object.keys(pendingUpdates);
                                setSelectedFields(selectedFields.size === all.length ? new Set() : new Set(all));
                            }}
                            style={{
                                fontSize: '11px', padding: '3px 8px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.2)', border: 'none',
                                borderRadius: '3px', color: 'white'
                            }}
                        >
                            {selectedFields.size === Object.keys(pendingUpdates).length ? 'Bỏ chọn' : 'Chọn tất cả'}
                        </button>
                    </div>

                    {/* List Changes (Diff View) */}
                    <div style={{ maxHeight: '280px', overflow: 'auto', padding: '8px' }}>
                        {Object.entries(pendingUpdates).map(([field, newValue]) => {
                            const oldValue = formData?.[field] || '';
                            const hasChange = oldValue !== newValue;

                            return (
                                <label key={field} style={{
                                    display: 'block',
                                    padding: '8px 10px',
                                    marginBottom: '6px',
                                    background: selectedFields.has(field) ? 'var(--bg-hover)' : 'var(--bg-primary)',
                                    border: `1px solid ${selectedFields.has(field) ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedFields.has(field)}
                                            onChange={() => toggleField(field)}
                                        />
                                        <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                                            {FIELD_LABELS[field] || field}
                                        </span>
                                    </div>

                                    {/* Diff Visual */}
                                    <div style={{ fontSize: '11px', lineHeight: 1.4 }}>
                                        {oldValue && hasChange && (
                                            <div style={{
                                                padding: '4px 8px',
                                                background: 'rgba(220, 38, 38, 0.1)',
                                                borderLeft: '3px solid #dc2626',
                                                marginBottom: '4px',
                                                borderRadius: '0 4px 4px 0'
                                            }}>
                                                <span style={{ color: '#dc2626', fontWeight: 600 }}>Cũ: </span>
                                                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                    {String(oldValue).substring(0, 100)}{String(oldValue).length > 100 ? '...' : ''}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{
                                            padding: '4px 8px',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            borderLeft: '3px solid #22c55e',
                                            borderRadius: '0 4px 4px 0'
                                        }}>
                                            <span style={{ color: '#22c55e', fontWeight: 600 }}>Mới: </span>
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {String(newValue).substring(0, 100)}{String(newValue).length > 100 ? '...' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        padding: '10px 12px',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex', gap: '8px', justifyContent: 'flex-end'
                    }}>
                        <button
                            onClick={() => setPendingUpdates(null)}
                            style={{
                                padding: '7px 14px', fontSize: '12px', cursor: 'pointer',
                                background: 'var(--bg-hover)', border: '1px solid var(--border-medium)',
                                borderRadius: '4px', color: 'var(--text-secondary)'
                            }}
                        >
                            Bỏ qua
                        </button>
                        <button
                            onClick={applySelected}
                            disabled={selectedFields.size === 0}
                            style={{
                                padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                background: selectedFields.size > 0 ? 'var(--accent-blue)' : 'var(--bg-hover)',
                                color: selectedFields.size > 0 ? 'white' : 'var(--text-muted)',
                                border: 'none', borderRadius: '4px'
                            }}
                        >
                            Áp dụng ({selectedFields.size})
                        </button>
                    </div>
                </div>
            )}

            {/* --- PANEL 2: CHAT INTERFACE --- */}
            <div style={{
                width: '360px', height: '480px',
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-secondary)', border: '2px solid var(--border-dark)',
                borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                overflow: 'hidden'
            }}>
                {/* Header Chat */}
                <div style={{
                    padding: '10px 12px', background: 'var(--bg-sidebar)',
                    borderBottom: '1px solid var(--border-dark)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        AI Assistant
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {undoStack.length > 0 && (
                            <button onClick={handleUndo} style={{
                                background: 'none', border: '1px solid var(--border-light)',
                                borderRadius: '3px', cursor: 'pointer', color: 'var(--text-muted)',
                                fontSize: '11px', padding: '3px 8px'
                            }}>
                                Undo ({undoStack.length})
                            </button>
                        )}
                        <button onClick={handleNewSession} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '11px', padding: '3px 6px'
                        }} title="Phiên mới (giữ ngữ cảnh)">
                            Mới
                        </button>
                        <button onClick={handleClear} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '11px', padding: '3px 6px'
                        }}>
                            Xóa
                        </button>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-primary)', fontSize: '16px', fontWeight: 'bold', padding: '0 4px'
                        }}>×</button>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div style={{
                    padding: '8px 12px', display: 'flex', gap: '6px',
                    borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap'
                }}>
                    {quickActions.map((a, i) => (
                        <button key={i} onClick={() => setInput(a.prompt)} style={{
                            padding: '4px 10px', fontSize: '11px', fontWeight: 500,
                            background: 'var(--bg-hover)', border: '1px solid var(--border-light)',
                            borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)'
                        }}>{a.label}</button>
                    ))}
                </div>

                {/* Context Indicator */}
                {contextSummary && (
                    <div style={{
                        padding: '6px 12px', fontSize: '10px', color: 'var(--text-muted)',
                        background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-light)'
                    }}>
                        Ngữ cảnh: {contextSummary.substring(0, 60)}...
                    </div>
                )}

                {/* Message List */}
                <div style={{
                    flex: '1 1 0',
                    minHeight: 0,
                    maxHeight: 'calc(100% - 140px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }} className="chat-messages-scroll">
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px' }}>
                            Xin chào! Tôi có thể đọc bệnh án và hỗ trợ chỉnh sửa.
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            minWidth: 0,
                            padding: '10px 14px',
                            borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            background: m.role === 'user' ? 'var(--bg-chat-user)' : 'var(--bg-chat-bot)',
                            color: m.role === 'user' ? 'var(--text-chat-user)' : 'var(--text-chat-bot)',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                        }}>
                            <div style={{ wordBreak: 'break-word', lineHeight: '1.6' }}>
                                <ReactMarkdown
                                    components={{
                                        // Custom renderers để Markdown trông đẹp hơn trong chat box nhỏ
                                        p: ({ children }) => <p style={{ margin: '0 0 10px 0' }}>{children}</p>,
                                        ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '18px' }}>{children}</ul>,
                                        ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '18px' }}>{children}</ol>,
                                        code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '3px' }}>{children}</code>,
                                    }}
                                >{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{
                            padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)',
                            fontStyle: 'italic', background: 'var(--bg-hover)', borderRadius: '8px',
                            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <span style={{
                                display: 'inline-block', width: '12px', height: '12px',
                                border: '2px solid var(--text-muted)', borderTopColor: 'transparent',
                                borderRadius: '50%', animation: 'spin 1s linear infinite'
                            }} />
                            {loadingStatus || 'Đang xử lý...'}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '10px 12px', borderTop: '1px solid var(--border-light)',
                    display: 'flex', gap: '8px', background: 'var(--bg-secondary)'
                }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Nhập yêu cầu..."
                        style={{ flex: 1, fontSize: '13px', padding: '8px 10px', borderRadius: '4px' }}
                    />
                    {retryPrompt && !loading && (
                        <button
                            className="btn"
                            onClick={() => handleSend(retryPrompt)}
                            style={{ padding: '8px 10px', fontSize: '12px', fontWeight: 600 }}
                            title="Thử lại prompt gần nhất"
                        >
                            Thử lại
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600 }}
                    >
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
