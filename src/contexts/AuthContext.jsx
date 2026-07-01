import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleLogout } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// 等待 Google Identity Services 腳本載入完畢（最多等 timeout ms）
const waitForGoogleScript = (timeout = 3000) =>
  new Promise((resolve) => {
    if (window.google?.accounts?.id) return resolve(true);
    const start = Date.now();
    const check = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        clearInterval(check);
        resolve(false);
      }
    }, 100);
  });

export const AuthProvider = ({ children }) => {
  // undefined = 載入中, null = 未登入, object = 已登入
  const [user, setUser] = useState(undefined);

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

  // 嘗試無聲重新認證：利用瀏覽器內既有的 Google session（通常有效數週）
  // 成功 → 取得新 token，使用者不需做任何動作
  // 失敗 → 回傳 false，由呼叫端決定是否顯示登入頁
  const trySilentRefresh = useCallback(async () => {
    const ready = await waitForGoogleScript();
    if (!ready || !GOOGLE_CLIENT_ID) return false;

    return new Promise((resolve) => {
      let settled = false;
      const settle = (success) => {
        if (settled) return;
        settled = true;
        resolve(success);
      };

      setTimeout(() => settle(false), 4000); // 4 秒後放棄

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            handleLoginSuccess({ credential: response.credential });
            settle(true);
          } else {
            settle(false);
          }
        },
        auto_select: true,
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
          settle(false);
        }
      });
    });
  }, [handleLoginSuccess]);

  // 啟動時從 localStorage 還原登入狀態
  useEffect(() => {
    const savedToken = localStorage.getItem('google_jwt');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          // Token 已過期 → 先嘗試靜默重新認證（維持 loading 狀態顯示轉圈）
          localStorage.removeItem('google_jwt');
          trySilentRefresh().then((refreshed) => {
            if (!refreshed) setUser(null); // 靜默失敗才顯示登入頁
          });
        } else {
          setUser({ token: savedToken, ...payload });
        }
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [trySilentRefresh]);

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
