import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  // undefined = 載入中, null = 未登入, object = 已登入
  const [user, setUser] = useState(undefined);

  // 啟動時從 localStorage 還原登入狀態
  useEffect(() => {
    const savedToken = localStorage.getItem('google_jwt');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('google_jwt');
          setUser(null);
        } else {
          setUser({ token: savedToken, ...payload });
        }
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  const handleLoginSuccess = useCallback((credentialResponse) => {
    const token = credentialResponse.credential;
    localStorage.setItem('google_jwt', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ token, ...payload });
    } catch (e) {
      alert('無效的登入憑證');
    }
  }, []);

  const handleLogout = useCallback(() => {
    googleLogout();
    localStorage.removeItem('google_jwt');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, handleLoginSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
