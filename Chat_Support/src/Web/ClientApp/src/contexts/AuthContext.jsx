// src/context/AuthContext.jsx

import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { AuthContext } from "./AuthContextCore";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      let token = tokenFromUrl || localStorage.getItem("jwt_token");

      if (token) {
        if (tokenFromUrl) {
          localStorage.setItem("jwt_token", tokenFromUrl);
          localStorage.setItem("token", tokenFromUrl);
          // آدرس را تمیز می‌کنیم تا توکن در URL باقی نماند
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        try {
          const response = await apiClient.get("/auth/profile");
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Authentication failed:", error);
          localStorage.removeItem("jwt_token");
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/"; // هدایت به صفحه اصلی
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
