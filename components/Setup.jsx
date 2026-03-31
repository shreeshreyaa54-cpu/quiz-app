import React, { useState, useEffect } from 'react';
import { api } from '../api';
import './Setup.css';

const DIFF_META = {
  easy:   { emoji: '🌱', desc: '30s per question • ×1 multiplier',   color: '#4ade80' },
  medium: { emoji: '⚡', desc: '20s per question • ×1.5 multiplier', color: '#facc15' },
  hard:   { emoji: '🔥', desc: '15s per question • ×2 multiplier',   color: '#f87171' },
};

export default function Setup({ onBack, onStart }) {
  const [categories, setCategories] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [selected, setSelected] = useState({ category: '', difficulty: '', playerName: '' });
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getCategories(), api.getDifficulties()])
      .then(([catRes, diffRes]) => {
        setCategories(catRes.categories);
        setDifficulties(diffRes.difficulties);
      })
      .catch(() => setError('Failed to load quiz data. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const canStart = selected.category && selected.difficulty && selected.playerName.trim().length >= 2;

  async function handleStart() {
    if (!canStart) return;
    setStarting(true);
    setError('');
    try {
      const session = await api.startQuiz({
        category: selected.category,
        difficulty: selected.difficulty,
        player_name: selected.playerName.trim(),
      });
      onStart(session);
    } catch (e) {
      setError(e.message);
      setStarting(false);
    }
  }

  const set = (key, val) => setSelected(s => ({ ...s, [key]: val }));

  return (
    <div className="setup">
      {/* Header */}
      <div className="setup__header animate-fadeUp">
        <button className="btn-ghost" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <div className="setup__step-label">Quiz Setup</div>
      </div>

      {loading ? (
        <div className="setup__loading">
          <div className="spinner" />
          <p>Loading quiz data…</p>
        </div>
      ) : (
        <div className="setup__body">

          {/* Player name */}
          <section className="setup__section animate-fadeUp" style={{ animationDelay: '0.05s' }}>
            <h3 className="setup__section-title">
              <span className="setup__section-num">01</span>
              Your Name
            </h3>
            <div className="setup__name-wrap">
              <span className="setup__name-icon">🎮</span>
              <input
                className="setup__name-input"
                type="text"
                placeholder="Enter your name…"
                value={selected.playerName}
                onChange={e => set('playerName', e.target.value)}
                maxLength={30}
                autoFocus
              />
              {selected.playerName.length >= 2 && <span className="setup__check">✓</span>}
            </div>
          </section>

          {/* Category */}
          <section className="setup__section animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            <h3 className="setup__section-title">
              <span className="setup__section-num">02</span>
              Choose Category
            </h3>
            <div className="setup__grid">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`cat-card ${selected.category === cat.id ? 'cat-card--active' : ''}`}
                  style={{ '--cat-color': cat.color }}
                  onClick={() => set('category', cat.id)}
                >
                  <span className="cat-card__icon">{cat.icon}</span>
                  <span className="cat-card__name">{cat.name}</span>
                  <span className="cat-card__desc">{cat.description}</span>
                  {selected.category === cat.id && <span className="cat-card__check">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty */}
          <section className="setup__section animate-fadeUp" style={{ animationDelay: '0.15s' }}>
            <h3 className="setup__section-title">
              <span className="setup__section-num">03</span>
              Select Difficulty
            </h3>
            <div className="diff-list">
              {difficulties.map(d => {
                const meta = DIFF_META[d.id] || {};
                return (
                  <button
                    key={d.id}
                    className={`diff-card ${selected.difficulty === d.id ? 'diff-card--active' : ''}`}
                    style={{ '--diff-color': d.color }}
                    onClick={() => set('difficulty', d.id)}
                  >
                    <span className="diff-card__emoji">{meta.emoji}</span>
                    <div className="diff-card__info">
                      <span className="diff-card__name">{d.label}</span>
                      <span className="diff-card__desc">{meta.desc}</span>
                    </div>
                    <div className="diff-card__mult">×{d.multiplier}</div>
                    {selected.difficulty === d.id && <span className="diff-card__check">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Summary bar */}
          {canStart && (
            <div className="setup__summary animate-scaleIn">
              <div className="summary__info">
                <span className="summary__player">🎮 {selected.playerName}</span>
                <span className="summary__sep">·</span>
                <span>{categories.find(c => c.id === selected.category)?.icon}</span>
                <span>{categories.find(c => c.id === selected.category)?.name}</span>
                <span className="summary__sep">·</span>
                <span>{DIFF_META[selected.difficulty]?.emoji}</span>
                <span style={{ textTransform: 'capitalize' }}>{selected.difficulty}</span>
              </div>
              <span className="summary__count">10 Questions</span>
            </div>
          )}

          {error && <p className="setup__error animate-scaleIn">{error}</p>}

          <button
            className="btn-primary setup__start"
            disabled={!canStart || starting}
            onClick={handleStart}
          >
            {starting ? (
              <>
                <div className="spinner spinner--sm" />
                Preparing Quiz…
              </>
            ) : (
              <>
                Begin Quiz
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
