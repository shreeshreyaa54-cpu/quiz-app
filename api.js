// QuizMaster — Fully client-side quiz engine
// No backend server needed. Runs entirely in the browser.
// Compatible with Vercel, Netlify, and any static hosting.

import { QUIZ_CATEGORIES } from './quizData.js';

// ── In-memory session store ──────────────────────────────────────────────────
const sessions = {};

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── API-compatible interface ─────────────────────────────────────────────────
// These functions return the same data shapes the components expect,
// but everything runs locally in the browser.

export const api = {
  getCategories() {
    return Promise.resolve({
      categories: Object.entries(QUIZ_CATEGORIES).map(([catId, cat]) => ({
        id: catId,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        color: cat.color,
      })),
    });
  },

  getDifficulties() {
    return Promise.resolve({
      difficulties: [
        { id: 'easy',   label: 'Easy',   multiplier: 1,   color: '#4ade80', time_limit: 30 },
        { id: 'medium', label: 'Medium', multiplier: 1.5, color: '#facc15', time_limit: 20 },
        { id: 'hard',   label: 'Hard',   multiplier: 2,   color: '#f87171', time_limit: 15 },
      ],
    });
  },

  startQuiz({ category, difficulty, player_name }) {
    const cat = QUIZ_CATEGORIES[category];
    if (!cat) return Promise.reject(new Error('Category not found'));

    const questionsPool = cat.questions[difficulty] || cat.questions.easy;
    const selected = shuffleArray(questionsPool).slice(0, Math.min(10, questionsPool.length));

    // Questions sent to UI (no correct_answer)
    const safeQuestions = selected.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      points: q.points,
      hint: q.hint || '',
    }));

    const sessionId = uuid();
    sessions[sessionId] = {
      session_id: sessionId,
      player_name,
      category: category,
      category_name: cat.name,
      difficulty,
      questions: selected,        // includes correct_answer
      safe_questions: safeQuestions,
      answers: [],
      score: 0,
      started_at: Date.now(),
      completed: false,
      time_bonuses: [],
    };

    return Promise.resolve({
      session_id: sessionId,
      player_name,
      category: cat.name,
      difficulty,
      total_questions: selected.length,
      questions: safeQuestions,
    });
  },

  submitAnswer({ session_id, question_index, selected_option, time_taken }) {
    const session = sessions[session_id];
    if (!session) return Promise.reject(new Error('Session not found'));
    if (session.completed) return Promise.reject(new Error('Quiz already completed'));

    const q = session.questions[question_index];
    const correct = q.correct_answer;
    const isCorrect = selected_option === correct;
    const basePoints = q.points;

    // Time bonus
    const timeLimits = { easy: 30, medium: 20, hard: 15 };
    const limit = timeLimits[session.difficulty] || 20;
    const timeRatio = Math.max(0, 1 - (time_taken / limit));
    const timeBonus = isCorrect ? Math.floor(basePoints * 0.5 * timeRatio) : 0;
    const pointsEarned = isCorrect ? basePoints + timeBonus : 0;

    session.score += pointsEarned;
    session.answers.push({
      question_index,
      selected_option,
      correct_answer: correct,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      time_taken,
      time_bonus: timeBonus,
    });

    return Promise.resolve({
      is_correct: isCorrect,
      correct_answer: correct,
      correct_answer_text: q.options[correct],
      points_earned: pointsEarned,
      time_bonus: timeBonus,
      current_score: session.score,
      explanation: q.explanation || '',
    });
  },

  completeQuiz(session_id) {
    const session = sessions[session_id];
    if (!session) return Promise.reject(new Error('Session not found'));

    session.completed = true;
    const totalQ = session.questions.length;
    const correctCount = session.answers.filter(a => a.is_correct).length;
    const maxPossible = session.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = maxPossible ? Math.round((session.score / maxPossible) * 1000) / 10 : 0;
    const duration = Math.round((Date.now() - session.started_at) / 100) / 10;

    // Grade
    let grade, gradeLabel;
    if (percentage >= 90)      { grade = 'S'; gradeLabel = 'Outstanding!'; }
    else if (percentage >= 80) { grade = 'A'; gradeLabel = 'Excellent!'; }
    else if (percentage >= 70) { grade = 'B'; gradeLabel = 'Great Job!'; }
    else if (percentage >= 60) { grade = 'C'; gradeLabel = 'Good Effort!'; }
    else if (percentage >= 50) { grade = 'D'; gradeLabel = 'Keep Practicing!'; }
    else                       { grade = 'F'; gradeLabel = 'Better Luck Next Time!'; }

    return Promise.resolve({
      session_id,
      player_name: session.player_name,
      category: session.category_name,
      difficulty: session.difficulty,
      score: session.score,
      max_score: maxPossible,
      percentage,
      correct_answers: correctCount,
      total_questions: totalQ,
      grade,
      grade_label: gradeLabel,
      duration_seconds: duration,
      answers: session.answers,
      questions: session.safe_questions,
    });
  },
};
