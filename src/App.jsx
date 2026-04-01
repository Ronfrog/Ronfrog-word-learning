import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useWords } from './hooks/useWords';
import { useCategories } from './hooks/useCategories';

// Layout
import LoginScreen from './components/layout/LoginScreen';
import Navbar from './components/layout/Navbar';

// Pages
import WordList from './components/words/WordList';
import WordModal from './components/words/WordModal';
import CategoryManager from './components/categories/CategoryManager';
import CategoryEditModal from './components/categories/CategoryEditModal';
import QuizSetup from './components/quiz/QuizSetup';
import QuizSession from './components/quiz/QuizSession';

const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * 主應用內容 — 需要在 AuthProvider 和 LanguageProvider 內部使用
 */
const AppContent = () => {
  const { user } = useAuth();
  const { words, loadWords, saveWord, batchDeleteWords, updateQuizResult } = useWords();
  const { categories, addCategory, updateCategory, batchDeleteCategories } = useCategories();

  const [view, setView] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  // 未登入或載入中 → 登入頁
  if (!user || !user.token) {
    return <LoginScreen />;
  }

  const changeView = (v) => {
    setView(v);
  };

  const openWordModal = (word = null) => {
    setEditingWord(word);
    setIsModalOpen(true);
  };

  const closeWordModal = () => {
    setIsModalOpen(false);
    setEditingWord(null);
  };

  const handleSaveWord = async (data, editingId) => {
    await saveWord(data, editingId);
  };

  const handleStartQuiz = (quizWords) => {
    setCurrentQuiz(quizWords);
    changeView('quiz-session');
  };

  const handleQuizExit = async (completed) => {
    setCurrentQuiz(null);
    changeView('list');
    if (completed) {
      await loadWords(); // 完整同步
    }
  };

  const handleUpdateCategory = async (id, name) => {
    await updateCategory(id, name);
    setEditingCategory(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar view={view} changeView={changeView} openWordModal={openWordModal} />

      <main className="max-w-5xl mx-auto p-4">
        {view === 'list' && (
          <WordList
            words={words}
            categories={categories}
            onOpenWord={openWordModal}
            onBatchDelete={batchDeleteWords}
          />
        )}

        {view === 'category-mgr' && (
          <CategoryManager
            categories={categories}
            onAddCategory={addCategory}
            onBatchDelete={batchDeleteCategories}
            onEditCategory={setEditingCategory}
          />
        )}

        {view === 'quiz-setup' && (
          <QuizSetup
            words={words}
            categories={categories}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {view === 'quiz-session' && currentQuiz && (
          <QuizSession
            quizWords={currentQuiz}
            onResult={updateQuizResult}
            onExit={handleQuizExit}
          />
        )}
      </main>

      {/* Word Edit / Add Modal */}
      <WordModal
        isOpen={isModalOpen}
        onClose={closeWordModal}
        onSave={handleSaveWord}
        editingWord={editingWord}
        categories={categories}
      />

      {/* Category Edit Modal */}
      <CategoryEditModal
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={handleUpdateCategory}
      />
    </div>
  );
};

/**
 * 根元件：套嵌 Providers
 */
const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;