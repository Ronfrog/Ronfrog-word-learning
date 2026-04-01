import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 語言切換器 — Segmented Control 風格
 * 自動從 allLanguages 動態渲染所有支援語言
 */
const LanguageSwitcher = () => {
  const { currentLang, switchLanguage, allLanguages } = useLanguage();

  return (
    <div className="flex bg-slate-100 rounded-xl p-1 gap-0.5">
      {Object.values(allLanguages).map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            currentLang === lang.code
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          title={lang.name}
        >
          <span className="mr-1">{lang.icon}</span>
          <span className="hidden sm:inline">{lang.displayName}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
