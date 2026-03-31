const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCategories: () => apiFetch('/categories'),
  getDifficulties: () => apiFetch('/difficulties'),
  startQuiz: (payload) => apiFetch('/quiz/start', { method: 'POST', body: JSON.stringify(payload) }),
  submitAnswer: (payload) => apiFetch('/quiz/answer', { method: 'POST', body: JSON.stringify(payload) }),
  completeQuiz: (sessionId) => apiFetch(`/quiz/complete/${sessionId}`, { method: 'POST' }),
};
