import React, { useEffect, useRef, useState } from 'react';
import './Results.css';

const GRADE_META = {
  S: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', emoji: '🌟' },
  A: { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  emoji: '🎉' },
  B: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)',  emoji: '👍' },
  C: { color: '#facc15', bg: 'rgba(250,204,21,0.1)',  border: 'rgba(250,204,21,0.3)',  emoji: '😊' },
  D: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)',  emoji: '😅' },
  F: { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', emoji: '💪' },
};

function Confetti({ active }) {
  const colors = ['#6c63ff','#a78bfa','#60a5fa','#4ade80','#facc15','#f87171'];
  if (!active) return null;
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function AnimatedNumber({ target, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val}</>;
}

export default function Results({ data, onPlayAgain, onHome }) {
  const {
    player_name, category, difficulty, grade, grade_label,
    score, max_score, percentage, correct_answers, total_questions,
    duration_seconds, answers, questions,
  } = data;

  const gradeMeta = GRADE_META[grade] || GRADE_META['C'];
  const showConfetti = ['S', 'A'].includes(grade);
  const [showReview, setShowReview] = useState(false);

  const mins = Math.floor(duration_seconds / 60);
  const secs = Math.round(duration_seconds % 60);
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="results">
      <Confetti active={showConfetti} />

      {/* Header */}
      <div className="results__header animate-fadeUp">
        <div className="results__grade-badge" style={{ background: gradeMeta.bg, border: `1px solid ${gradeMeta.border}` }}>
          <span style={{ fontSize: 48 }}>{gradeMeta.emoji}</span>
          <div>
            <div className="results__grade-letter" style={{ color: gradeMeta.color }}>
              Grade {grade}
            </div>
            <div className="results__grade-label">{grade_label}</div>
          </div>
        </div>

        <h1 className="results__title">
          <span className="gradient-text"><AnimatedNumber target={Math.round(percentage)} /></span>%
        </h1>
        <p className="results__subtitle">
          {player_name} · {category} · <span style={{ textTransform: 'capitalize' }}>{difficulty}</span>
        </p>
      </div>

      {/* Score ring */}
      <div className="results__ring-wrap animate-scaleIn" style={{ animationDelay: '0.1s' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="68" fill="none" stroke="var(--bg-3)" strokeWidth="10"/>
          <circle
            cx="80" cy="80" r="68"
            fill="none"
            stroke={gradeMeta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 68}
            strokeDashoffset={2 * Math.PI * 68 * (1 - percentage / 100)}
            transform="rotate(-90 80 80)"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 10px ${gradeMeta.color})` }}
          />
        </svg>
        <div className="results__ring-center">
          <span className="results__ring-score"><AnimatedNumber target={score} /></span>
          <span className="results__ring-max">/ {max_score}</span>
          <span className="results__ring-pts">POINTS</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="results__stats animate-fadeUp" style={{ animationDelay: '0.2s' }}>
        {[
          { label: 'Correct',   val: correct_answers, suffix: `/ ${total_questions}`, color: '#4ade80' },
          { label: 'Accuracy',  val: Math.round(percentage), suffix: '%', color: gradeMeta.color },
          { label: 'Time',      val: timeStr, suffix: '', color: '#60a5fa', raw: true },
          { label: 'Wrong',     val: total_questions - correct_answers, suffix: '', color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="results__stat-card card">
            <span className="results__stat-val" style={{ color: s.color }}>
              {s.raw ? s.val : <><AnimatedNumber target={s.val} />{s.suffix}</>}
              {!s.raw && s.suffix === '' && ''}
            </span>
            <span className="results__stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Review toggle */}
      <button className="results__review-btn btn-ghost animate-fadeUp" style={{ animationDelay: '0.3s' }} onClick={() => setShowReview(r => !r)}>
        {showReview ? '▲ Hide Review' : '▼ Review Answers'}
      </button>

      {/* Answer review */}
      {showReview && (
        <div className="results__review animate-fadeUp">
          {questions.map((q, i) => {
            const ans = answers[i];
            if (!ans) return null;
            return (
              <div key={i} className={`review-item card ${ans.is_correct ? 'review-item--correct' : 'review-item--wrong'}`}>
                <div className="review-item__top">
                  <span className="review-item__num">Q{i + 1}</span>
                  <span className="review-item__q">{q.question}</span>
                  <span className="review-item__badge">{ans.is_correct ? '✓' : '✗'}</span>
                </div>
                <div className="review-item__answers">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`review-opt ${oi === ans.correct_answer ? 'review-opt--correct' : ''} ${oi === ans.selected_option && !ans.is_correct ? 'review-opt--wrong' : ''}`}
                    >
                      <span className="review-opt__letter">{['A','B','C','D'][oi]}</span>
                      {opt}
                    </div>
                  ))}
                </div>
                {ans.points_earned > 0 && (
                  <div className="review-item__pts">+{ans.points_earned} pts · {ans.time_taken.toFixed(1)}s</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="results__actions animate-fadeUp" style={{ animationDelay: '0.35s' }}>
        <button className="btn-ghost results__home-btn" onClick={onHome}>
          🏠 Home
        </button>
        <button className="btn-primary results__play-btn" onClick={onPlayAgain}>
          <span>Play Again</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
