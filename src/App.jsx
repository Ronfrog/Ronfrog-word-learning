import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  Plus, Search, Brain, Trash2, Download,
  BookOpen, Save, X, RefreshCw, Check, XCircle,
  Settings, Layers, PlayCircle, ChevronRight, Info,
  LogOut, UserCircle
} from 'lucide-react';

const defaultConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let firebaseConfig = defaultConfig;
if (window.FIREBASE_CONFIG && Object.keys(window.FIREBASE_CONFIG).length > 0) {
  firebaseConfig = window.FIREBASE_CONFIG; // 從 Python 後端動態注入的設定
} else if (import.meta.env.VITE_FIREBASE_CONFIG_JSON) {
  try { firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG_JSON); } catch (e) { console.error(e); }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

const formatDate = (ts) => ts && ts.seconds ? new Date(ts.seconds * 1000).toLocaleString() : '無紀錄';

const App = () => {
  const [user, setUser] = useState(undefined);
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('list'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing Modals State
  const [editingWordId, setEditingWordId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Batch delete states
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [formData, setFormData] = useState({
    word: '', phonetic: '', pos: 'n.', definition: '', example: '',
    category1Id: '', category2Id: '', difficulty: 1, notes: '',
    createdAt: null, lastTestTime: null, lastTestResult: null
  });

  const [quizConfig, setQuizConfig] = useState({
    count: 10, catId: '全部', difficulty: '全部', status: '全部'
  });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // --------------------------------------------------------------------------
  // API Fetch Utility (Injects Firebase Bearer Token securely to backend)
  // --------------------------------------------------------------------------
  const fetchBackend = async (url, options = {}) => {
    if (!user) throw new Error("尚未登入");
    const token = await user.getIdToken();
    const headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (!res.ok) {
        const errBox = await res.json().catch(()=>({}));
        throw new Error(errBox.detail || `伺服器連線異常 (${res.status})`);
    }
    return res.json();
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
        const [wordsData, catsData] = await Promise.all([
            fetchBackend('/words'),
            fetchBackend('/categories')
        ]);
        setWords(wordsData);
        setCategories(catsData);
    } catch (err) {
        console.error("無法載入資料，請確認後端是否已經啟動", err);
    }
  }, [user]);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (user) loadData();
    else { setWords([]); setCategories([]); }
  }, [user, loadData]);

  // --------------------------------------------------------------------------

  const changeView = (v) => {
    setView(v);
    setIsDeleteMode(false);
    setSelectedIds([]);
  };

  const handleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (err) { alert("登入失敗：" + err.message); }
  };

  const openWordModal = (word = null) => {
    if (word) {
      setEditingWordId(word.id);
      setFormData({
        word: word.word || '', phonetic: word.phonetic || '', pos: word.pos || 'n.',
        definition: word.definition || '', example: word.example || '',
        category1Id: word.category1Id || '', category2Id: word.category2Id || '',
        difficulty: word.difficulty || 1, notes: word.notes || '',
        createdAt: word.createdAt, lastTestTime: word.lastTestTime, lastTestResult: word.lastTestResult
      });
    } else {
      setEditingWordId(null);
      setFormData({ word: '', phonetic: '', pos: 'n.', definition: '', example: '', category1Id: '', category2Id: '', difficulty: 1, notes: '', createdAt: null, lastTestTime: null, lastTestResult: null });
    }
    setIsModalOpen(true);
  };

  const closeWordModal = () => {
    setIsModalOpen(false);
    setEditingWordId(null);
  };

  const generateAIContent = async () => {
    if (!formData.word) return;
    setAiLoading(true);
    const catNames = categories.map(c => c.name).join(', ');
    try {
      // API call routed safely through backend
      const result = await fetchBackend('/generate', {
          method: 'POST',
          body: JSON.stringify({ word: formData.word, categories: catNames })
      });
      const findCatId = (name) => categories.find(c => c.name === name)?.id || '';
      setFormData(prev => ({
        ...prev, phonetic: result.phonetic, pos: result.pos, definition: result.definition,
        example: result.example, category1Id: findCatId(result.cat1), category2Id: findCatId(result.cat2)
      }));
    } catch (err) { 
      console.error(err); 
      alert("AI 分析失敗：" + err.message + "\n\n請確保後端伺服器 (8000) 正在運行並且金鑰設定正確。");
    } finally { setAiLoading(false); }
  };

  const addCategory = async (name) => {
    if (!name || !user) return;
    try { 
        await fetchBackend('/categories', { method: 'POST', body: JSON.stringify({ name }) });
        await loadData();
    } catch (e) { alert("新增類別失敗:" + e.message); }
  };

  const updateCategory = async (id, newName) => {
    if (!user || !newName) return;
    try {
        await fetchBackend(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: newName }) });
        setEditingCategory(null);
        await loadData();
    } catch (e) { alert("更新類別失敗:" + e.message); }
  }

  const handleSaveWord = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { createdAt, lastTestTime, lastTestResult, ...saveData } = formData;
      if (editingWordId) {
        await fetchBackend(`/words/${editingWordId}`, { method: 'PUT', body: JSON.stringify(saveData) });
      } else {
        await fetchBackend('/words', { method: 'POST', body: JSON.stringify(saveData) });
      }
      closeWordModal();
      await loadData();
    } catch (e) { alert("儲存失敗:" + e.message); }
  };

  const handleBatchDelete = async (type) => {
    if (!user || selectedIds.length === 0) return;
    if (!window.confirm(`確定要刪除選取的 ${selectedIds.length} 個項目嗎？`)) return;
    try {
        await fetchBackend('/batch-delete', { method: 'POST', body: JSON.stringify({ type, ids: selectedIds }) });
        setSelectedIds([]);
        setIsDeleteMode(false);
        await loadData();
    } catch (error) {
        alert("刪除失敗：" + error.message);
    }
  };

  const toggleSelect = (id) => {
    if (isDeleteMode) setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  };

  const startQuiz = () => {
    let pool = [...words];
    if (quizConfig.catId !== '全部') pool = pool.filter(w => w.category1Id === quizConfig.catId || w.category2Id === quizConfig.catId);
    if (quizConfig.difficulty !== '全部') pool = pool.filter(w => w.difficulty === parseInt(quizConfig.difficulty));
    if (quizConfig.status === '未測驗') pool = pool.filter(w => w.lastTestTime === null);
    if (quizConfig.status === '錯誤過') pool = pool.filter(w => w.lastTestResult === false);

    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, quizConfig.count);
    if (shuffled.length === 0) return alert("找不到符合條件的單字進行測驗");

    setCurrentQuiz(shuffled);
    setQuizIndex(0);
    setShowAnswer(false);
    changeView('quiz-session');
  };

  const handleQuizResult = async (isCorrect) => {
    const wordId = currentQuiz[quizIndex].id;
    
    // 先送出更新請求並取得 Promise
    const updatePromise = fetchBackend(`/words/${wordId}/quiz`, { method: 'PUT', body: JSON.stringify({ isCorrect }) })
        .catch(e => console.error("Quiz record failed", e));
        
    // Optimistic local update (畫面先即時更新)
    setWords(prev => prev.map(w => w.id === wordId ? { ...w, lastTestResult: isCorrect, lastTestTime: { seconds: Math.floor(Date.now() / 1000) } } : w));

    if (quizIndex + 1 < currentQuiz.length) {
      setQuizIndex(p => p+1); setShowAnswer(false);
    } else {
      changeView('list'); setCurrentQuiz(null);
      await updatePromise; // 確保最後一題確認寫入 Firebase 後，再進行整包同步
      await loadData(); // fully sync after quiz finishes
    }
  };

  const getCatName = id => categories.find(c => c.id === id)?.name || '-';

  const filteredWords = useMemo(() => {
    return words.filter(w =>
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.definition.includes(searchTerm)
    ).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [words, searchTerm]);


  if (user === undefined) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><RefreshCw className="animate-spin text-indigo-600" size={32}/></div>;
  if (user === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-sm w-full space-y-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">智能單字庫</h1>
            <p className="text-slate-500">專屬你的 AI 擴充詞彙助理</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 border border-slate-800 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <svg className="w-5 h-5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <nav className="bg-white border-b sticky top-0 z-20 p-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => changeView('list')}>
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><BookOpen size={20} /></div>
            <h1 className="font-bold text-lg hidden sm:block">智能單字庫</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => changeView('category-mgr')} className={`p-2 rounded-lg ${view==='category-mgr'?'bg-slate-100':'hover:bg-slate-100 text-slate-500'}`} title="類別"><Layers size={20} /></button>
            <button onClick={() => changeView('list')} className={`p-2 rounded-lg ${view==='list'?'bg-slate-100':'hover:bg-slate-100 text-slate-500'}`} title="單字庫"><BookOpen size={20} /></button>
            <button onClick={() => changeView('quiz-setup')} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium"><PlayCircle size={20} /> 測驗</button>
            <button onClick={() => openWordModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium shadow-md flex items-center gap-1"><Plus size={20} /> 新增</button>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex items-center gap-2">
               {user.photoURL ? <img src={user.photoURL} className="w-8 h-8 rounded-full border border-slate-200" alt="avatar"/> : <UserCircle size={24} className="text-slate-400" />}
               <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="登出"><LogOut size={20}/></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4">
        {view === 'list' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text" placeholder="搜尋單字..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isDeleteMode}
                />
              </div>
              {isDeleteMode ? (
                <div className="flex gap-2">
                  <button onClick={() => {setIsDeleteMode(false); setSelectedIds([])}} className="px-4 py-3 bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors">取消</button>
                  <button onClick={() => handleBatchDelete('vocabulary')} disabled={selectedIds.length===0} className="px-4 py-3 bg-red-500 text-white rounded-2xl font-bold transition-colors disabled:opacity-50">確認刪除 ({selectedIds.length})</button>
                </div>
              ) : (
                <button onClick={() => setIsDeleteMode(true)} className="px-4 py-3 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-2xl font-bold flex gap-2 items-center transition-all shadow-sm">
                  <Trash2 size={18}/> 批次刪除
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWords.map(word => {
                  const isSelected = selectedIds.includes(word.id);
                  return (
                    <div 
                        onClick={() => {
                            if (isDeleteMode) toggleSelect(word.id);
                            else openWordModal(word);
                        }} 
                        key={word.id} 
                        className={`bg-white p-5 rounded-2xl shadow-sm border relative transition-all ${isDeleteMode ? 'cursor-pointer hover:border-red-300' : 'cursor-pointer hover:border-indigo-300 hover:shadow-md'} ${isSelected ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-slate-100'}`}
                    >
                        {isDeleteMode && (
                            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-300'}`}>
                                {isSelected && <Check size={14}/>}
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1">
                            {word.category1Id && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">{getCatName(word.category1Id)}</span>}
                            {word.category2Id && <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full">{getCatName(word.category2Id)}</span>}
                          </div>
                          {!isDeleteMode && word.lastTestResult !== null && (
                            <span className={word.lastTestResult ? "text-green-500" : "text-red-500"} title={word.lastTestResult ? '已學會' : '需複習'}>
                              {word.lastTestResult ? <Check size={16} /> : <XCircle size={16} />}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold flex items-baseline gap-2">
                          {word.word}
                          <span className="text-sm font-normal text-slate-400">/{word.phonetic}/</span>
                        </h3>
                        <div className="text-indigo-600 font-medium text-sm my-1">{word.pos} {word.definition}</div>
                        <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">{word.example}</p>
                    </div>
                  );
              })}
            </div>
          </div>
        )}

        {view === 'category-mgr' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-sm border">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex gap-2 items-center"><Layers/> 類別管理</h2>
                {isDeleteMode ? (
                    <div className="flex gap-2">
                        <button onClick={()=>{setIsDeleteMode(false); setSelectedIds([])}} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-sm font-bold">取消</button>
                        <button onClick={() => handleBatchDelete('categories')} disabled={selectedIds.length===0} className="px-3 py-1 bg-red-500 text-white rounded-lg disabled:opacity-50 text-sm font-bold">刪除 ({selectedIds.length})</button>
                    </div>
                ) : (
                    <button onClick={()=>setIsDeleteMode(true)} className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm"><Trash2 size={16}/> 批次刪除</button>
                )}
            </div>

            {!isDeleteMode && (
                <div className="flex gap-2 mb-6">
                    <input id="newCatInput" type="text" placeholder="新類別名稱" className="flex-1 px-4 py-2 bg-slate-100 rounded-xl outline-none" />
                    <button onClick={()=>{
                        const el = document.getElementById('newCatInput');
                        addCategory(el.value);
                        el.value = '';
                    }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium">新增</button>
                </div>
            )}
            
            <div className="space-y-2">
                {categories.map(cat => {
                    const isSelected = selectedIds.includes(cat.id);
                    return (
                        <div 
                            onClick={() => {
                                if (isDeleteMode) toggleSelect(cat.id);
                                else setEditingCategory(cat);
                            }} 
                            key={cat.id} 
                            className={`flex justify-between items-center p-4 rounded-xl border transition-all ${isDeleteMode ? 'cursor-pointer hover:border-red-200' : 'cursor-pointer hover:border-indigo-200 hover:bg-indigo-50 border-transparent bg-slate-50'} ${isSelected ? 'bg-red-50 border-red-300' : ''}`}
                        >
                            <span className={isSelected ? 'text-red-700 font-medium' : ''}>{cat.name}</span>
                            {isDeleteMode && (
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}`}>
                                    {isSelected && <Check size={12}/>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        )}

        {view === 'quiz-setup' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <h2 className="text-2xl font-bold text-center">測驗設定</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-600">挑選類別</span>
                <select className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none" value={quizConfig.catId} onChange={(e) => setQuizConfig({ ...quizConfig, catId: e.target.value })}>
                  <option value="全部">全部類別</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">難度篩選</span>
                <select className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none" value={quizConfig.difficulty} onChange={(e) => setQuizConfig({ ...quizConfig, difficulty: e.target.value })}>
                  <option value="全部">全部難度</option>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 星</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">測驗狀態</span>
                <select className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none" value={quizConfig.status} onChange={(e) => setQuizConfig({ ...quizConfig, status: e.target.value })}>
                  <option value="全部">不限</option>
                  <option value="未測驗">尚未測驗</option>
                  <option value="錯誤過">曾經錯誤</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">題數</span>
                <input type="number" className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none" value={quizConfig.count} onChange={(e) => setQuizConfig({ ...quizConfig, count: parseInt(e.target.value) })} />
              </label>
            </div>
            <button onClick={startQuiz} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex justify-center"><PlayCircle/>&nbsp;開始測驗</button>
          </div>
        )}

        {view === 'quiz-session' && currentQuiz && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex justify-between items-center px-4 text-slate-400">
              <span>進度：{quizIndex + 1} / {currentQuiz.length}</span>
              <button onClick={() => changeView('list')} className="hover:text-slate-600"><X /></button>
            </div>

            <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-100 text-center space-y-8 min-h-[400px] flex flex-col justify-center animate-in zoom-in duration-300 relative">
              <div>
                <h2 className="text-5xl font-black text-slate-800 tracking-tight">{currentQuiz[quizIndex].word}</h2>
              </div>

              {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)} className="mx-auto bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all shadow-md">
                  查看答案
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="text-2xl text-indigo-600 font-bold">
                    <span className="text-slate-400 font-normal mr-2">/{currentQuiz[quizIndex].phonetic}/</span>
                    {currentQuiz[quizIndex].pos} {currentQuiz[quizIndex].definition}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl text-slate-600 italic leading-relaxed">
                    {currentQuiz[quizIndex].example}
                  </div>
                  {currentQuiz[quizIndex].notes && (
                    <div className="text-sm text-slate-400 border-t pt-4">備註：{currentQuiz[quizIndex].notes}</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => handleQuizResult(false)}
                className="bg-white text-red-500 border-2 border-red-100 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-red-50 transition-all"
              >
                <XCircle size={32} />
                <span className="font-bold">不認識</span>
              </button>
              <button
                onClick={() => handleQuizResult(true)}
                className="bg-white text-green-500 border-2 border-green-100 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-green-50 transition-all"
              >
                <Check size={32} />
                <span className="font-bold">認識</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Word Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">{editingWordId ? '編輯單字內容' : '新增單字詳情'}</h2>
              <button onClick={closeWordModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveWord} className="p-6 overflow-y-auto space-y-6">
              {editingWordId && (
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-600 border border-slate-200 shadow-inner">
                    <div className="flex justify-between"><span>建立時間：</span><span className="font-medium text-slate-800">{formatDate(formData.createdAt)}</span></div>
                    <div className="flex justify-between"><span>最新測驗：</span><span className="font-medium text-slate-800">{formatDate(formData.lastTestTime)}</span></div>
                    <div className="flex justify-between">
                        <span>最新結果：</span>
                        <span className={`font-bold ${formData.lastTestResult===null ? 'text-slate-400' : (formData.lastTestResult ? 'text-green-600' : 'text-red-500')}`}>
                            {formData.lastTestResult === null ? '尚未測驗' : (formData.lastTestResult ? '認識 (Pass)' : '不認識 (Fail)')}
                        </span>
                    </div>
                </div>
              )}

              <div className="flex gap-2">
                <input required placeholder="英文單字" className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.word} onChange={(e) => setFormData({ ...formData, word: e.target.value })} />
                <button type="button" disabled={aiLoading} onClick={generateAIContent} className="bg-indigo-600 text-white px-6 rounded-2xl flex items-center gap-2 disabled:opacity-50 transition-all hover:bg-indigo-700 shadow-sm">
                  {aiLoading ? <RefreshCw className="animate-spin" size={18} /> : <Brain size={18} />} AI 分析
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input placeholder="音標 (Phonetic)" className="px-4 py-3 bg-slate-100 rounded-2xl outline-none" value={formData.phonetic} onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })} />
                <input placeholder="詞性 (n., v., adj...)" className="px-4 py-3 bg-slate-100 rounded-2xl outline-none" value={formData.pos} onChange={(e) => setFormData({ ...formData, pos: e.target.value })} />
              </div>

              <textarea placeholder="中文釋義" className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none min-h-[80px]" value={formData.definition} onChange={(e) => setFormData({ ...formData, definition: e.target.value })} />
              <textarea placeholder="英文例句與翻譯" rows="2" className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none min-h-[80px]" value={formData.example} onChange={(e) => setFormData({ ...formData, example: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <select className="px-4 py-3 bg-slate-100 rounded-2xl outline-none" value={formData.category1Id} onChange={(e) => setFormData({ ...formData, category1Id: e.target.value })}>
                  <option value="">對應類別 1</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="px-4 py-3 bg-slate-100 rounded-2xl outline-none" value={formData.category2Id} onChange={(e) => setFormData({ ...formData, category2Id: e.target.value })}>
                  <option value="">對應類別 2 (可選)</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">難度星級：</span>
                <input type="range" min="1" max="5" className="flex-1 accent-indigo-600" value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })} />
                <span className="font-bold text-indigo-600 w-12 text-center">{formData.difficulty} 星</span>
              </div>

              <textarea placeholder="自訂備註 (選填)" className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                <Save size={20} /> {editingWordId ? '儲存變更' : '儲存到我的庫'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">編輯類別設定</h2>
                    <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-500 mb-1 block pl-2">類別名稱</label>
                        <input id="editCatName" defaultValue={editingCategory.name} className="w-full px-4 py-3 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 space-y-3 border shadow-inner">
                        <div className="flex justify-between border-b pb-2"><span>建立時間</span><span className="font-medium text-slate-700">{formatDate(editingCategory.createdAt)}</span></div>
                        <div className="flex justify-between"><span>最後更新</span><span className="font-medium text-slate-700">{formatDate(editingCategory.updatedAt)}</span></div>
                    </div>
                    <button 
                        onClick={() => updateCategory(editingCategory.id, document.getElementById('editCatName').value)} 
                        className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-4 rounded-2xl font-bold flex justify-center mt-4 shadow-md"
                    >
                        確認更改
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;