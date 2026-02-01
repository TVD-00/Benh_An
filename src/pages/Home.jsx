// Trang chủ - Giới thiệu ứng dụng
import React from 'react';
import { Link } from 'react-router-dom';
import FormSection from '../components/FormSection';

const FORM_TYPES = [
    { path: '/noikhoa', name: 'Nội khoa', desc: 'Bệnh án nội khoa tổng quát', color: '#3b82f6' },
    { path: '/sankhoa', name: 'Sản khoa', desc: 'Bệnh án sản khoa', color: '#ec4899' },
    { path: '/phukhoa', name: 'Phụ khoa', desc: 'Bệnh án phụ khoa', color: '#f472b6' },
    { path: '/nhikhoa', name: 'Nhi khoa', desc: 'Bệnh án nhi khoa', color: '#22c55e' },
    { path: '/tienphau', name: 'Tiền phẫu', desc: 'Đánh giá trước phẫu thuật', color: '#f59e0b' },
    { path: '/hauphau', name: 'Hậu phẫu', desc: 'Theo dõi sau phẫu thuật', color: '#ef4444' },
    { path: '/gmhs', name: 'GMHS', desc: 'Gây mê hồi sức', color: '#8b5cf6' },
    { path: '/yhct', name: 'YHCT', desc: 'Y học cổ truyền', color: '#14b8a6' },
    { path: '/ranghammat', name: 'RHM', desc: 'Răng hàm mặt', color: '#06b6d4' },
];

const Home = () => {
    return (
        <div className="page-container">
            {/* Hero Section */}
            <div className="glass" style={{
                padding: '2rem',
                marginBottom: '2rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-sidebar) 100%)'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    marginBottom: '0.75rem',
                    background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Hồ Sơ Bệnh Án Điện Tử
                </h1>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    maxWidth: '600px',
                    margin: '0 auto 1.5rem'
                }}>
                    Ứng dụng hỗ trợ viết bệnh án điện tử dành cho sinh viên y khoa.
                    Tích hợp AI để gợi ý nội dung, xuất file DOCX chuyên nghiệp.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/noikhoa" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                        Bắt đầu ngay
                    </Link>
                    <Link to="/gopy" className="btn" style={{ padding: '0.75rem 1.5rem' }}>
                        Góp ý
                    </Link>
                </div>
            </div>

            {/* Form Types Grid */}
            <FormSection title="Chọn loại bệnh án">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    {FORM_TYPES.map(form => (
                        <Link
                            key={form.path}
                            to={form.path}
                            className="glass"
                            style={{
                                padding: '1.25rem',
                                textDecoration: 'none',
                                borderLeft: `4px solid ${form.color}`,
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                display: 'block'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                fontWeight: 700,
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                marginBottom: '0.35rem'
                            }}>
                                {form.name}
                            </div>
                            <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)'
                            }}>
                                {form.desc}
                            </div>
                        </Link>
                    ))}
                </div>
            </FormSection>

            {/* Features */}
            <FormSection title="Tính năng nổi bật">
                <div className="grid-3" style={{ gap: '1rem' }}>
                    <div className="glass" style={{ padding: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            AI
                        </div>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Hỗ trợ AI</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Gợi ý nội dung bệnh án dựa trên dữ liệu đã nhập
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-green)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            DOCX
                        </div>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Xuất Word</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Xuất file Word chuyên nghiệp theo mẫu chuẩn
                        </p>
                    </div>
                    <div className="glass" style={{ padding: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--accent-purple)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            SYNC
                        </div>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Realtime</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Đồng bộ dữ liệu realtime khi làm việc nhóm
                        </p>
                    </div>
                </div>
            </FormSection>
        </div>
    );
};

export default Home;
