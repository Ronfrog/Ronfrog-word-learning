import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';

/**
 * 測驗設定頁
 */
const QuizSetup = ({ words, categories, onStartQuiz }) => {
  const [quizConfig, setQuizConfig] = useState({
    count: 10,
    catId: '全部',
    difficulty: '全部',
    status: '全部',
  });

  const startQuiz = () => {
    let pool = [...words];
    if (quizConfig.catId !== '全部')
      pool = pool.filter((w) => w.category1Id === quizConfig.catId || w.category2Id === quizConfig.catId);
    if (quizConfig.difficulty !== '全部')
      pool = pool.filter((w) => w.difficulty === parseInt(quizConfig.difficulty));
    if (quizConfig.status === '未測驗')
      pool = pool.filter((w) => w.lastTestTime === null);
    if (quizConfig.status === '錯誤過')
      pool = pool.filter((w) => w.lastTestResult === false);

    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, quizConfig.count);
    if (shuffled.length === 0) return alert('找不到符合條件的單字進行測驗');

    onStartQuiz(shuffled);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border space-y-6">
      <h2 className="text-2xl font-bold text-center">測驗設定</h2>
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-600">挑選類別</span>
          <select
            className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none"
            value={quizConfig.catId}
            onChange={(e) => setQuizConfig({ ...quizConfig, catId: e.target.value })}
          >
            <option value="全部">全部類別</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600">難度篩選</span>
          <select
            className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none"
            value={quizConfig.difficulty}
            onChange={(e) => setQuizConfig({ ...quizConfig, difficulty: e.target.value })}
          >
            <option value="全部">全部難度</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} 星
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600">測驗狀態</span>
          <select
            className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none"
            value={quizConfig.status}
            onChange={(e) => setQuizConfig({ ...quizConfig, status: e.target.value })}
          >
            <option value="全部">不限</option>
            <option value="未測驗">尚未測驗</option>
            <option value="錯誤過">曾經錯誤</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-600">題數</span>
          <input
            type="number"
            className="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none"
            value={quizConfig.count}
            onChange={(e) => setQuizConfig({ ...quizConfig, count: parseInt(e.target.value) })}
          />
        </label>
      </div>
      <button
        onClick={startQuiz}
        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex justify-center"
      >
        <PlayCircle />&nbsp;開始測驗
      </button>
    </div>
  );
};

export default QuizSetup;
