import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 類別資料管理 Hook
 * 封裝類別的狀態和所有 CRUD 操作
 */
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const { currentLang } = useLanguage();
  const { fetchBackend } = useApi();

  const loadCategories = useCallback(async () => {
    if (!user?.token) return;
    try {
      const data = await fetchBackend('/categories');
      setCategories(data);
    } catch (err) {
      console.error('載入類別失敗', err);
      throw err;
    }
  }, [user, fetchBackend]);

  const addCategory = useCallback(async (name) => {
    if (!user?.token || !name) return;
    await fetchBackend('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await loadCategories();
  }, [user, fetchBackend, loadCategories]);

  const updateCategory = useCallback(async (id, name) => {
    if (!user?.token || !name) return;
    await fetchBackend(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    await loadCategories();
  }, [user, fetchBackend, loadCategories]);

  const batchDeleteCategories = useCallback(async (ids) => {
    if (!user?.token || ids.length === 0) return;
    await fetchBackend('/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ type: 'categories', ids }),
    });
    await loadCategories();
  }, [user, fetchBackend, loadCategories]);

  // 語言改變或用戶變更時自動重新載入
  useEffect(() => {
    if (user?.token) {
      loadCategories();
    } else {
      setCategories([]);
    }
  }, [user, currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  return { categories, loadCategories, addCategory, updateCategory, batchDeleteCategories };
};
