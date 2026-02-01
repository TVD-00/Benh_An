// Context quản lý trạng thái đăng nhập user
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

const safeStorage = {
    getItem: (key) => {
        try { return localStorage.getItem(key); }
        catch { return null; }
    },
    setItem: (key, value) => {
        try { localStorage.setItem(key, value); }
        catch { /* bỏ qua */ }
    },
    removeItem: (key) => {
        try { localStorage.removeItem(key); }
        catch { /* bỏ qua */ }
    }
};

const USER_TOKEN_KEY = 'user_token';
const USER_DATA_KEY = 'user_data';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = safeStorage.getItem(USER_DATA_KEY);
        if (saved) {
            try { return JSON.parse(saved); }
            catch { return null; }
        }
        return null;
    });
    const [token, setToken] = useState(() => safeStorage.getItem(USER_TOKEN_KEY) || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Kiểm tra token còn hợp lệ khi khởi động
    useEffect(() => {
        if (token && !user) {
            fetchMe(token);
        }
    }, []);

    const fetchMe = async (authToken) => {
        if (!authToken) return;
        try {
            const res = await fetch(`${API_BASE_URL}/me`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (!res.ok) {
                // Token hết hạn hoặc không hợp lệ
                logout();
                return;
            }
            const data = await res.json();
            if (data?.user) {
                setUser(data.user);
                safeStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
            }
        } catch {
            logout();
        }
    };

    const login = useCallback(async (username, password) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || `Lỗi ${res.status}`);
            }

            if (!data?.token) throw new Error('Thiếu token');

            safeStorage.setItem(USER_TOKEN_KEY, data.token);
            safeStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            return { ok: true, user: data.user };
        } catch (e) {
            setError(e.message || 'Đăng nhập thất bại');
            return { ok: false, error: e.message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        safeStorage.removeItem(USER_TOKEN_KEY);
        safeStorage.removeItem(USER_DATA_KEY);
        setToken('');
        setUser(null);
        setError('');
    }, []);

    const isAdmin = user?.role === 'admin';
    const isLoggedIn = !!user && !!token;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            error,
            isAdmin,
            isLoggedIn,
            login,
            logout,
            setError
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
