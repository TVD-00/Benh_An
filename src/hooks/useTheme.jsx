import React, { createContext, useContext, useState, useEffect } from 'react';

// Context cho theme
const ThemeContext = createContext();

// Hook để sử dụng theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Provider component
export const ThemeProvider = ({ children }) => {
    // Đọc theme từ localStorage hoặc mặc định là 'light'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('app_theme');
        if (saved) return saved;
        // Fallback: check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Apply theme class to html element
    useEffect(() => {
        const html = document.documentElement;

        // Remove existing theme classes
        html.classList.remove('light-theme', 'dark-theme');

        // Add current theme class
        html.classList.add(`${theme}-theme`);

        // Save to localStorage
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
        isLight: theme === 'light'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
