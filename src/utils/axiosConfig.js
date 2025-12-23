// src/utils/axiosConfig.js
import axios from 'axios';

// 1️⃣ Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://techm4-collab-backend.onrender.com/api',
  // withCredentials: true, // Uncomment ONLY if using cookies-based auth
});

// 2️⃣ Attach token to every request (if available)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3️⃣ Handle global auth errors (e.g. token expired or missing)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 4️⃣ Export the Axios instance
export default api;
