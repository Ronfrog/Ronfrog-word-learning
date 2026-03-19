from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import glob
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

# Setup Firebase Admin
cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
if cred_json:
    # Zeabur 雲端環境用 (直接從環境變數讀取 JSON 字串)
    cred_dict = json.loads(cred_json)
    cred = credentials.Certificate(cred_dict)
else:
    # 本地開發用 (讀取實體檔案)
    cred_files = glob.glob("*-firebase-adminsdk-*.json")
    if not cred_files:
        raise RuntimeError("Firebase Service Account JSON not found in the backend directory.")
    cred = credentials.Certificate(cred_files[0])
firebase_admin.initialize_app(cred)
db = firestore.client()

# Setup Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "請在這裡貼上你的金鑰":
    genai.configure(api_key=api_key)

app = FastAPI()

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
clean_frontend_url = frontend_url.rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[clean_frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

APP_ID = "advanced-vocab-app"

# -----------------
# 依賴: 驗證 Token
# -----------------
def verify_firebase_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Token missing")
    token = authorization.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")

# -----------------
# Pydantic 驗證模型
# -----------------
class CategoryCreate(BaseModel):
    name: str

class WordCreate(BaseModel):
    word: str
    phonetic: str
    pos: str
    definition: str
    example: str
    category1Id: str
    category2Id: str
    difficulty: int
    notes: str

class GenerateRequest(BaseModel):
    word: str
    categories: str

class BatchDeleteReq(BaseModel):
    type: str
    ids: list[str]

class QuizResultReq(BaseModel):
    isCorrect: bool

# -----------------
# Helper: 格式轉換
# -----------------
def format_doc(doc):
    data = doc.to_dict()
    # 將 Firebase Datetime 轉成與前端相容的 { seconds } 格式
    for k, v in data.items():
        if hasattr(v, 'timestamp'):
            data[k] = {"seconds": int(v.timestamp())}
    return {"id": doc.id, **data}

# -----------------
# API 路由
# -----------------

@app.get("/api/categories")
def get_categories(uid: str = Depends(verify_firebase_token)):
    docs = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('categories').get()
    return sorted([format_doc(doc) for doc in docs], key=lambda x: x.get('createdAt', {}).get('seconds', 0), reverse=True)

@app.post("/api/categories")
def create_category(cat: CategoryCreate, uid: str = Depends(verify_firebase_token)):
    res = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('categories').add({
        "name": cat.name,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    return {"id": res[1].id}

@app.put("/api/categories/{cat_id}")
def update_category(cat_id: str, cat: CategoryCreate, uid: str = Depends(verify_firebase_token)):
    db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('categories').document(cat_id).update({
        "name": cat.name,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    return {"status": "ok"}

@app.get("/api/words")
def get_words(uid: str = Depends(verify_firebase_token)):
    docs = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('vocabulary').get()
    return sorted([format_doc(doc) for doc in docs], key=lambda x: x.get('createdAt', {}).get('seconds', 0), reverse=True)

@app.post("/api/words")
def create_word(word: WordCreate, uid: str = Depends(verify_firebase_token)):
    data = word.dict()
    data['createdAt'] = firestore.SERVER_TIMESTAMP
    data['lastTestTime'] = None
    data['lastTestResult'] = None
    res = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('vocabulary').add(data)
    return {"id": res[1].id}

@app.put("/api/words/{word_id}")
def update_word(word_id: str, word: WordCreate, uid: str = Depends(verify_firebase_token)):
    db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('vocabulary').document(word_id).update(word.dict())
    return {"status": "ok"}

@app.put("/api/words/{word_id}/quiz")
def update_quiz(word_id: str, req: QuizResultReq, uid: str = Depends(verify_firebase_token)):
    db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('vocabulary').document(word_id).update({
        "lastTestTime": firestore.SERVER_TIMESTAMP,
        "lastTestResult": req.isCorrect
    })
    return {"status": "ok"}

@app.post("/api/batch-delete")
def batch_delete(req: BatchDeleteReq, uid: str = Depends(verify_firebase_token)):
    batch = db.batch()
    
    if req.type == 'categories':
        words_ref = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection('vocabulary')
        docs = words_ref.get()
        for doc in docs:
            data = doc.to_dict()
            updates = {}
            if data.get('category1Id') in req.ids:
                updates['category1Id'] = ""
            if data.get('category2Id') in req.ids:
                updates['category2Id'] = ""
            if updates:
                batch.update(doc.reference, updates)
                
    for current_id in req.ids:
        doc_ref = db.collection('artifacts').document(APP_ID).collection('users').document(uid).collection(req.type).document(current_id)
        batch.delete(doc_ref)
        
    batch.commit()
    return {"status": "ok"}

@app.post("/api/generate")
def generate_ai(req: GenerateRequest, uid: str = Depends(verify_firebase_token)):
    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") == "請在這裡貼上你的金鑰":
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY 未在後端 .env 設定")
        
    model = genai.GenerativeModel('gemini-flash-latest')
    prompt = f'分析英文單字 "{req.word}"。請以繁體中文回答。提供 JSON格式: {{"phonetic": "音標", "pos": "詞性縮寫(如 n., v.)", "definition": "精確的繁體中文釋義", "example": "英文例句 (附上繁體中文翻譯)", "cat1": "...", "cat2": "..."}}。類別從 [{req.categories}] 挑選或自擬。'
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------
# 單體架構：前端靜態網頁託管 (SPA Fallback)
# -----------------
@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
    # 使用絕對路徑，確保無論從哪裡啟動 uvicorn 都不會迷路
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(BASE_DIR, "..", "dist")
    
    # 本地開發防呆：如果上一層找不到，找找看同層有沒有 dist
    if not os.path.exists(dist_dir):
        dist_dir = os.path.join(BASE_DIR, "dist")
        
    # 如果是找真正的靜態檔案 (例如 /assets/index.js)
    if catchall:
        dist_path = os.path.join(dist_dir, catchall)
        if os.path.isfile(dist_path):
            return FileResponse(dist_path)
            
    # 否則一律 fallback 到 React 首頁 (開啟首頁時 catchall 為空)
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return {"error": f"前端網頁檔案遺失！伺服器試圖在 {dist_dir} 尋找 index.html 但找不到。"}
