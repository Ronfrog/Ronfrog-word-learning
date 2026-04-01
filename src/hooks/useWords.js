import { useState, useCallback, useEffect } from 'react';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 單字資料管理 Hook
 * 封裝單字的狀態和所有 CRUD 操作
 */
export const useWords = () => {
  const [words, setWords] = useState([]);
  const { user } = useAuth();
  const { currentLang } = useLanguage();
  const { fetchBackend } = useApi();

  const loadWords = useCallback(async () => {
    if (!user?.token) return;
    try {
      const data = await fetchBackend('/words');
      setWords(data);
    } catch (err) {
      console.error('載入單字失敗', err);
      throw err;
    }
  }, [user, fetchBackend]);

  const saveWord = useCallback(async (data, editingId = null) => {
    if (!user?.token) return;
    if (editingId) {
      await fetchBackend(`/words/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      await fetchBackend('/words', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
    await loadWords();
  }, [user, fetchBackend, loadWords]);

  const batchDeleteWords = useCallback(async (ids) => {
    if (!user?.token || ids.length === 0) return;
    await fetchBackend('/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ type: 'vocabulary', ids }),
    });
    await loadWords();
  }, [user, fetchBackend, loadWords]);

  const updateQuizResult = useCallback(async (wordId, isCorrect) => {
    if (!user?.token) return;
    const updatePromise = fetchBackend(`/words/${wordId}/quiz`, {
      method: 'PUT',
      body: JSON.stringify({ isCorrect }),
    }).catch(e => console.error('Quiz record failed', e));

    // Optimistic local update
    setWords(prev =>
      prev.map(w =>
        w.id === wordId
          ? { ...w, lastTestResult: isCorrect, lastTestTime: { seconds: Math.floor(Date.now() / 1000) } }
          : w
      )
    );

    return updatePromise;
  }, [user, fetchBackend]);

  // 語言改變或用戶變更時自動重新載入
  useEffect(() => {
    if (user?.token) {
      loadWords();
    } else {
      setWords([]);
    }
  }, [user, currentLang]); // eslint-disable-line react-hooks/exhaustive-deps

  return { words, setWords, loadWords, saveWord, batchDeleteWords, updateQuizResult };
};
