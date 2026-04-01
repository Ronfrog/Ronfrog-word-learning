import React, { useState } from 'react';
import { Layers, Trash2, Check } from 'lucide-react';

/**
 * 類別管理頁面
 */
const CategoryManager = ({ categories, onAddCategory, onBatchDelete, onEditCategory }) => {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

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

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-sm border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex gap-2 items-center">
          <Layers /> 類別管理
        </h2>
        {isDeleteMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsDeleteMode(false);
                setSelectedIds([]);
              }}
              className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold"
            >
              取消
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.length === 0}
              className="px-3 py-1 bg-red-500 text-white rounded-lg disabled:opacity-50 text-sm font-bold"
            >
              刪除 ({selectedIds.length})
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsDeleteMode(true)}
            className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm"
          >
            <Trash2 size={16} /> 批次刪除
          </button>
        )}
      </div>

      {!isDeleteMode && (
        <div className="flex gap-2 mb-6">
          <input
            id="newCatInput"
            type="text"
            placeholder="新類別名稱"
            className="flex-1 px-4 py-2 bg-slate-100 rounded-xl outline-none"
          />
          <button
            onClick={() => {
              const el = document.getElementById('newCatInput');
              onAddCategory(el.value);
              el.value = '';
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium"
          >
            新增
          </button>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <div
              onClick={() => {
                if (isDeleteMode) toggleSelect(cat.id);
                else onEditCategory(cat);
              }}
              key={cat.id}
              className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                isDeleteMode
                  ? 'cursor-pointer hover:border-red-200'
                  : 'cursor-pointer hover:border-indigo-200 hover:bg-indigo-50 border-transparent bg-slate-50'
              } ${isSelected ? 'bg-red-50 border-red-300' : ''}`}
            >
              <span className={isSelected ? 'text-red-700 font-medium' : ''}>{cat.name}</span>
              {isDeleteMode && (
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'
                  }`}
                >
                  {isSelected && <Check size={12} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryManager;
