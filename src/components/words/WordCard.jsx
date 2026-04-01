import React from 'react';
import { Check, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 單字卡片 — 根據語言設定調整發音顯示格式
 */
const WordCard = ({ word, getCatName, isDeleteMode, isSelected, onClick }) => {
  const { langConfig } = useLanguage();

  return (
    <div
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl shadow-sm border relative transition-all ${
        isDeleteMode
          ? 'cursor-pointer hover:border-red-300'
          : 'cursor-pointer hover:border-indigo-300 hover:shadow-md'
      } ${isSelected ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-slate-100'}`}
    >
      {isDeleteMode && (
        <div
          className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300'
          }`}
        >
          {isSelected && <Check size={14} />}
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-1">
          {word.category1Id && (
            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">
              {getCatName(word.category1Id)}
            </span>
          )}
          {word.category2Id && (
            <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full">
              {getCatName(word.category2Id)}
            </span>
          )}
        </div>
        {!isDeleteMode && word.lastTestResult !== null && (
          <span
            className={word.lastTestResult ? 'text-green-500' : 'text-red-500'}
            title={word.lastTestResult ? '已學會' : '需複習'}
          >
            {word.lastTestResult ? <Check size={16} /> : <XCircle size={16} />}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold flex items-baseline gap-2">
        {word.word}
        {langConfig.formatReading(word) && (
          <span className="text-sm font-normal text-slate-400">
            {langConfig.formatReading(word)}
          </span>
        )}
      </h3>
      <div className="text-indigo-600 font-medium text-sm my-1">
        {word.pos} {word.definition}
      </div>
      <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">{word.example}</p>
    </div>
  );
};

export default WordCard;
