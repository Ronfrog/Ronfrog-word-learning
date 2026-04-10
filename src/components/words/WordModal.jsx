import React, { useState, useEffect } from 'react';
import { X, Brain, RefreshCw, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApi } from '../../hooks/useApi';

const formatDate = (ts) =>
  ts && ts.seconds ? new Date(ts.seconds * 1000).toLocaleString() : '無紀錄';

/**
 * 新增/編輯單字 Modal — 根據 langConfig.fields 動態渲染欄位
 */
const WordModal = ({ isOpen, onClose, onSave, editingWord, categories }) => {
  const { langConfig } = useLanguage();
  const { fetchBackend } = useApi();
  const [aiLoading, setAiLoading] = useState(false);

  const isEditing = !!editingWord;

  const defaultForm = {
    word: '', phonetic: '', pos: 'n.', definition: '', example: '',
    category1Id: '', category2Id: '', difficulty: 1, notes: '',
    createdAt: null, lastTestTime: null, lastTestResult: null,
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (!isOpen) return;
    if (editingWord) {
      setFormData({
        word: editingWord.word || '',
        phonetic: editingWord.phonetic || '',
        pos: editingWord.pos || 'n.',
        definition: editingWord.definition || '',
        example: editingWord.example || '',
        category1Id: editingWord.category1Id || '',
        category2Id: editingWord.category2Id || '',
        difficulty: editingWord.difficulty || 1,
        notes: editingWord.notes || '',
        createdAt: editingWord.createdAt,
        lastTestTime: editingWord.lastTestTime,
        lastTestResult: editingWord.lastTestResult,
      });
    } else {
      setFormData(defaultForm);
    }
  }, [isOpen, editingWord]);

  const generateAIContent = async () => {
    if (!formData.word) return;
    setAiLoading(true);
    const catNames = categories.map((c) => c.name).join(', ');
    try {
      const result = await fetchBackend('/generate', {
        method: 'POST',
        body: JSON.stringify({ word: formData.word, categories: catNames }),
      });
      const findCatId = (name) => categories.find((c) => c.name === name)?.id || '';
      setFormData((prev) => ({
        ...prev,
        phonetic: result.phonetic,
        pos: result.pos,
        definition: result.definition,
        example: result.example,
        category1Id: findCatId(result.cat1),
        category2Id: findCatId(result.cat2),
      }));
    } catch (err) {
      console.error(err);
      alert('AI 分析失敗：' + err.message + '\n\n請確保後端伺服器 (8000) 正在運行並且金鑰設定正確。');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { createdAt, lastTestTime, lastTestResult, ...saveData } = formData;
    try {
      await onSave(saveData, isEditing ? editingWord.id : null);
      onClose();
    } catch (err) {
      alert('儲存失敗:' + err.message);
    }
  };

  if (!isOpen) return null;

  const { fields } = langConfig;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold">{isEditing ? '編輯單字內容' : '新增單字詳情'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {isEditing && (
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600 border border-slate-200 shadow-inner">
              <div className="flex justify-between">
                <span>建立時間：</span>
                <span className="font-medium text-slate-800">{formatDate(formData.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>最新測驗：</span>
                <span className="font-medium text-slate-800">{formatDate(formData.lastTestTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>最新結果：</span>
                <span
                  className={`font-bold ${
                    formData.lastTestResult === null
                      ? 'text-slate-400'
                      : formData.lastTestResult
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}
                >
                  {formData.lastTestResult === null
                    ? '尚未測驗'
                    : formData.lastTestResult
                    ? '認識 (Pass)'
                    : '不認識 (Fail)'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              required
              placeholder={fields.word.placeholder}
              className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={generateAIContent}
              className="bg-indigo-600 text-white px-6 rounded-2xl flex items-center gap-2 disabled:opacity-50 transition-all hover:bg-indigo-700 shadow-sm"
            >
              {aiLoading ? <RefreshCw className="animate-spin" size={18} /> : <Brain size={18} />} AI 分析
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder={fields.phonetic.placeholder}
              className="px-4 py-3 bg-slate-100 rounded-2xl outline-none"
              value={formData.phonetic}
              onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
            />
            <input
              placeholder={fields.pos.placeholder}
              className="px-4 py-3 bg-slate-100 rounded-2xl outline-none"
              value={formData.pos}
              onChange={(e) => setFormData({ ...formData, pos: e.target.value })}
            />
          </div>

          <textarea
            placeholder={fields.definition.placeholder}
            className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none min-h-[80px]"
            value={formData.definition}
            onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
          />
          <textarea
            placeholder={fields.example.placeholder}
            rows="2"
            className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none min-h-[80px]"
            value={formData.example}
            onChange={(e) => setFormData({ ...formData, example: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              className="px-4 py-3 bg-slate-100 rounded-2xl outline-none"
              value={formData.category1Id}
              onChange={(e) => setFormData({ ...formData, category1Id: e.target.value })}
            >
              <option value="">對應類別 1</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-3 bg-slate-100 rounded-2xl outline-none"
              value={formData.category2Id}
              onChange={(e) => setFormData({ ...formData, category2Id: e.target.value })}
            >
              <option value="">對應類別 2 (可選)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">難度星級：</span>
            <input
              type="range"
              min="1"
              max="5"
              className="flex-1 accent-indigo-600"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
            />
            <span className="font-bold text-indigo-600 w-12 text-center">{formData.difficulty} 星</span>
          </div>

          <textarea
            placeholder="自訂備註 (選填)"
            className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Save size={20} /> {isEditing ? '儲存變更' : '儲存到我的庫'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WordModal;
