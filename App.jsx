import React, { useState } from 'react';
import Landing from './components/Landing';
import Setup from './components/Setup';
import Quiz from './components/Quiz';
import Results from './components/Results';

const SCREENS = { LANDING: 'landing', SETUP: 'setup', QUIZ: 'quiz', RESULTS: 'results' };

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [setupData, setSetupData] = useState(null);
  const [quizSession, setQuizSession] = useState(null);
  const [resultData, setResultData] = useState(null);

  const go = (s) => setScreen(s);

  return (
    <div className="page-wrapper">
      {/* Ambient background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {screen === SCREENS.LANDING && (
        <Landing onStart={() => go(SCREENS.SETUP)} />
      )}
      {screen === SCREENS.SETUP && (
        <Setup
          onBack={() => go(SCREENS.LANDING)}
          onStart={(session) => {
            setQuizSession(session);
            go(SCREENS.QUIZ);
          }}
        />
      )}
      {screen === SCREENS.QUIZ && quizSession && (
        <Quiz
          session={quizSession}
          onComplete={(result) => {
            setResultData(result);
            go(SCREENS.RESULTS);
          }}
          onQuit={() => go(SCREENS.LANDING)}
        />
      )}
      {screen === SCREENS.RESULTS && resultData && (
        <Results
          data={resultData}
          onPlayAgain={() => go(SCREENS.SETUP)}
          onHome={() => go(SCREENS.LANDING)}
        />
      )}
    </div>
  );
}
