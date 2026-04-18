# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**智慧單字庫 (Smart Vocabulary Builder)** — A full-stack multi-language vocabulary learning app with AI-powered word analysis, Google OAuth2 authentication, and Firestore storage. Currently supports **English** and **Japanese**.

## Commands

### Frontend
```bash
npm run dev        # Dev server at http://localhost:5173
npm run build      # Production build (outputs to dist/)
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Docker (Production)
```bash
docker build -t word-learning .
docker run -p 8080:8080 word-learning
```

### Data Migration
```bash
cd backend
python migrate.py  # One-time: copies old path data to new multi-language path structure
```

## Architecture

This is a **monorepo** with a React SPA frontend and a Python FastAPI backend that serves dual purpose: API server + static file host in production.

### Frontend (`src/`)

#### Component Architecture (Modular)
```
src/
├── main.jsx                              # Entry point
├── App.jsx                               # Root: Providers → Page routing (~130 lines)
├── config/languages.js                   # Language definitions (fields, AI prompts, formatters)
├── contexts/
│   ├── AuthContext.jsx                   # Google OAuth login/logout, token management
│   └── LanguageContext.jsx               # Current language state & switching
├── hooks/
│   ├── useApi.js                         # API fetch wrapper (auto-injects token + lang)
│   ├── useWords.js                       # Word CRUD operations & state
│   └── useCategories.js                  # Category CRUD operations & state
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx                    # Navigation bar (with language switcher)
│   │   └── LoginScreen.jsx              # Google OAuth login page
│   ├── words/
│   │   ├── WordList.jsx                  # Word list (search, filter, sort)
│   │   ├── WordCard.jsx                  # Word card (language-aware display)
│   │   └── WordModal.jsx                # Add/Edit word modal (with AI analysis)
│   ├── categories/
│   │   ├── CategoryManager.jsx          # Category management page
│   │   └── CategoryEditModal.jsx        # Edit category modal
│   ├── quiz/
│   │   ├── QuizSetup.jsx                # Quiz settings page
│   │   └── QuizSession.jsx              # Quiz in progress
│   └── common/
│       └── LanguageSwitcher.jsx         # Language switcher (segmented control)
```

#### Multi-Language System
- **Language config**: `src/config/languages.js` defines fields, AI prompts, and display formatters per language
- **Adding a language**: Add a new entry to `LANGUAGES` object in `languages.js`, add backend Firestore support, and the UI auto-renders the new option
- Auth flow: Google OAuth2 via `@react-oauth/google` → sends Google ID token as `Authorization: Bearer <token>` to all API calls
- Runtime config injection: In production, the backend injects `window.FIREBASE_CONFIG` and `window.GOOGLE_CLIENT_ID` into `index.html` before serving it

### Backend (`backend/main.py`)
- FastAPI app with Firebase Admin SDK for Firestore operations
- Auth: Verifies Google ID tokens (primary) or Firebase ID tokens (fallback) on every request
- Whitelist: `ALLOWED_EMAILS` env var controls who can access after auth
- **Firestore path (multi-language)**: `artifacts/{APP_ID}/users/{uid}/languages/{lang}/vocabulary` and `.../categories`
- **All API endpoints accept `lang` query parameter** (default: `en`)
- AI: Proxies requests to `gemini-flash-latest` via `google-generativeai` SDK, prompt varies by language
- SPA fallback: The `/{catchall:path}` route serves React's `index.html` for all non-API paths

### Environment Variables

**Frontend** (`.env.local`):
```
VITE_GOOGLE_CLIENT_ID=...
```

**Backend** (`backend/.env`):
```
GEMINI_API_KEY=...
FIREBASE_CREDENTIALS_JSON=...   # JSON string (cloud) OR place *-firebase-adminsdk-*.json file in backend/ (local)
GOOGLE_CLIENT_ID=...
ALLOWED_EMAILS=email1@...,email2@...
FRONTEND_URL=http://localhost:5173   # For CORS
VITE_FIREBASE_CONFIG_JSON=...   # Optional: injected into index.html at runtime
```

### Local Dev Setup
1. Place Firebase Admin SDK JSON file in `backend/` directory (filename must match `*-firebase-adminsdk-*.json`)
2. Create `backend/.env` with `GEMINI_API_KEY` and `GOOGLE_CLIENT_ID`
3. Create `.env.local` with `VITE_GOOGLE_CLIENT_ID`
4. Run backend (`uvicorn`) and frontend (`npm run dev`) separately — Vite proxies API calls to `localhost:8000`
5. **First time after upgrade**: Run `python backend/migrate.py` to copy existing data to new multi-language path structure

### Production (Docker/GCP)
- Multi-stage Docker build: Node 20 builds the frontend, Python 3.13 serves everything on port 8080
- Backend serves the built `dist/` folder and injects env vars into `index.html` at request time
- See `gcp_deployment_guide.md` for GCP Cloud Run deployment steps
