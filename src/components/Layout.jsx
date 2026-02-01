import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import SpriteIcon from './SpriteIcon';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import AdminPanel from './AdminPanel';

const Layout = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const { user, isAdmin, isLoggedIn, logout } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);

    return (
        <div className="layout">
            <aside className="sidebar">
                {/* Header */}
                <div style={{
                    padding: '0.5rem',
                    marginBottom: '1rem',
                    borderBottom: '2px solid var(--border-dark)',
                    paddingBottom: '0.75rem'
                }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <h2 style={{
                            color: 'var(--text-primary)',
                            fontWeight: '700',
                            letterSpacing: '-0.5px',
                            fontSize: '1.1rem',
                            margin: 0
                        }}>
                            MediNote
                        </h2>
                    </Link>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon name="checklist" />
                        <span>Trang chủ</span>
                    </NavLink>

                    <div style={{ height: '1px', background: 'var(--border-medium)', margin: '0.5rem 0' }} />

                    <NavLink to="/noikhoa" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="clinical" total={3} idx={2} />
                        <span>Nội Khoa</span>
                    </NavLink>

                    <NavLink to="/sankhoa" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="specialty" total={3} idx={0} />
                        <span>Sản Khoa</span>
                    </NavLink>

                    <NavLink to="/phukhoa" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="specialty" total={3} idx={1} />
                        <span>Phụ Khoa</span>
                    </NavLink>

                    <NavLink to="/nhikhoa" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="specialty" total={3} idx={2} />
                        <span>Nhi Khoa</span>
                    </NavLink>

                    <div style={{ height: '1px', background: 'var(--border-medium)', margin: '0.5rem 0' }} />

                    <NavLink to="/tienphau" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="clinical" total={3} idx={0} />
                        <span>Tiền Phẫu</span>
                    </NavLink>

                    <NavLink to="/hauphau" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon type="clinical" total={3} idx={1} />
                        <span>Hậu Phẫu</span>
                    </NavLink>

                    <NavLink to="/gmhs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon name="stethoscope" />
                        <span>GMHS</span>
                    </NavLink>

                    <NavLink to="/ranghammat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon name="checklist" />
                        <span>Răng Hàm Mặt</span>
                    </NavLink>

                    <NavLink to="/yhct" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon name="medicine" />
                        <span>YHCT</span>
                    </NavLink>

                    <div style={{ height: '1px', background: 'var(--border-medium)', margin: '0.5rem 0' }} />

                    <NavLink to="/gopy" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <SpriteIcon name="chat" />
                        <span>Góp ý</span>
                    </NavLink>

                    {/* Admin button - chỉ hiện khi user là admin */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowAdmin(true)}
                            className="nav-item"
                            style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left'
                            }}
                        >
                            <SpriteIcon name="lock_closed" />
                            <span>Admin Panel</span>
                        </button>
                    )}
                </nav>

                {/* Footer with User Info & Theme Toggle */}
                <div style={{
                    borderTop: '1px solid var(--border-medium)',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    {/* User Info */}
                    {isLoggedIn ? (
                        <div style={{
                            padding: '0.5rem',
                            background: 'var(--bg-hover)',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {user?.displayName || user?.username}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isAdmin && (
                                    <span style={{
                                        color: 'var(--accent-blue)',
                                        fontSize: '0.7rem',
                                        background: 'var(--accent-blue-light)',
                                        padding: '1px 6px',
                                        borderRadius: '3px'
                                    }}>
                                        Admin
                                    </span>
                                )}
                                <button
                                    onClick={logout}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowLogin(true)}
                            className="nav-item"
                            style={{
                                border: 'none',
                                background: 'var(--bg-hover)',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left'
                            }}
                        >
                            <SpriteIcon name="share" />
                            <span>Đăng nhập</span>
                        </button>
                    )}

                    {/* Theme Toggle Button */}
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
                    >
                        <span className="theme-toggle-icon">
                            {isDark ? '☀️' : '🌙'}
                        </span>
                        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>

            {/* Login Modal */}
            {showLogin && (
                <LoginModal onClose={() => setShowLogin(false)} />
            )}

            {/* Admin Panel Modal */}
            {showAdmin && isAdmin && (
                <AdminPanel onClose={() => setShowAdmin(false)} />
            )}
        </div>
    );
};

export default Layout;
