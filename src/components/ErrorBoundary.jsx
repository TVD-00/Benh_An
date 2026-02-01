import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error để debug
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--surface)',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="glass" style={{
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '100%'
                    }}>
                        <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
                            Đã xảy ra lỗi
                        </h2>
                        
                        <p style={{ marginBottom: '1rem', color: 'hsl(var(--text))' }}>
                            Ứng dụng đã gặp lỗi không mong muốn. Vui lòng thử tải lại trang.
                        </p>

                        {this.state.error && (
                            <div style={{
                                background: 'rgba(220, 38, 38, 0.1)',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                textAlign: 'left',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                color: '#dc2626',
                                overflow: 'auto',
                                maxHeight: '200px'
                            }}>
                                <strong>Lỗi:</strong> {this.state.error.toString()}
                                {this.state.errorInfo && (
                                    <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button 
                                onClick={this.handleReload}
                                className="btn btn-primary"
                            >
                                Tải lại trang
                            </button>
                            
                            {this.props.onReset && (
                                <button 
                                    onClick={this.handleReset}
                                    className="btn glass"
                                >
                                    Thử lại
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
