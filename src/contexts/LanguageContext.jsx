import React, { createContext, useContext, useState, useCallback } from 'react';
import { LANGUAGES, DEFAULT_LANG } from '../config/languages';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('vocab_lang') || DEFAULT_LANG;
  });

  const langConfig = LANGUAGES[currentLang] || LANGUAGES[DEFAULT_LANG];

  const switchLanguage = useCallback((lang) => {
    if (LANGUAGES[lang]) {
      setCurrentLang(lang);
      localStorage.setItem('vocab_lang', lang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLang,
      langConfig,
      switchLanguage,
      allLanguages: LANGUAGES,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
