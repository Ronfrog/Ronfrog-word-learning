import React, { useState, useMemo } from 'react';
import { Search, Trash2 } from 'lucide-react';
import WordCard from './WordCard';

/**
 * 單字列表頁 — 搜尋、篩選、排序、批次刪除
 */
const WordList = ({ words, categories, onOpenWord, onBatchDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', order: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    category: 'all', month: 'all', difficulty: 'all', testResult: 'all',
  });

  const getCatName = (id) => categories.find((c) => c.id === id)?.name || '-';

  const toggleSelect = (id) => {
    if (isDeleteMode) {
      setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selectedIds.length} 個項目嗎？`)) return;
    try {
      await onBatchDelete(selectedIds);
      setSelectedIds([]);
      setIsDeleteMode(false);
    } catch (error) {
      alert('刪除失敗：' + error.message);
    }
  };

  const availableMonths = useMemo(() => {
    const months = new Set();
    words.forEach((w) => {
      if (w.createdAt?.seconds) {
        const d = new Date(w.createdAt.seconds * 1000);
        months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });
    return Array.from(months).sort().reverse();
  }, [words]);

  const filteredWords = useMemo(() => {
    let result = words.filter(
      (w) =>
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.definition.includes(searchTerm)
    );

    if (filterConfig.category !== 'all') {
      result = result.filter(
        (w) => w.category1Id === filterConfig.category || w.category2Id === filterConfig.category
      );
    }
    if (filterConfig.month !== 'all') {
      result = result.filter((w) => {
        if (!w.createdAt?.seconds) return false;
        const d = new Date(w.createdAt.seconds * 1000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterConfig.month;
      });
    }
    if (filterConfig.difficulty !== 'all') {
      result = result.filter((w) => w.difficulty === parseInt(filterConfig.difficulty));
    }
    if (filterConfig.testResult !== 'all') {
      result = result.filter((w) => {
        if (filterConfig.testResult === 'correct') return w.lastTestResult === true;
        if (filterConfig.testResult === 'wrong') return w.lastTestResult === false;
        if (filterConfig.testResult === 'untested') return w.lastTestResult === null;
        return true;
      });
    }

    result.sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case 'createdAt':
          valA = a.createdAt?.seconds || 0;
          valB = b.createdAt?.seconds || 0;
          break;
        case 'lastTestTime':
          valA = a.lastTestTime?.seconds || 0;
          valB = b.lastTestTime?.seconds || 0;
          break;
        case 'difficulty':
          valA = a.difficulty || 0;
          valB = b.difficulty || 0;
          break;
        case 'testError':
          valA = a.lastTestResult === false ? -1 : a.lastTestResult === true ? 1 : 0;
          valB = b.lastTestResult === false ? -1 : b.lastTestResult === true ? 1 : 0;
          break;
        case 'word':
        default:
          return sortConfig.order === 'asc'
            ? a.word.localeCompare(b.word)
            : b.word.localeCompare(a.word);
      }
      return sortConfig.order === 'asc' ? valA - valB : valB - valA;
    });
    return result;
  }, [words, searchTerm, sortConfig, filterConfig]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜尋單字..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isDeleteMode}
          />
        </div>
        {isDeleteMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsDeleteMode(false);
                setSelectedIds([]);
              }}
              className="px-4 py-3 bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.length === 0}
              className="px-4 py-3 bg-red-500 text-white rounded-2xl font-bold transition-colors disabled:opacity-50"
            >
              確認刪除 ({selectedIds.length})
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsDeleteMode(true)}
            className="px-4 py-3 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-2xl font-bold flex gap-2 items-center transition-all shadow-sm"
          >
            <Trash2 size={18} /> 批次刪除
          </button>
        )}
      </div>

      {!isDeleteMode && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 lg:grid-cols-6 gap-3 animate-in fade-in duration-300">
          <select
            className="px-3 py-2 bg-slate-50 border rounded-xl outline-none text-sm text-slate-600"
            value={filterConfig.category}
            onChange={(e) => setFilterConfig({ ...filterConfig, category: e.target.value })}
          >
            <option value="all">所有類別</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-slate-50 border rounded-xl outline-none text-sm text-slate-600"
            value={filterConfig.month}
            onChange={(e) => setFilterConfig({ ...filterConfig, month: e.target.value })}
          >
            <option value="all">所有月份</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-slate-50 border rounded-xl outline-none text-sm text-slate-600"
            value={filterConfig.difficulty}
            onChange={(e) => setFilterConfig({ ...filterConfig, difficulty: e.target.value })}
          >
            <option value="all">難度篩選</option>
            <option value="1">1 星</option>
            <option value="2">2 星</option>
            <option value="3">3 星</option>
            <option value="4">4 星</option>
            <option value="5">5 星</option>
          </select>
          <select
            className="px-3 py-2 bg-slate-50 border rounded-xl outline-none text-sm text-slate-600"
            value={filterConfig.testResult}
            onChange={(e) => setFilterConfig({ ...filterConfig, testResult: e.target.value })}
          >
            <option value="all">測驗結果</option>
            <option value="correct">答對過</option>
            <option value="wrong">曾答錯</option>
            <option value="untested">未測驗</option>
          </select>
          <select
            className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl outline-none text-sm text-indigo-700 font-medium"
            value={sortConfig.key}
            onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
          >
            <option value="createdAt">加入時間排序</option>
            <option value="lastTestTime">測驗時間排序</option>
            <option value="word">字母順序排序</option>
            <option value="difficulty">難易度排序</option>
            <option value="testError">答錯優先排序</option>
          </select>
          <button
            onClick={() =>
              setSortConfig({ ...sortConfig, order: sortConfig.order === 'asc' ? 'desc' : 'asc' })
            }
            className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-bold hover:bg-indigo-100 transition-colors shadow-sm"
          >
            {sortConfig.order === 'asc' ? '↑ 升冪' : '↓ 降冪'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => (
          <WordCard
            key={word.id}
            word={word}
            getCatName={getCatName}
            isDeleteMode={isDeleteMode}
            isSelected={selectedIds.includes(word.id)}
            onClick={() => {
              if (isDeleteMode) toggleSelect(word.id);
              else onOpenWord(word);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WordList;
