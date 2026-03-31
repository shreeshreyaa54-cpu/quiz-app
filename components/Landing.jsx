import React, { useEffect, useState } from 'react';
import './Landing.css';

const FACTS = [
  "Over 40 questions across 4 categories",
  "3 difficulty levels with time bonuses",
  "Instant feedback with explanations",
  "Compete against yourself with scores",
];

export default function Landing({ onStart }) {
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFactIdx(i => (i + 1) % FACTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <div className="landing__hero animate-fadeUp">
        <div className="landing__badge">✦ College Edition ✦</div>

        <h1 className="landing__title">
          <span className="gradient-text">Quiz</span>
          <span className="landing__title-accent">Master</span>
        </h1>

        <p className="landing__subtitle">
          Test your knowledge across Science, History, Technology & Mathematics.
          <br />Race the clock. Earn bonus points. Master every category.
        </p>

        {/* Rotating fact */}
        <div className="landing__fact">
          <span className="landing__fact-dot" />
          <span key={factIdx} className="landing__fact-text">{FACTS[factIdx]}</span>
        </div>

        <button className="btn-primary landing__cta" onClick={onStart}>
          <span>Start Playing</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* Feature cards */}
      <div className="landing__features">
        {[
          { icon: '⚗️', label: 'Science', desc: 'Physics, Chemistry, Biology', color: '#60a5fa', delay: '0.1s' },
          { icon: '🏛️', label: 'History', desc: 'Events & Civilizations',      color: '#f59e0b', delay: '0.2s' },
          { icon: '💻', label: 'Technology', desc: 'Computers & AI',            color: '#a78bfa', delay: '0.3s' },
          { icon: '🔢', label: 'Mathematics', desc: 'Algebra & Calculus',       color: '#34d399', delay: '0.4s' },
        ].map(f => (
          <div
            key={f.label}
            className="feature-card animate-fadeUp"
            style={{ '--card-color': f.color, animationDelay: f.delay }}
          >
            <div className="feature-card__icon">{f.icon}</div>
            <div>
              <div className="feature-card__label">{f.label}</div>
              <div className="feature-card__desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="landing__stats animate-fadeUp" style={{ animationDelay: '0.5s' }}>
        {[
          { val: '4', label: 'Categories' },
          { val: '120+', label: 'Questions' },
          { val: '3', label: 'Difficulty Levels' },
          { val: '∞', label: 'Replayability' },
        ].map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-val gradient-text">{s.val}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
