// src/apiClient.js
import axios from "axios";

// این آدرس را با آدرس بک‌اند پروژه چت خودتان جایگزین کنید
const API_BASE_URL = "https://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor برای اضافه کردن توکن به هدر همه درخواست‌ها
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor برای مدیریت خطای 401 (عدم احراز هویت)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("jwt_token");
      // ریدایرکت به صفحه لاگین روبیک
      window.location.href = `http://192.168.1.10:925/Modules/login.aspx?fromReq=%7e%2fModules%2fRedirectToChat.aspx%3f`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
