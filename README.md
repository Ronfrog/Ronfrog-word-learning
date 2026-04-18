# 智慧單字庫 (Smart Vocabulary Builder)
**版本：v0.1.0**

這是一個結合 Google Gemini AI 功能與 Firebase 雲端資料庫的現代化 Web 應用程式。幫助使用者更有系統地擴充、測驗與管理個人專屬的**多語言**字彙庫。

## ✨ 核心功能
* **Google 帳號登入**：支援獨立使用者的個人單字庫與學習紀錄。
* **多語言支援**：目前支援**英文**和**日文**兩種語言，可從導覽列的語言切換器即時切換，每種語言擁有獨立的單字庫和類別。
* **AI 擴充解析**：整合 Gemini API，只要輸入單字，AI 會幫忙自動分析音標 (英文) / 假名讀音 (日文)、詞性、繁體中文釋義，並提供對照例句。
* **難度與類別管理**：支援將單字分類、標示星級難度。
* **多選與批次刪除**：支援防呆的複選機制，一鍵清空不要的單字或類別（若類別被刪除，底下的單字會自動解除綁定）。
* **客製化單字測驗**：可根據類別、難度或是「曾答錯的單字」進行抽考，並自動紀錄最後一次測驗日期與結果。
* **模組化架構**：前端採用 Context + Hooks + Components 的元件化設計，易於維護和擴展。

## 🛠️ 技術棧 (Tech Stack)
* **前端框架**: React 19 + Vite 8
* **UI 樣式**: Tailwind CSS v4 + Lucide React (Icons)
* **後端**: Python FastAPI + Firebase Admin SDK (Firestore)
* **認證**: Google OAuth2 (via @react-oauth/google)
* **AI 引擎**: Google Gemini API (`gemini-flash-latest`)

## 🚀 本地開發與部署 (Local Setup)

### 1. 安裝依賴套件
```bash
npm install
cd backend && pip install -r requirements.txt
```

### 2. 環境變數設定

**前端** — 在專案根目錄建立 `.env.local`：
```env
VITE_GOOGLE_CLIENT_ID=你的_google_client_id
```

**後端** — 在 `backend/` 目錄建立 `.env`：
```env
GEMINI_API_KEY=你的_gemini_api_key
GOOGLE_CLIENT_ID=你的_google_client_id
ALLOWED_EMAILS=email1@gmail.com,email2@gmail.com
```
並將 Firebase Service Account JSON 放到 `backend/` 目錄中。

### 3. 啟動開發伺服器
```bash
# 前端 (Terminal 1)
npm run dev

# 後端 (Terminal 2)
cd backend
uvicorn main:app --reload --port 8000 
```
啟動後可以在瀏覽器開啟 `http://localhost:5173` 來預覽你的應用程式。

### 4. 資料遷移（從舊版升級時需要）
```bash
cd backend
python migrate.py
```
此腳本會將舊路徑 (`users/{uid}/vocabulary`) 的資料複製到新的多語言路徑 (`users/{uid}/languages/en/vocabulary`)，舊資料不會被刪除。
