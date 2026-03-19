# Stage 1: 建置 React 前端
FROM node:20-slim AS frontend-builder
WORKDIR /app
# 只先複製 package.json，利用 Docker 快取加速 npm install
COPY package.json package-lock.json* ./
RUN npm install
# 複製其餘前端程式碼並打包
COPY . .
RUN npm run build

# Stage 2: 建置 Python 執行環境 (雙引擎合體)
FROM python:3.13-slim
WORKDIR /app

# 把剛剛 Stage 1 打包好的純網頁前端，複製到 Python 容器裡
COPY --from=frontend-builder /app/dist /app/dist

# 安裝 FastAPI 後端依賴套件
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製後端 Python 程式碼
COPY backend/ .

# 設定環境變數並啟動 Uvicorn 伺服器
ENV PORT=8080
EXPOSE 8080

# 啟動時由於我們在 /app/backend，因此 main.py 裡的 "../dist" 能夠精準找到剛才複製進來的前端網頁！
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
