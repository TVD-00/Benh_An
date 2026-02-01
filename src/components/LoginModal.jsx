// Modal đăng nhập user
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginModal = ({ onClose }) => {
    const { login, loading, error, setError } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(username.trim(), password);
        if (result.ok) {
            onClose();
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <div
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            onClick={handleClose}
        >
            <div
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: '360px',
                    padding: '1.5rem',
                    margin: '1rem'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        Đăng nhập
                    </h2>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Nhập username..."
                            autoFocus
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '1rem' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Nhập password..."
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message" style={{ marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !username.trim() || !password}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                }}>
                    Nhập username và password để đăng nhập.<br />
                    Nếu chưa có tài khoản, hệ thống sẽ tự tạo cho bạn.
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
