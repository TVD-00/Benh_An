// Admin Panel component - hiển thị dạng slide-out panel
// Chỉ hiển thị khi user có role admin
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const STATUS_OPTIONS = [
    { value: 'new', label: 'Mới', color: 'var(--accent-blue)' },
    { value: 'reviewed', label: 'Đã xem', color: 'var(--accent-yellow)' },
    { value: 'resolved', label: 'Đã xử lý', color: 'var(--accent-green)' },
    { value: 'rejected', label: 'Từ chối', color: 'var(--accent-red)' }
];

const TYPE_LABELS = {
    gopy: 'Góp ý',
    bug: 'Báo lỗi',
    feature: 'Tính năng',
    question: 'Câu hỏi',
    other: 'Khác'
};

const ROLE_OPTIONS = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
];

const AdminPanel = ({ onClose }) => {
    const { token } = useAuth();

    const [tab, setTab] = useState('feedback');

    // Feedback state
    const [feedback, setFeedback] = useState([]);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyError, setReplyError] = useState('');

    // Users state
    const [users, setUsers] = useState([]);
    const [usersError, setUsersError] = useState('');
    const [usersLoading, setUsersLoading] = useState(false);

    // Create user form
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newRole, setNewRole] = useState('user');
    const [newPassword, setNewPassword] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [createUserMsg, setCreateUserMsg] = useState('');

    const authHeaders = useMemo(() => {
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [token]);

    // ========== FEEDBACK FUNCTIONS ==========
    const loadFeedback = useCallback(async () => {
        setFeedbackLoading(true);
        setFeedbackError('');
        try {
            const rows = await fetchJson(`${API_BASE_URL}/admin/feedback`, {
                headers: { ...authHeaders }
            });
            setFeedback(Array.isArray(rows) ? rows : []);
        } catch (e) {
            setFeedbackError(e.message || 'Lỗi tải góp ý');
        } finally {
            setFeedbackLoading(false);
        }
    }, [authHeaders]);

    const updateFeedback = useCallback(async (id, patch) => {
        try {
            await fetchJson(`${API_BASE_URL}/admin/feedback/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify(patch)
            });
            loadFeedback();
        } catch (e) {
            alert(e.message || 'Cập nhật thất bại');
        }
    }, [authHeaders, loadFeedback]);

    const deleteFeedback = useCallback(async (id) => {
        if (!window.confirm('Xóa góp ý này?')) return;
        try {
            await fetchJson(`${API_BASE_URL}/admin/feedback/${id}`, {
                method: 'DELETE',
                headers: { ...authHeaders }
            });
            loadFeedback();
        } catch (e) {
            alert(e.message || 'Xóa thất bại');
        }
    }, [authHeaders, loadFeedback]);

    const handleReply = useCallback(async (commentId) => {
        if (!replyText.trim()) return;
        setReplyError('');
        try {
            await fetchJson(`${API_BASE_URL}/admin/feedback/${commentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ text: replyText })
            });
            setReplyText('');
            setReplyingTo(null);
            loadFeedback();
        } catch (e) {
            setReplyError(e.message || 'Gửi phản hồi thất bại');
        }
    }, [replyText, authHeaders, loadFeedback]);

    // ========== USER FUNCTIONS ==========
    const loadUsers = useCallback(async () => {
        setUsersLoading(true);
        setUsersError('');
        try {
            const rows = await fetchJson(`${API_BASE_URL}/admin/users`, {
                headers: { ...authHeaders }
            });
            setUsers(Array.isArray(rows) ? rows : []);
        } catch (e) {
            setUsersError(e.message || 'Lỗi tải users');
        } finally {
            setUsersLoading(false);
        }
    }, [authHeaders]);

    const handleCreateUser = useCallback(async () => {
        setCreateUserMsg('');
        const username = newUsername.trim();
        const displayName = newDisplayName.trim();
        if (!username || !displayName) {
            setCreateUserMsg('Thiếu username hoặc tên hiển thị');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            setCreateUserMsg('Password tối thiểu 6 ký tự');
            return;
        }
        if (newPassword !== newPassword2) {
            setCreateUserMsg('Password nhập lại không khớp');
            return;
        }

        try {
            await fetchJson(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ username, displayName, password: newPassword, role: newRole })
            });
            setNewUsername('');
            setNewDisplayName('');
            setNewPassword('');
            setNewPassword2('');
            setNewRole('user');
            setCreateUserMsg('Đã tạo user thành công!');
            loadUsers();
        } catch (e) {
            setCreateUserMsg(e.message || 'Tạo user thất bại');
        }
    }, [newUsername, newDisplayName, newPassword, newPassword2, newRole, authHeaders, loadUsers]);

    const toggleUserActive = useCallback(async (id) => {
        try {
            await fetchJson(`${API_BASE_URL}/admin/users/${id}/toggle-active`, {
                method: 'POST',
                headers: { ...authHeaders }
            });
            loadUsers();
        } catch (e) {
            alert(e.message || 'Cập nhật user thất bại');
        }
    }, [authHeaders, loadUsers]);

    const updateUserRole = useCallback(async (id, role) => {
        try {
            await fetchJson(`${API_BASE_URL}/admin/users/${id}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ role })
            });
            loadUsers();
        } catch (e) {
            alert(e.message || 'Cập nhật role thất bại');
        }
    }, [authHeaders, loadUsers]);

    const resetUserPassword = useCallback(async (id) => {
        const pwd = window.prompt('Nhập mật khẩu mới (>= 6 ký tự):');
        if (!pwd) return;
        if (pwd.length < 6) {
            alert('Password phải >= 6 ký tự');
            return;
        }
        try {
            await fetchJson(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders
                },
                body: JSON.stringify({ password: pwd })
            });
            alert('Đã đặt lại mật khẩu thành công!');
        } catch (e) {
            alert(e.message || 'Đặt lại mật khẩu thất bại');
        }
    }, [authHeaders]);

    const deleteUser = useCallback(async (id, username) => {
        if (!window.confirm(`Xóa tài khoản "${username}"? Hành động này không thể hoàn tác.`)) return;
        try {
            await fetchJson(`${API_BASE_URL}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { ...authHeaders }
            });
            loadUsers();
        } catch (e) {
            alert(e.message || 'Xóa tài khoản thất bại');
        }
    }, [authHeaders, loadUsers]);

    // Load data when tab changes
    useEffect(() => {
        if (tab === 'feedback') loadFeedback();
        if (tab === 'users') loadUsers();
    }, [tab, loadFeedback, loadUsers]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                justifyContent: 'flex-end',
                zIndex: 1000
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '700px',
                    height: '100%',
                    background: 'var(--bg-primary)',
                    overflowY: 'auto',
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    padding: '1rem 1.5rem',
                    background: 'var(--bg-sidebar)',
                    borderBottom: '1px solid var(--border-medium)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        Quản trị hệ thống
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className={`btn ${tab === 'feedback' ? 'btn-primary' : ''}`}
                            onClick={() => setTab('feedback')}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                            Góp ý ({feedback.length})
                        </button>
                        <button
                            className={`btn ${tab === 'users' ? 'btn-primary' : ''}`}
                            onClick={() => setTab('users')}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                            Users ({users.length})
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '0 0.5rem',
                                lineHeight: 1,
                                marginLeft: '0.5rem'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* ========== TAB: FEEDBACK ========== */}
                    {tab === 'feedback' && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <button className="btn" onClick={loadFeedback} disabled={feedbackLoading}>
                                    {feedbackLoading ? 'Đang tải...' : 'Tải lại'}
                                </button>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {feedback.length} góp ý
                                </span>
                            </div>
                            {feedbackError && <div className="error-message">{feedbackError}</div>}

                            {feedback.length === 0 && !feedbackLoading && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Chưa có góp ý nào.
                                </div>
                            )}

                            {feedback.map(item => (
                                <div key={item.id} className="glass" style={{ padding: '1rem', marginBottom: '1rem' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                            {item.username}
                                            {item.heart && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    color: 'var(--accent-pink)',
                                                    fontSize: '0.8rem'
                                                }}>Nổi bật</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                                        </div>
                                    </div>

                                    {/* Type & Status */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            fontSize: '0.7rem',
                                            borderRadius: '3px',
                                            background: 'var(--bg-hover)',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {TYPE_LABELS[item.type] || item.type}
                                        </span>
                                        <select
                                            value={item.status || 'new'}
                                            onChange={(e) => updateFeedback(item.id, { status: e.target.value })}
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                background: 'var(--bg-hover)',
                                                border: '1px solid var(--border-medium)',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Content */}
                                    <pre style={{
                                        margin: '0.5rem 0',
                                        whiteSpace: 'pre-wrap',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                        background: 'var(--bg-hover)',
                                        padding: '0.75rem',
                                        borderRadius: '6px'
                                    }}>
                                        {item.text}
                                    </pre>

                                    {/* Replies */}
                                    {item.replies && item.replies.length > 0 && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            paddingLeft: '0.75rem',
                                            borderLeft: '2px solid var(--accent-blue)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                marginBottom: '0.5rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                Phản hồi ({item.replies.length})
                                            </div>
                                            {item.replies.map((reply, idx) => (
                                                <div key={reply.id || idx} style={{
                                                    marginBottom: '0.5rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: reply.isAdmin ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-hover)',
                                                    borderRadius: '6px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                                            {reply.username}
                                                            {reply.isAdmin && (
                                                                <span style={{
                                                                    marginLeft: '0.4rem',
                                                                    fontSize: '0.6rem',
                                                                    padding: '1px 4px',
                                                                    borderRadius: '3px',
                                                                    background: 'var(--accent-blue)',
                                                                    color: '#fff'
                                                                }}>Admin</span>
                                                            )}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {reply.createdAt ? new Date(reply.createdAt).toLocaleString('vi-VN') : ''}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem' }}>{reply.text}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {replyingTo === item.id ? (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Nhập phản hồi của admin..."
                                                rows={2}
                                                style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}
                                            />
                                            {replyError && <div className="error-message">{replyError}</div>}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleReply(item.id)}
                                                    disabled={!replyText.trim()}
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                                                >
                                                    Gửi
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); setReplyError(''); }}
                                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => setReplyingTo(item.id)}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                            >
                                                Phản hồi
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => updateFeedback(item.id, { heart: !item.heart })}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                            >
                                                {item.heart ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật'}
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => deleteFeedback(item.id)}
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: 'var(--accent-red)' }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========== TAB: USERS ========== */}
                    {tab === 'users' && (
                        <div>
                            {/* Create User Form */}
                            <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Tạo user mới</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem' }}>Username</label>
                                        <input
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="vd: sinhvien01"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem' }}>Tên hiển thị</label>
                                        <input
                                            value={newDisplayName}
                                            onChange={(e) => setNewDisplayName(e.target.value)}
                                            placeholder="vd: Nguyen Van A"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem' }}>Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Tối thiểu 6 ký tự"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem' }}>Nhập lại password</label>
                                        <input
                                            type="password"
                                            value={newPassword2}
                                            onChange={(e) => setNewPassword2(e.target.value)}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '0.85rem' }}>Quyền</label>
                                        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                                            {ROLE_OPTIONS.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {createUserMsg && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        fontSize: '0.85rem',
                                        color: createUserMsg.includes('thành công') ? 'var(--accent-green)' : 'var(--accent-red)'
                                    }}>
                                        {createUserMsg}
                                    </div>
                                )}
                                <button className="btn btn-primary" onClick={handleCreateUser} style={{ marginTop: '1rem' }}>
                                    Tạo user
                                </button>
                            </div>

                            {/* Users List */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <button className="btn" onClick={loadUsers} disabled={usersLoading}>
                                    {usersLoading ? 'Đang tải...' : 'Tải lại'}
                                </button>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {users.length} users
                                </span>
                            </div>
                            {usersError && <div className="error-message">{usersError}</div>}

                            {users.length === 0 && !usersLoading && (
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Chưa có user nào.
                                </div>
                            )}

                            {users.map(u => (
                                <div key={u.id} className="glass" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                        <div>
                                            <span style={{ fontWeight: 700 }}>{u.username}</span>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                                ({u.displayName})
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <select
                                            value={u.role || 'user'}
                                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                background: u.role === 'admin' ? 'var(--accent-blue)' : 'var(--bg-hover)',
                                                border: '1px solid var(--border-medium)',
                                                color: u.role === 'admin' ? '#fff' : 'var(--text-primary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {ROLE_OPTIONS.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                        <span style={{
                                            padding: '2px 8px',
                                            fontSize: '0.7rem',
                                            borderRadius: '3px',
                                            background: u.isActive ? 'var(--accent-green)' : 'var(--accent-red)',
                                            color: '#fff'
                                        }}>
                                            {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        <button
                                            className="btn"
                                            onClick={() => toggleUserActive(u.id)}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            {u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => resetUserPassword(u.id)}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                        >
                                            Đặt lại mật khẩu
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => deleteUser(u.id, u.username)}
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: 'var(--accent-red)' }}
                                        >
                                            Xóa tài khoản
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
