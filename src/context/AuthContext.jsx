import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axiosConfig';

export const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Persist user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Auto-login on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null);
          localStorage.removeItem('token');
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔄 Attempting login for:', email);
      
      const response = await api.post('/auth/login', { email, password });
      
      console.log('✅ Login successful:', response.data);
      
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(userData);
      
      console.log('👤 User logged in:', userData.name);
      
      return userData;
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data?.error || 'Login failed');
      } else if (error.request) {
        // Network error
        throw new Error('Network error - please check your connection');
      } else {
        // Other error
        throw new Error(error.message || 'Login failed');
      }
    }
  };

  const register = async (name, email, password, role = 'member') => {
    try {
      console.log('🔄 Attempting registration for:', email);
      
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      
      console.log('✅ Registration successful:', response.data);
      
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user data
      setUser(userData);
      
      console.log('👤 User registered:', userData.name);
      
      return userData;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data?.error || 'Registration failed');
      } else if (error.request) {
        // Network error
        throw new Error('Network error - please check your connection');
      } else {
        // Other error
        throw new Error(error.message || 'Registration failed');
      }
    }
  };

  const logout = () => {
    console.log('👋 Logging out user:', user?.name);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      login, 
      register,
      logout, 
      updateUser,
      isAuthenticated: !!user,
      authLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
