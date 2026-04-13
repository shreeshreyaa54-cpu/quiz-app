from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import time
from data import QUIZ_CATEGORIES
from database import init_db, get_or_create_user, save_session, save_answer, complete_session

app = FastAPI(title="QuizMaster API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
init_db()

# In-memory session store
sessions = {}

# ── Models ────────────────────────────────────────────────────────────────────

class StartQuizRequest(BaseModel):
    category: str
    difficulty: str
    player_name: str

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_index: int
    selected_option: int
    time_taken: float  # seconds

class QuizSession(BaseModel):
    session_id: str
    player_name: str
    category: str
    difficulty: str
    questions: list
    answers: list = []
    score: int = 0
    started_at: float = 0
    completed: bool = False

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "QuizMaster API is running 🎯"}

@app.get("/categories")
def get_categories():
    return {
        "categories": [
            {
                "id": cat_id,
                "name": cat["name"],
                "icon": cat["icon"],
                "description": cat["description"],
                "color": cat["color"]
            }
            for cat_id, cat in QUIZ_CATEGORIES.items()
        ]
    }

@app.get("/difficulties")
def get_difficulties():
    return {
        "difficulties": [
            {"id": "easy",   "label": "Easy",   "multiplier": 1,   "color": "#4ade80", "time_limit": 30},
            {"id": "medium", "label": "Medium", "multiplier": 1.5, "color": "#facc15", "time_limit": 20},
            {"id": "hard",   "label": "Hard",   "multiplier": 2,   "color": "#f87171", "time_limit": 15},
        ]
    }

@app.post("/quiz/start")
def start_quiz(req: StartQuizRequest):
    if req.category not in QUIZ_CATEGORIES:
        raise HTTPException(status_code=404, detail="Category not found")

    cat = QUIZ_CATEGORIES[req.category]
    questions_pool = cat["questions"].get(req.difficulty, cat["questions"]["easy"])

    import random
    selected = random.sample(questions_pool, min(10, len(questions_pool)))

    # Strip correct_answer before sending to client
    safe_questions = []
    for i, q in enumerate(selected):
        safe_questions.append({
            "index": i,
            "question": q["question"],
            "options": q["options"],
            "points": q["points"],
            "hint": q.get("hint", ""),
        })

    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "session_id": session_id,
        "player_name": req.player_name,
        "category": req.category,
        "difficulty": req.difficulty,
        "questions": selected,          # includes correct_answer
        "safe_questions": safe_questions,
        "answers": [],
        "score": 0,
        "started_at": time.time(),
        "completed": False,
        "time_bonuses": []
    }

    # Save to database
    user_id = get_or_create_user(req.player_name)
    save_session(session_id, user_id, req.category, req.difficulty, len(selected))

    return {
        "session_id": session_id,
        "player_name": req.player_name,
        "category": cat["name"],
        "difficulty": req.difficulty,
        "total_questions": len(selected),
        "questions": safe_questions,
    }

@app.post("/quiz/answer")
def submit_answer(req: SubmitAnswerRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["completed"]:
        raise HTTPException(status_code=400, detail="Quiz already completed")

    q = session["questions"][req.question_index]
    correct = q["correct_answer"]
    is_correct = req.selected_option == correct
    base_points = q["points"]

    # Time bonus: faster answer = more points
    time_limits = {"easy": 30, "medium": 20, "hard": 15}
    limit = time_limits.get(session["difficulty"], 20)
    time_ratio = max(0, 1 - (req.time_taken / limit))
    time_bonus = int(base_points * 0.5 * time_ratio) if is_correct else 0
    points_earned = (base_points + time_bonus) if is_correct else 0

    session["score"] += points_earned
    session["answers"].append({
        "question_index": req.question_index,
        "selected_option": req.selected_option,
        "correct_answer": correct,
        "is_correct": is_correct,
        "points_earned": points_earned,
        "time_taken": req.time_taken,
        "time_bonus": time_bonus,
    })

    # Save answer to database
    save_answer(
        session_id=req.session_id,
        question_index=req.question_index,
        question_text=q["question"],
        selected_option=req.selected_option,
        correct_answer=correct,
        is_correct=is_correct,
        points_earned=points_earned,
        time_bonus=time_bonus,
        time_taken=req.time_taken
    )

    return {
        "is_correct": is_correct,
        "correct_answer": correct,
        "correct_answer_text": q["options"][correct],
        "points_earned": points_earned,
        "time_bonus": time_bonus,
        "current_score": session["score"],
        "explanation": q.get("explanation", ""),
    }

@app.post("/quiz/complete/{session_id}")
def complete_quiz(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session["completed"] = True
    total_q = len(session["questions"])
    correct_count = sum(1 for a in session["answers"] if a["is_correct"])
    max_possible = sum(q["points"] for q in session["questions"])
    percentage = round((session["score"] / max_possible * 100), 1) if max_possible else 0
    duration = round(time.time() - session["started_at"], 1)

    # Grade
    if percentage >= 90:   grade, grade_label = "S", "Outstanding!"
    elif percentage >= 80: grade, grade_label = "A", "Excellent!"
    elif percentage >= 70: grade, grade_label = "B", "Great Job!"
    elif percentage >= 60: grade, grade_label = "C", "Good Effort!"
    elif percentage >= 50: grade, grade_label = "D", "Keep Practicing!"
    else:                  grade, grade_label = "F", "Better Luck Next Time!"

    # Update session in database
    complete_session(
        session_id=session_id,
        score=session["score"],
        max_score=max_possible,
        percentage=percentage,
        correct_answers=correct_count,
        grade=grade,
        grade_label=grade_label,
        duration_seconds=duration
    )

    return {
        "session_id": session_id,
        "player_name": session["player_name"],
        "category": session["category"],
        "difficulty": session["difficulty"],
        "score": session["score"],
        "max_score": max_possible,
        "percentage": percentage,
        "correct_answers": correct_count,
        "total_questions": total_q,
        "grade": grade,
        "grade_label": grade_label,
        "duration_seconds": duration,
        "answers": session["answers"],
        "questions": session["safe_questions"],
    }

@app.get("/quiz/result/{session_id}")
def get_result(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"completed": session["completed"], "score": session["score"]}
