import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const LoginScreen = () => {
  const { user, handleLoginSuccess } = useAuth();

  // 載入中
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // 錯誤：未設定 GOOGLE_CLIENT_ID
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 text-red-500 font-bold">
        請先在 GCP 環境變數設定 GOOGLE_CLIENT_ID！
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="bg-white p-10 rounded-[32px] shadow-xl text-center max-w-sm w-full space-y-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <BookOpen size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 mb-2">智能單字庫</h1>
            <p className="text-slate-500">專屬你的 AI 擴充詞彙助理</p>
          </div>
          <div className="flex justify-center mt-6 w-full">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => alert('Google 登入連線失敗！請確認是否封鎖了彈出視窗')}
              shape="pill"
              size="large"
              theme="filled_black"
              text="continue_with"
              auto_select
            />
          </div>
          <p className="text-xs text-slate-400 mt-4">Safe & Secure with Google One Tap</p>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
};

export default LoginScreen;
