import React from 'react';
import { X } from 'lucide-react';

const formatDate = (ts) =>
  ts && ts.seconds ? new Date(ts.seconds * 1000).toLocaleString() : '無紀錄';

/**
 * 類別編輯 Modal
 */
const CategoryEditModal = ({ category, onClose, onSave }) => {
  if (!category) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">編輯類別設定</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-500 mb-1 block pl-2">類別名稱</label>
            <input
              id="editCatName"
              defaultValue={category.name}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 space-y-3 border shadow-inner">
            <div className="flex justify-between border-b pb-2">
              <span>建立時間</span>
              <span className="font-medium text-slate-700">{formatDate(category.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>最後更新</span>
              <span className="font-medium text-slate-700">{formatDate(category.updatedAt)}</span>
            </div>
          </div>
          <button
            onClick={() => onSave(category.id, document.getElementById('editCatName').value)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-4 rounded-2xl font-bold flex justify-center mt-4 shadow-md"
          >
            確認更改
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditModal;
