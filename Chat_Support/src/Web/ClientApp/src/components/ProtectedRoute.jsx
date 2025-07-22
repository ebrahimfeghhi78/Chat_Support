// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        // کاربر را به صفحه لاگین روبیک هدایت می‌کنیم
        window.location.href = `http://192.168.1.10:925/Modules/login.aspx?fromReq=%7e%2fModules%2fRedirectToChat.aspx%3f`;

        return null; // در حین ریدایرکت چیزی رندر نمی‌شود
    }

    return children;
};

export default ProtectedRoute;