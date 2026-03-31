# 🎯 QuizMaster — Advanced Quiz Application

A full-stack quiz application built with **FastAPI** (backend) and **React** (frontend).
Features a sleek dark UI, timed questions, difficulty multipliers, instant feedback, and a detailed results screen.

---

## 📁 Project Structure

```
quiz-app/
├── backend/
│   ├── main.py          ← FastAPI application & all API routes
│   ├── data.py          ← Quiz questions (4 categories × 3 difficulties × 10 Q each)
│   └── requirements.txt ← Python dependencies
│
└── frontend/
    ├── public/
    │   └── index.html   ← HTML entry point
    ├── src/
    │   ├── index.js     ← React entry point
    │   ├── index.css    ← Global design system & animations
    │   ├── App.js       ← Root component / screen router
    │   ├── api.js       ← Centralized API service layer
    │   └── components/
    │       ├── Landing.js / .css   ← Home screen
    │       ├── Setup.js  / .css   ← Category & difficulty picker
    │       ├── Quiz.js   / .css   ← Gameplay (timer, options, feedback)
    │       └── Results.js / .css  ← Score, grade, answer review
    └── package.json
```

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

---

### Backend (FastAPI)

```bash
# Navigate to backend
cd quiz-app/backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

API will be available at: **http://localhost:8000**  
Auto-generated docs: **http://localhost:8000/docs**

---

### Frontend (React)

```bash
# Navigate to frontend
cd quiz-app/frontend

# Install dependencies
npm install

# Start development server
npm start
```

App will open at: **http://localhost:3000**

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | All quiz categories |
| GET | `/difficulties` | All difficulty levels |
| POST | `/quiz/start` | Start a quiz session |
| POST | `/quiz/answer` | Submit an answer |
| POST | `/quiz/complete/{session_id}` | Finalize and get results |
| GET | `/quiz/result/{session_id}` | Get session status |

### Example: Start Quiz
```json
POST /quiz/start
{
  "category": "science",
  "difficulty": "medium",
  "player_name": "Alice"
}
```

### Example: Submit Answer
```json
POST /quiz/answer
{
  "session_id": "uuid-here",
  "question_index": 0,
  "selected_option": 2,
  "time_taken": 8.5
}
```

---

## ✨ Features

- **4 Categories**: Science, History, Technology, Mathematics
- **3 Difficulty Levels**: Easy (30s), Medium (20s), Hard (15s)
- **10 Questions per quiz** (randomly selected from 30+ per category/difficulty)
- **Circular countdown timer** with colour-changing urgency
- **Time bonus**: faster answers earn more points
- **Streak tracking**: consecutive correct answers shown with 🔥
- **Instant feedback**: correct answer revealed with explanation
- **Hint system**: optional hints per question
- **Grade system**: S / A / B / C / D / F with confetti for top grades
- **Answer review**: full question-by-question breakdown after quiz
- **Animated numbers**: smooth score counting on results page
- **Animated backgrounds**: floating gradient orbs + noise texture
- **Fully responsive**: works on mobile, tablet, desktop

---

## 🎨 Design System

- **Font**: Syne (display) + DM Sans (body)
- **Theme**: Dark mode with deep navy palette
- **Accent**: Electric violet `#6c63ff` with purple gradients
- **Animations**: Spring easing, staggered reveals, confetti particles
- **Texture**: Subtle SVG noise overlay for depth

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · Pydantic · Uvicorn |
| Frontend | React 18 · HTML5 · CSS3 |
| State | React hooks (useState, useEffect, useRef, useCallback) |
| API comm | Native Fetch API |
| Fonts | Google Fonts (Syne + DM Sans) |
| Icons | Inline SVG |

---

## 📝 Notes for Submission

- No external UI libraries (no Bootstrap, Tailwind, MUI) — 100% custom CSS
- No external state management (no Redux) — pure React hooks
- In-memory session store — can be swapped for Redis/SQLite for persistence
- CORS enabled for local development
"# quiz-app" 
