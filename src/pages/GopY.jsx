// Trang Góp ý - sử dụng AuthContext chung, hỗ trợ Reply
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import FormSection from '../components/FormSection';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();
    if (!res.ok) {
        const msg = (isJson && data && data.error) ? data.error : `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

const FEEDBACK_TYPES = [
    { value: 'gopy', label: 'Góp ý' },
    { value: 'bug', label: 'Báo lỗi' },
    { value: 'feature', label: 'Tính năng' },
    { value: 'question', label: 'Câu hỏi' },
    { value: 'other', label: 'Khác' }
];

const STATUS_LABELS = {
    new: 'Mới',
    reviewed: 'Đã xem',
    resolved: 'Đã xử lý',
    rejected: 'Từ chối'
};

const GopY = () => {
    const { user, token, isLoggedIn } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [type, setType] = useState('gopy');
    const [guestName, setGuestName] = useState('');
    const [text, setText] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitOk, setSubmitOk] = useState('');

    // Reply state
    const [replyingTo, setReplyingTo] = useState(null); // ID của comment đang reply
    const [replyText, setReplyText] = useState('');
    const [replyError, setReplyError] = useState('');

    const authHeaders = useMemo(() => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [token]);

    const loadList = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await fetchJson(`${API_BASE_URL}/feedback`);
            setItems(Array.isArray(rows) ? rows : []);
        } catch (e) {
            setError(e.message || 'Lỗi tải danh sách');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const handleSubmit = useCallback(async () => {
        setSubmitError('');
        setSubmitOk('');

        const body = {
            type,
            text,
            username: isLoggedIn ? user.displayName : guestName,
            meta: {
                route: window.location?.pathname || ''
            }
        };

        try {
            await fetchJson(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify(body)
            });
            setText('');
            setSubmitOk('Đã gửi góp ý. Cảm ơn bạn!');
            loadList();
        } catch (e) {
            setSubmitError(e.message || 'Gửi góp ý thất bại');
        }
    }, [type, text, guestName, authHeaders, loadList, isLoggedIn, user]);

    const handleReply = useCallback(async (commentId) => {
        if (!replyText.trim()) return;
        setReplyError('');

        try {
            await fetchJson(`${API_BASE_URL}/feedback/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ text: replyText })
            });
            setReplyText('');
            setReplyingTo(null);
            loadList();
        } catch (e) {
            setReplyError(e.message || 'Gửi phản hồi thất bại');
        }
    }, [replyText, authHeaders, loadList]);

    return (
        <div className="page-container">
            <div className="glass" style={{
                position: 'sticky', top: 0, zIndex: 100,
                padding: '1rem', marginBottom: '1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h1 className="text-xl font-bold" style={{ margin: 0 }}>Góp ý</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isLoggedIn && (
                        <span className="text-sm">
                            Xin chào, <b>{user.displayName || user.username}</b>
                        </span>
                    )}
                    <button className="btn" onClick={loadList} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            {!isLoggedIn && (
                <div className="glass" style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)'
                }}>
                    Đăng nhập để có thể phản hồi góp ý của người khác
                </div>
            )}

            <FormSection title="Gửi góp ý">
                <div className="grid-2">
                    <div className="input-group">
                        <label>Loại</label>
                        <select value={type} onChange={(e) => setType(e.target.value)}>
                            {FEEDBACK_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    {!isLoggedIn && (
                        <div className="input-group">
                            <label>Nickname</label>
                            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nhập nickname..." />
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label>Nội dung</label>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Mô tả góp ý/báo lỗi..." />
                </div>

                {submitError && <div className="error-message">{submitError}</div>}
                {submitOk && <div style={{ color: 'var(--accent-green)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{submitOk}</div>}

                <button className="btn btn-primary" onClick={handleSubmit} disabled={!String(text || '').trim()}>
                    Gửi
                </button>
            </FormSection>

            <FormSection title="Danh sách góp ý">
                {error && <div className="error-message">{error}</div>}

                {items.length === 0 && !loading && (
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Chưa có góp ý nào.</div>
                )}

                {items.map(item => (
                    <div key={item.id} className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                {item.username}
                                {item.heart && <span style={{ color: 'var(--accent-pink)', marginLeft: '0.5rem' }}>Nổi bật</span>}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.date}</div>
                        </div>

                        {/* Meta */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: 'var(--bg-hover)',
                                color: 'var(--text-secondary)'
                            }}>
                                {FEEDBACK_TYPES.find(t => t.value === item.type)?.label || item.type}
                            </span>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: item.status === 'resolved' ? 'var(--accent-green)' :
                                    item.status === 'rejected' ? 'var(--accent-red)' : 'var(--bg-hover)',
                                color: (item.status === 'resolved' || item.status === 'rejected') ? '#fff' : 'var(--text-secondary)'
                            }}>
                                {STATUS_LABELS[item.status] || item.status}
                            </span>
                        </div>

                        {/* Content */}
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5 }}>{item.text}</pre>

                        {/* Replies */}
                        {item.replies && item.replies.length > 0 && (
                            <div style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '2px solid var(--border-medium)' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                    Phản hồi ({item.replies.length})
                                </div>
                                {item.replies.map(reply => (
                                    <div key={reply.id} style={{
                                        marginBottom: '0.75rem',
                                        padding: '0.5rem 0.75rem',
                                        background: reply.isAdmin ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-hover)',
                                        borderRadius: '6px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                {reply.username}
                                                {reply.isAdmin && (
                                                    <span style={{
                                                        marginLeft: '0.5rem',
                                                        fontSize: '0.65rem',
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: '3px',
                                                        background: 'var(--accent-blue)',
                                                        color: '#fff'
                                                    }}>Admin</span>
                                                )}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reply.date}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem' }}>{reply.text}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Reply button & form */}
                        {isLoggedIn && (
                            <div style={{ marginTop: '0.75rem' }}>
                                {replyingTo === item.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Nhập phản hồi..."
                                            rows={2}
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                        {replyError && <div className="error-message">{replyError}</div>}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleReply(item.id)}
                                                disabled={!replyText.trim()}
                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                                            >
                                                Gửi
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => { setReplyingTo(null); setReplyText(''); setReplyError(''); }}
                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        className="btn"
                                        onClick={() => setReplyingTo(item.id)}
                                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                                    >
                                        Phản hồi
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </FormSection>
        </div>
    );
};

export default GopY;
