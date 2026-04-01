import React, { useState } from 'react';
import { X, Check, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * 測驗進行中頁面
 */
const QuizSession = ({ quizWords, onResult, onExit }) => {
  const [quizIndex, setQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const { langConfig } = useLanguage();

  const currentWord = quizWords[quizIndex];

  const handleResult = async (isCorrect) => {
    const updatePromise = onResult(currentWord.id, isCorrect);

    if (quizIndex + 1 < quizWords.length) {
      setQuizIndex((p) => p + 1);
      setShowAnswer(false);
    } else {
      await updatePromise;
      onExit(true); // true = 測驗完成
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-4 text-slate-400">
        <span>
          進度：{quizIndex + 1} / {quizWords.length}
        </span>
        <button onClick={() => onExit(false)} className="hover:text-slate-600">
          <X />
        </button>
      </div>

      <div className="bg-white p-12 rounded-[40px] shadow-xl border border-slate-100 text-center space-y-8 min-h-[400px] flex flex-col justify-center animate-in zoom-in duration-300 relative">
        <div>
          <h2 className="text-5xl font-black text-slate-800 tracking-tight">{currentWord.word}</h2>
        </div>

        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="mx-auto bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all shadow-md"
          >
            查看答案
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="text-2xl text-indigo-600 font-bold">
              <span className="text-slate-400 font-normal mr-2">
                {langConfig.formatReading(currentWord)}
              </span>
              {currentWord.pos} {currentWord.definition}
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl text-slate-600 italic leading-relaxed">
              {currentWord.example}
            </div>
            {currentWord.notes && (
              <div className="text-sm text-slate-400 border-t pt-4">
                備註：{currentWord.notes}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => handleResult(false)}
          className="bg-white text-red-500 border-2 border-red-100 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-red-50 transition-all"
        >
          <XCircle size={32} />
          <span className="font-bold">不認識</span>
        </button>
        <button
          onClick={() => handleResult(true)}
          className="bg-white text-green-500 border-2 border-green-100 p-6 rounded-3xl flex flex-col items-center gap-2 hover:bg-green-50 transition-all"
        >
          <Check size={32} />
          <span className="font-bold">認識</span>
        </button>
      </div>
    </div>
  );
};

export default QuizSession;
