// Trang Error - Server Error hoặc lỗi chung
import React from 'react';
import { Link, useRouteError } from 'react-router-dom';

const ErrorPage = () => {
    const error = useRouteError();

    // Xác định loại lỗi
    const status = error?.status || 500;
    const isServerError = status >= 500;

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
                    color: isServerError ? 'var(--accent-red)' : 'var(--accent-yellow)',
                    lineHeight: 1,
                    marginBottom: '1rem'
                }}>
                    {status}
                </div>
                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    color: 'var(--text-primary)'
                }}>
                    {isServerError ? 'Lỗi máy chủ' : 'Đã xảy ra lỗi'}
                </h1>
                <p style={{
                    color: 'var(--text-muted)',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6
                }}>
                    {isServerError
                        ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
                        : (error?.message || 'Đã xảy ra lỗi không mong muốn.')
                    }
                </p>

                {error?.statusText && (
                    <p style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        marginBottom: '1.5rem',
                        fontFamily: 'monospace',
                        background: 'var(--bg-hover)',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px'
                    }}>
                        {error.statusText}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        className="btn"
                        onClick={() => window.location.reload()}
                        style={{ padding: '0.75rem 1.5rem' }}
                    >
                        Thử lại
                    </button>
                    <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
