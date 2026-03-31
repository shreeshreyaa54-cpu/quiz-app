import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import './Quiz.css';

const TIME_LIMITS = { easy: 30, medium: 20, hard: 15 };

export default function Quiz({ session, onComplete, onQuit }) {
  const { session_id, questions, total_questions, difficulty, player_name, category } = session;
  const timeLimit = TIME_LIMITS[difficulty] || 20;

  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selected, setSelected] = useState(null);     // option index chosen
  const [feedback, setFeedback] = useState(null);     // { is_correct, correct_answer, explanation, points_earned, time_bonus }
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quitting, setQuitting] = useState(false);

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const question = questions[qIdx];
  const progress = ((qIdx) / total_questions) * 100;
  const circumference = 2 * Math.PI * 22;   // r=22 SVG timer

  // ── Timer ────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => clearInterval(timerRef.current), []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = Date.now();
    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  // eslint-disable-next-line
  }, [timeLimit, qIdx]);

  useEffect(() => { startTimer(); return stopTimer; }, [qIdx, startTimer, stopTimer]);

  // ── Time-up ───────────────────────────────────────────────────────────────
  async function handleTimeUp() {
    if (selected !== null || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.submitAnswer({
        session_id,
        question_index: qIdx,
        selected_option: -1,
        time_taken: timeLimit,
      });
      setFeedback({ ...res, timed_out: true });
      setStreak(0);
    } catch (e) { /* ignore */ }
    setSubmitting(false);
  }

  // ── Choose answer ─────────────────────────────────────────────────────────
  async function handleSelect(optIdx) {
    if (selected !== null || feedback || submitting) return;
    stopTimer();
    const timeTaken = Math.min((Date.now() - startTimeRef.current) / 1000, timeLimit);
    setSelected(optIdx);
    setSubmitting(true);
    try {
      const res = await api.submitAnswer({
        session_id,
        question_index: qIdx,
        selected_option: optIdx,
        time_taken: timeTaken,
      });
      setFeedback(res);
      setScore(res.current_score);
      setStreak(s => res.is_correct ? s + 1 : 0);
    } catch (e) {
      setFeedback({ is_correct: false, correct_answer: 0, explanation: 'Error submitting.', points_earned: 0, time_bonus: 0, current_score: score });
    }
    setSubmitting(false);
  }

  // ── Next question ─────────────────────────────────────────────────────────
  async function handleNext() {
    if (animating) return;
    setAnimating(true);

    const nextIdx = qIdx + 1;
    if (nextIdx >= total_questions) {
      // Complete quiz
      try {
        const result = await api.completeQuiz(session_id);
        onComplete(result);
      } catch (e) { onComplete({ error: true }); }
      return;
    }

    setTimeout(() => {
      setQIdx(nextIdx);
      setSelected(null);
      setFeedback(null);
      setShowHint(false);
      setAnimating(false);
    }, 300);
  }

  // ── Option class ──────────────────────────────────────────────────────────
  function optionClass(idx) {
    let cls = 'option-btn';
    if (!feedback) {
      if (selected === idx) cls += ' option-btn--selected';
      return cls;
    }
    if (idx === feedback.correct_answer) return cls + ' option-btn--correct';
    if (idx === selected && !feedback.is_correct) return cls + ' option-btn--wrong';
    return cls + ' option-btn--dim';
  }

  const timerRatio = timeLeft / timeLimit;
  const timerColor = timerRatio > 0.6 ? '#4ade80' : timerRatio > 0.3 ? '#facc15' : '#f87171';
  const dashOffset = circumference * (1 - timerRatio);

  return (
    <div className="quiz">
      {/* Top bar */}
      <div className="quiz__topbar animate-fadeUp">
        <button className="btn-ghost btn-ghost--sm" onClick={() => setQuitting(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          Quit
        </button>

        <div className="quiz__meta">
          <span className="quiz__player">🎮 {player_name}</span>
          <span className="quiz__dot">·</span>
          <span className="quiz__cat">{category}</span>
        </div>

        <div className="quiz__score-chip">
          <span className="quiz__score-label">Score</span>
          <span className="quiz__score-val">{score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="quiz__progress-wrap animate-fadeUp" style={{ animationDelay: '0.05s' }}>
        <div className="quiz__progress-bar">
          <div className="quiz__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz__progress-info">
          <span className="quiz__q-count">Question {qIdx + 1} / {total_questions}</span>
          {streak >= 2 && (
            <span className="quiz__streak">
              🔥 {streak} streak!
            </span>
          )}
        </div>
      </div>

      {/* Question card */}
      <div className={`quiz__card card animate-scaleIn ${animating ? 'quiz__card--exit' : ''}`} key={qIdx}>

        {/* Timer + question */}
        <div className="quiz__card-header">
          {/* Circular timer */}
          <div className="quiz__timer">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--bg-3)" strokeWidth="4"/>
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke={timerColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <span className="quiz__timer-val" style={{ color: timerColor }}>{timeLeft}</span>
          </div>

          <div className="quiz__q-text">{question.question}</div>
        </div>

        {/* Hint */}
        {question.hint && !feedback && (
          <div className="quiz__hint-wrap">
            {!showHint ? (
              <button className="hint-btn" onClick={() => setShowHint(true)}>
                💡 Show Hint
              </button>
            ) : (
              <div className="hint-text animate-scaleIn">
                💡 {question.hint}
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="quiz__options">
          {question.options.map((opt, i) => (
            <button
              key={i}
              className={optionClass(i)}
              onClick={() => handleSelect(i)}
              disabled={!!feedback || submitting}
            >
              <span className="option-btn__letter">{['A','B','C','D'][i]}</span>
              <span className="option-btn__text">{opt}</span>
              {feedback && i === feedback.correct_answer && (
                <span className="option-btn__badge option-btn__badge--correct">✓</span>
              )}
              {feedback && i === selected && !feedback.is_correct && i !== feedback.correct_answer && (
                <span className="option-btn__badge option-btn__badge--wrong">✗</span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback panel */}
        {feedback && (
          <div className={`quiz__feedback animate-scaleIn ${feedback.is_correct ? 'quiz__feedback--correct' : 'quiz__feedback--wrong'}`}>
            <div className="feedback__row">
              <span className="feedback__icon">{feedback.timed_out ? '⏰' : feedback.is_correct ? '🎉' : '❌'}</span>
              <div>
                <div className="feedback__headline">
                  {feedback.timed_out ? "Time's Up!" : feedback.is_correct ? 'Correct!' : 'Wrong!'}
                </div>
                {feedback.is_correct && (
                  <div className="feedback__points">
                    +{feedback.points_earned} pts
                    {feedback.time_bonus > 0 && <span className="feedback__bonus"> (+{feedback.time_bonus} speed bonus)</span>}
                  </div>
                )}
              </div>
            </div>
            {feedback.explanation && (
              <p className="feedback__explanation">{feedback.explanation}</p>
            )}
            <button className="feedback__next-btn" onClick={handleNext}>
              {qIdx + 1 >= total_questions ? '🏁 See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>

      {/* Quit modal */}
      {quitting && (
        <div className="modal-overlay animate-fadeIn">
          <div className="modal card animate-scaleIn">
            <div className="modal__icon">🚪</div>
            <h3 className="modal__title">Quit Quiz?</h3>
            <p className="modal__body">Your progress won't be saved. Are you sure?</p>
            <div className="modal__actions">
              <button className="btn-ghost" onClick={() => setQuitting(false)}>Keep Playing</button>
              <button className="btn-danger" onClick={onQuit}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
