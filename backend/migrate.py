"""
一次性遷移腳本：將舊 Firestore 路徑資料複製到新的多語言路徑結構。

舊路徑: artifacts/{APP_ID}/users/{uid}/vocabulary
新路徑: artifacts/{APP_ID}/users/{uid}/languages/en/vocabulary

此腳本是「複製」不是「搬移」，舊資料會保留不受影響。
執行完成後，你可以自行決定是否刪除舊路徑的資料。

使用方式:
  cd backend
  python migrate.py

【說明】
  Firestore 中若 users/{uid} Document 本身沒有欄位（僅靠子集合存在），
  直接用 collection.get() 會回傳空列表。
  本腳本改用 list_documents()，可直接列出 Firestore users 層下所有文件 ID，
  包含隱性文件，且 ID 與 Console 所見完全一致。
"""
import firebase_admin
from firebase_admin import credentials, firestore
import glob
import json
import os

# --- Firebase 初始化 (與 main.py 相同邏輯) ---
from dotenv import load_dotenv
load_dotenv()

cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
if cred_json:
    cred = credentials.Certificate(json.loads(cred_json))
else:
    cred_files = glob.glob("*-firebase-adminsdk-*.json")
    if not cred_files:
        raise RuntimeError("找不到 Firebase Service Account JSON 檔案")
    cred = credentials.Certificate(cred_files[0])

firebase_admin.initialize_app(cred)
db = firestore.client()

APP_ID = "advanced-vocab-app"

def migrate_user(uid: str):
    """遷移指定用戶的 vocabulary 和 categories 到 languages/en 下"""
    base_old = db.collection('artifacts').document(APP_ID).collection('users').document(uid)
    base_new = base_old.collection('languages').document('en')

    # --- 遷移 vocabulary ---
    old_words = base_old.collection('vocabulary').get()
    word_count = 0
    for doc in old_words:
        base_new.collection('vocabulary').document(doc.id).set(doc.to_dict())
        word_count += 1
    print(f"  ✅ 已複製 {word_count} 筆單字 → languages/en/vocabulary/")

    # --- 遷移 categories ---
    old_cats = base_old.collection('categories').get()
    cat_count = 0
    for doc in old_cats:
        base_new.collection('categories').document(doc.id).set(doc.to_dict())
        cat_count += 1
    print(f"  ✅ 已複製 {cat_count} 筆類別 → languages/en/categories/")

    return word_count, cat_count

def main():
    print("=" * 50)
    print("📦 Firestore 資料遷移工具")
    print("  舊路徑: users/{uid}/vocabulary")
    print("  新路徑: users/{uid}/languages/en/vocabulary")
    print("=" * 50)

    # -------------------------------------------------------
    # 【說明】使用 list_documents() 而非 collection.get()
    # collection.get() 只能找到有欄位的文件；
    # list_documents() 可列出所有文件參考，包含僅靠子集合存在的隱性文件，
    # 且 ID 與 Firestore Console 所見完全相同。
    # -------------------------------------------------------
    print("\n🔍 正在從 Firestore users 集合列舉所有用戶...")
    users_ref = db.collection('artifacts').document(APP_ID).collection('users')
    uids = [doc.id for doc in users_ref.list_documents()]

    if not uids:
        print("\n❌ 找不到任何用戶資料，請確認 APP_ID 或 Firestore 路徑是否正確。")
        print(f"   目前 APP_ID = \"{APP_ID}\"")
        print(f"   查詢路徑 = artifacts/{APP_ID}/users/")
        return

    print(f"\n找到 {len(uids)} 個用戶：")
    for uid in uids:
        print(f"  - {uid}")

    confirm = input("\n確認開始遷移？(y/N): ").strip().lower()
    if confirm != 'y':
        print("已取消。")
        return

    total_words, total_cats = 0, 0
    for uid in uids:
        print(f"\n🔄 遷移用戶: {uid}")
        w, c = migrate_user(uid)
        total_words += w
        total_cats += c

    print(f"\n{'=' * 50}")
    print(f"🎉 遷移完成！")
    print(f"   共遷移 {total_words} 筆單字、{total_cats} 筆類別")
    print(f"   舊路徑資料未被刪除，可自行到 Firebase Console 清理")
    print(f"{'=' * 50}")

if __name__ == "__main__":
    main()
