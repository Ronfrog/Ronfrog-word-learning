# 使用官方 Python 輕量級映像檔
FROM python:3.13-slim

# 設定工作目錄
WORKDIR /app

# 複製 requirements.txt 並安裝套件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製所有後端程式碼
COPY . .

# 暴露 Cloud Run 預設通訊埠
EXPOSE 8080

# 啟動命令 (綁定 0.0.0.0，通訊埠由 Cloud Run 自動分配 PORT 變數，若無則預設 8080)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
