import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/App.css';
import TitleScreen from './components/TitleScreen';
import GameWorld from './components/GameWorld';
import { CHAPTER2_INTRO, FINAL_LINES } from './lib/gameData';

// ─── DEATH RECAP SCREEN ──────────────────────────────────
function DeathRecapScreen({ stats, onContinue }) {
  const dodgeRate = stats.dodgeAttempts > 0 ? Math.round((stats.dodgeSuccess / stats.dodgeAttempts) * 100) : 0;
  const parryRate = stats.parryAttempts > 0 ? Math.round((stats.parrySuccess / stats.parryAttempts) * 100) : 0;
  const totalQte = (stats.dodgeAttempts || 0) + (stats.parryAttempts || 0);
  const totalSuccess = (stats.dodgeSuccess || 0) + (stats.parrySuccess || 0);
  const overallRate = totalQte > 0 ? Math.round((totalSuccess / totalQte) * 100) : 0;

  // Mastery grade
  let grade = 'F', gradeColor = '#5a5a62';
  if (overallRate >= 90 && stats.hitsLanded >= 20) { grade = 'S'; gradeColor = '#C5A059'; }
  else if (overallRate >= 75 && stats.hitsLanded >= 15) { grade = 'A'; gradeColor = '#4a9a4a'; }
  else if (overallRate >= 55 && stats.hitsLanded >= 10) { grade = 'B'; gradeColor = '#3a6aaa'; }
  else if (overallRate >= 35) { grade = 'C'; gradeColor = '#8a6a3a'; }
  else if (overallRate >= 15 || stats.hitsLanded >= 5) { grade = 'D'; gradeColor = '#8a4a3a'; }

  const statRows = [
    { label: 'Hits Landed', value: stats.hitsLanded || 0 },
    { label: 'Damage Dealt', value: stats.damageDealt || 0 },
    { label: 'Damage Taken', value: stats.damageTaken || 0 },
    { label: 'Dodges', value: `${stats.dodgeSuccess || 0} / ${stats.dodgeAttempts || 0}`, sub: `${dodgeRate}%` },
    { label: 'Parries', value: `${stats.parrySuccess || 0} / ${stats.parryAttempts || 0}`, sub: `${parryRate}%` },
    { label: 'Dashes', value: stats.dashCount || 0 },
    { label: 'Skills Awakened', value: (stats.unlockedSkills || []).length },
    { label: 'Survival Time', value: `${stats.battleTime || 0}s` },
  ];

  return (
    <div className="death-recap-screen" data-testid="death-recap-screen">
      <motion.div
        className="death-recap-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div className="death-recap-header" data-testid="death-recap-header">
          <div className="death-recap-title">FALLEN</div>
          <div className="death-recap-subtitle">Kairen has cast you into the ravine</div>
        </div>

        <motion.div
          className="death-recap-grade"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 1.2, stiffness: 200 }}
          style={{ color: gradeColor, borderColor: gradeColor }}
          data-testid="death-recap-grade"
        >
          {grade}
        </motion.div>
        <div className="death-recap-grade-label" style={{ color: gradeColor }}>MASTERY GRADE</div>

        <div className="death-recap-stats" data-testid="death-recap-stats">
          {statRows.map((row, i) => (
            <motion.div
              key={row.label}
              className="death-recap-stat-row"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.12 }}
            >
              <span className="stat-label">{row.label}</span>
              <span className="stat-value">
                {row.value}
                {row.sub && <span className="stat-sub">{row.sub}</span>}
              </span>
            </motion.div>
          ))}
        </div>

        {(stats.unlockedSkills || []).length > 0 && (
          <motion.div
            className="death-recap-skills"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
          >
            <div className="death-recap-skills-title">Skills Awakened</div>
            <div className="death-recap-skills-list">
              {stats.unlockedSkills.map(s => (
                <span key={s} className="death-recap-skill-tag">{s.replace(/_/g, ' ')}</span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          className="death-recap-continue"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1] }}
          transition={{ delay: 3.5, duration: 2, repeat: Infinity }}
          onClick={onContinue}
          data-testid="death-recap-continue"
        >
          Click to continue
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── STORY INTERLUDE / ENDING SCREEN ──────────────────────
function StoryScreen({ lines, title, prompt, onDone, testId }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const finished = lineIndex >= lines.length;

  useEffect(() => {
    if (finished) return;
    const line = lines[lineIndex];
    let charIdx = 0;
    setDisplayText('');
    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayText(line.slice(0, charIdx));
      if (charIdx >= line.length) {
        clearInterval(typeInterval);
        setTimeout(() => setLineIndex(i => i + 1), 1400);
      }
    }, 45);
    return () => clearInterval(typeInterval);
  }, [lineIndex, lines, finished]);

  useEffect(() => {
    const skip = (e) => { if (e.key === 'Escape') setLineIndex(lines.length); };
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [lines.length]);

  return (
    <div className="ending-screen" data-testid={testId}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
        {finished ? (
          <>
            <div className="ending-title" data-testid={`${testId}-title`}>{title}</div>
            <motion.p
              className="title-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ cursor: 'pointer' }}
              onClick={onDone}
              data-testid={`${testId}-continue`}
            >
              {prompt}
            </motion.p>
          </>
        ) : (
          <>
            <p className="ending-text" data-testid="ending-text">{displayText}</p>
            <span className="story-skip">ESC to skip</span>
          </>
        )}
      </motion.div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('title'); // title | game | deathRecap | interlude | chapter2 | ending
  const [combatStats, setCombatStats] = useState(null);

  const handleStart = useCallback(() => setScreen('game'), []);
  const handleEnding = useCallback((stats) => {
    setCombatStats(stats || {});
    setScreen('deathRecap');
  }, []);
  const handleRecapContinue = useCallback(() => setScreen('interlude'), []);
  const handleInterludeDone = useCallback(() => setScreen('chapter2'), []);
  const handleChapter2End = useCallback(() => setScreen('ending'), []);
  const handleRestart = useCallback(() => { setCombatStats(null); setScreen('title'); }, []);

  const fade = (key, children, duration = 1) => (
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }} style={{ width: '100%', height: '100%' }}>
      {children}
    </motion.div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'title' && fade('title', <TitleScreen onStart={handleStart} />, 0.5)}
        {screen === 'game' && fade('game', <GameWorld chapter="village" onEnding={handleEnding} />, 0.8)}
        {screen === 'deathRecap' && fade('deathRecap', <DeathRecapScreen stats={combatStats} onContinue={handleRecapContinue} />)}
        {screen === 'interlude' && fade('interlude', <StoryScreen lines={CHAPTER2_INTRO} title="Chapter II" prompt="Press to wake up" onDone={handleInterludeDone} testId="interlude-screen" />, 1.5)}
        {screen === 'chapter2' && fade('chapter2', <GameWorld chapter="ravine" onEnding={handleChapter2End} />, 0.8)}
        {screen === 'ending' && fade('ending', <StoryScreen lines={FINAL_LINES} title="To Be Continued..." prompt="Press to play again" onDone={handleRestart} testId="ending-screen" />, 1.5)}
      </AnimatePresence>
    </div>
  );
}

export default App;
