import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

/**
 * 封裝 API 請求 Hook
 * 自動附帶 Auth Token 和當前語言參數
 */
export const useApi = () => {
  const { user } = useAuth();
  const { currentLang } = useLanguage();

  const fetchBackend = useCallback(async (url, options = {}) => {
    if (!user || !user.token) throw new Error('尚未登入');

    // 自動附帶 lang query parameter
    const separator = url.includes('?') ? '&' : '?';
    const fullUrl = `${API_BASE}${url}${separator}lang=${currentLang}`;

    const headers = { ...options.headers, 'Authorization': `Bearer ${user.token}` };
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(fullUrl, { ...options, headers });
    if (!res.ok) {
      const errBox = await res.json().catch(() => ({}));
      throw new Error(errBox.detail || `伺服器連線異常 (${res.status})`);
    }
    return res.json();
  }, [user, currentLang]);

  const get = useCallback((url) => fetchBackend(url), [fetchBackend]);

  const post = useCallback((url, data) =>
    fetchBackend(url, { method: 'POST', body: JSON.stringify(data) }),
    [fetchBackend]
  );

  const put = useCallback((url, data) =>
    fetchBackend(url, { method: 'PUT', body: JSON.stringify(data) }),
    [fetchBackend]
  );

  return { fetchBackend, get, post, put };
};
