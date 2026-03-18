# 智能單字庫 (Smart Vocabulary Builder)
**版本：v0.0.0**

這是一個結合 Google Gemini AI 功能與 Firebase 雲端資料庫的現代化 Web 應用程式。幫助使用者更有系統地擴充、測驗與管理個人專屬的英文字彙庫。

## ✨ 核心功能
* **Google 帳號登入**：支援獨立使用者的個人單字庫與學習紀錄。
* **AI 擴充解析**：整合 Gemini API，只要輸入英文單字，AI 會幫忙自動分析音標、詞性、繁體中文釋義，並提供中英對照的例句。
* **難度與類別管理**：支援將單字分類、標示星級難度。
* **多選與批次刪除**：支援防呆的複選機制，一鍵清空不要的單字或類別（若類別被刪除，底下的單字會自動解除綁定）。
* **客製化單字測驗**：可根據類別、難度或是「曾答錯的單字」進行抽考，並自動紀錄最後一次測驗日期與結果。

## 🛠️ 技術棧 (Tech Stack)
* **前端框架**: React 18 + Vite
* **UI 樣式**: Tailwind CSS v4 + Lucide React (Icons)
* **後端與驗證**: Firebase (Authentication, Firestore Database)
* **AI 引擎**: Google Gemini API (`gemini-flash-latest`)

## 🚀 本地開發與部署 (Local Setup)

### 1. 安裝依賴套件
```bash
npm install
```

### 2. 環境變數設定
請在專案根目錄下建立一個 `.env.local` 檔案，並填寫以下你的專屬金鑰資訊：
```env
# Google Gemini API Key
VITE_GEMINI_API_KEY=你的_gemini_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=你的_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=你的_auth_domain
VITE_FIREBASE_PROJECT_ID=你的_project_id
VITE_FIREBASE_STORAGE_BUCKET=你的_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=你的_messaging_sender_id
VITE_FIREBASE_APP_ID=你的_app_id
VITE_FIREBASE_MEASUREMENT_ID=你的_measurement_id
```

### 3. 啟動開發伺服器
```bash
npm run dev
```
啟動後可以在瀏覽器開啟 `http://localhost:5173` 來預覽你的應用程式。
