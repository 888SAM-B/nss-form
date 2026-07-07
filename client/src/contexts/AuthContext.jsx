import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nss_admin_token') || null);
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nss_admin_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (userData, authToken) => {
    setToken(authToken);
    setAdmin(userData);
    localStorage.setItem('nss_admin_token', authToken);
    localStorage.setItem('nss_admin_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('nss_admin_token');
    localStorage.removeItem('nss_admin_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAdmin: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
