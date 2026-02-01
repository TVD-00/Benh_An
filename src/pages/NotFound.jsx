// Trang 404 - Not Found
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="page-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center'
        }}>
            <div className="glass" style={{
                padding: '3rem',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{
                    fontSize: '6rem',
                    fontWeight: 800,
                    color: 'var(--accent-blue)',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    404
                </div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    color: 'var(--text-primary)'
                }}>
                    Trang không tồn tại
                </h1>
                <p style={{
                    color: 'var(--text-muted)',
                    marginBottom: '2rem',
                    lineHeight: 1.6
                }}>
                    Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                </p>
                <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
