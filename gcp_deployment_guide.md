# ☁️ 智慧單字庫 - GCP 單體架構統一部署教學 (終極極簡版)

這是一份針對我們最新的「前後端統一部署（Monolith 架構）」專門撰寫的 GCP Cloud Run 部署手冊。

按照以下步驟，你就可以將整個網站（包含前端畫面與後端 Python API 套件）完全融為一體，放在同一個 Google 頂級網址上運行，**從此不再需要理會 Vercel 或惱人的 CORS 設定！**

---

## 步驟一：確保最新程式碼已推送到 GitHub
在準備部署前，請先在 VS Code 檢查您的 Source Control。
請將所有的修改（特別是**專案最外層根目錄**的那個 [Dockerfile](file:///c:/Users/Ronfrog/Documents/MyProject/word-learning/Dockerfile)，還有最新修改過的 [App.jsx](file:///c:/Users/Ronfrog/Documents/MyProject/word-learning/src/App.jsx) 與 [backend/main.py](file:///c:/Users/Ronfrog/Documents/MyProject/word-learning/backend/main.py)）通通加入 Commit 並且 **Push 到你的 GitHub 倉庫**。

## 步驟二：砍掉重練（刪除舊的設定最保險）
因為 GCP 的「持續部署 (Cloud Build)」介面有時候改設定會比較隱密，最快且最不會踩雷的方法，就是把我們前面測試有問題的舊服務捨棄，重新建立一個乾淨全新的：
1. 進入你的 [GCP Cloud Run 控制台](https://console.cloud.google.com/run)。
2. 勾選你剛才建立的那項舊服務，點擊頁面上方工具列的 **刪除 (DELETE)**。

## 步驟三：大合體重新建立服務
1. 點擊頁面上方的 **建立服務 (CREATE SERVICE)**。
2. 選擇 **從原始碼或原始碼存放區持續部署 (Continuously deploy from a repository)**。
3. 點擊旁邊的 **設定 CLOUD BUILD (SET UP WITH CLOUD BUILD)** 按鈕：
   - 第二層選單來源提供者選擇 **GitHub**，然後找到你的單字庫 Repository 專案。
   - 點擊下一步。
4. **⚠️ 最關鍵的建置設定 (Build Configuration)**：
   - 分支 (Branch): 選擇你的主線分支 (通常是 `^main$` 或是 `^master$`)。
   - 建置類型 (Build Type): 請選擇 **Dockerfile**。
   - 原始碼路徑 (Source location): 請直接選擇 **[/Dockerfile](file:///c:/Users/Ronfrog/Documents/MyProject/word-learning/Dockerfile)**。(👉 這超重要！一定要是最外層的那個 Dockerfile，千萬不要選到 backend 裡面的，這樣 Google 才會幫你先執行 `npm run build` 打包前端的介面)。
   - 點擊 Save (儲存)。

## 步驟四：開放外部存取與網路設定
1. 在主設定區塊的 **驗證 (Authentication)** 欄位：務必選擇 **允許未經驗證的叫用 (Allow unauthenticated invocations)**，這樣世界上所有人才能瀏覽你的網站首頁。
2. 展開下方的進階選單 **容器、網路及安全性 (Container, Networking, Security)**：
   - 在第一個頁籤找到 **容器連接埠 (Container port)**：輸入 `8080` (這是我們 Dockerfile 裡面對應的預設出口口)。

## 步驟五：填寫唯二的兩個環境變數
在剛才同個選單列，切換到 **變數與密碼 (Variables & Secrets)** 頁籤，點擊 **新增變數 (ADD VARIABLE)**：
- 變數 `GEMINI_API_KEY`: 填入你的 Google AI 金鑰。
- 變數 `FIREBASE_CREDENTIALS_JSON`: 把你當初下載的 `backend/word-learning-xxxxx.json` 檔案打開，**把裡面包含各種大括號的「整份超長字串內容」完全複製，直接當成值貼過來**。
*(就是這麼乾淨！這次你真的不需要 FRONTEND_URL，也再也不用設定什麼 API_URL 了！)*

## 步驟六：部署升空！🎉
1. 點擊最下面藍色的 **建立 (CREATE)** 按鈕。
2. 耐心等待幾分鐘。過程中如果你點進去看建置紀錄 (Build Logs)，你會看到一個很有成就感的畫面：它正在雲端幫你下載 Node.js、執行 `npm run build`、然後再幫你安裝 Python FastAPI！
3. 一旦狀態亮出綠色打勾，畫面頂端會派發給你一串專屬網址（例如：`https://word-learning-xxxxx.a.run.app`）。

點擊這串網址，你的究極進化版單字庫就會呈現在眼前！不管是登入、測驗還是 AI 分析，都會透過最快、最安全的內部迴圈完成喔！
