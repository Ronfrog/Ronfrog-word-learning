import React from 'react';
import {
  BookOpen, Layers, PlayCircle, Plus, LogOut, UserCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Navbar = ({ view, changeView, openWordModal }) => {
  const { user, handleLogout } = useAuth();

  return (
    <nav className="bg-white border-b sticky top-0 z-20 p-4 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeView('list')}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={20} /></div>
          <h1 className="font-bold text-lg hidden sm:block">智慧單字庫</h1>
        </div>
        <div className="flex gap-2 items-center">
          {/* 語言切換器 */}
          <LanguageSwitcher />

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={() => changeView('category-mgr')}
            className={`p-2 rounded-lg ${view === 'category-mgr' ? 'bg-slate-100' : 'hover:bg-slate-100 text-slate-500'}`}
            title="類別"
          >
            <Layers size={20} />
          </button>
          <button
            onClick={() => changeView('list')}
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-slate-100' : 'hover:bg-slate-100 text-slate-500'}`}
            title="單字庫"
          >
            <BookOpen size={20} />
          </button>
          <button
            onClick={() => changeView('quiz-setup')}
            className="flex items-center gap-1 sm:gap-2 bg-indigo-50 text-indigo-700 px-2 sm:px-4 py-2 rounded-xl font-medium"
          >
            <PlayCircle size={20} /> <span className="hidden sm:inline">測驗</span>
          </button>
          <button
            onClick={() => openWordModal()}
            className="bg-indigo-600 text-white px-2 sm:px-4 py-2 rounded-xl font-medium shadow-md flex items-center gap-1"
          >
            <Plus size={20} /> <span className="hidden sm:inline">新增</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <div className="flex items-center gap-2">
            {(user.picture || user.photoURL) ? (
              <img src={user.picture || user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="avatar" />
            ) : (
              <UserCircle size={24} className="text-slate-400" />
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
              title="登出"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
