"""
QuizMaster Database Module
──────────────────────────
SQLite-based persistence for users, quiz sessions, and individual answers.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quizmaster.db")


def _get_conn():
    """Get a new database connection with row_factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name     TEXT    NOT NULL UNIQUE,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS quiz_sessions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT    NOT NULL UNIQUE,
            user_id         INTEGER NOT NULL,
            category        TEXT    NOT NULL,
            difficulty      TEXT    NOT NULL,
            total_questions  INTEGER NOT NULL DEFAULT 0,
            score           INTEGER NOT NULL DEFAULT 0,
            max_score       INTEGER NOT NULL DEFAULT 0,
            percentage      REAL    NOT NULL DEFAULT 0,
            correct_answers INTEGER NOT NULL DEFAULT 0,
            grade           TEXT    DEFAULT NULL,
            grade_label     TEXT    DEFAULT NULL,
            duration_seconds REAL   DEFAULT NULL,
            started_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            completed       INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_answers (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT    NOT NULL,
            question_index  INTEGER NOT NULL,
            question_text   TEXT    NOT NULL,
            selected_option INTEGER NOT NULL,
            correct_answer  INTEGER NOT NULL,
            is_correct      INTEGER NOT NULL DEFAULT 0,
            points_earned   INTEGER NOT NULL DEFAULT 0,
            time_bonus      INTEGER NOT NULL DEFAULT 0,
            time_taken      REAL    NOT NULL DEFAULT 0,
            answered_at     TEXT    NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES quiz_sessions(session_id)
        );
    """)

    conn.commit()
    conn.close()
    print(f"[OK] Database initialized at {DB_PATH}")


def get_or_create_user(player_name: str) -> int:
    """Get existing user ID or create a new user. Returns user ID."""
    conn = _get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE player_name = ?", (player_name,))
    row = cursor.fetchone()

    if row:
        user_id = row["id"]
    else:
        cursor.execute(
            "INSERT INTO users (player_name) VALUES (?)",
            (player_name,)
        )
        conn.commit()
        user_id = cursor.lastrowid

    conn.close()
    return user_id


def save_session(session_id: str, user_id: int, category: str,
                 difficulty: str, total_questions: int):
    """Save a new quiz session when a quiz starts."""
    conn = _get_conn()
    conn.execute(
        """INSERT INTO quiz_sessions
           (session_id, user_id, category, difficulty, total_questions)
           VALUES (?, ?, ?, ?, ?)""",
        (session_id, user_id, category, difficulty, total_questions)
    )
    conn.commit()
    conn.close()


def save_answer(session_id: str, question_index: int, question_text: str,
                selected_option: int, correct_answer: int, is_correct: bool,
                points_earned: int, time_bonus: int, time_taken: float):
    """Save an individual answer to the database."""
    conn = _get_conn()
    conn.execute(
        """INSERT INTO quiz_answers
           (session_id, question_index, question_text, selected_option,
            correct_answer, is_correct, points_earned, time_bonus, time_taken)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (session_id, question_index, question_text, selected_option,
         correct_answer, int(is_correct), points_earned, time_bonus, time_taken)
    )
    conn.commit()
    conn.close()


def complete_session(session_id: str, score: int, max_score: int,
                     percentage: float, correct_answers: int,
                     grade: str, grade_label: str, duration_seconds: float):
    """Update a session with final results when the quiz is completed."""
    conn = _get_conn()
    conn.execute(
        """UPDATE quiz_sessions
           SET score = ?, max_score = ?, percentage = ?,
               correct_answers = ?, grade = ?, grade_label = ?,
               duration_seconds = ?, completed = 1
           WHERE session_id = ?""",
        (score, max_score, percentage, correct_answers,
         grade, grade_label, duration_seconds, session_id)
    )
    conn.commit()
    conn.close()
