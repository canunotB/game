import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QTE_ARROWS, QTE_KEYS } from '../lib/gameData';

// ─── Player HUD ──────────────────────────────────────────
export function PlayerHUD({ hp, maxHp }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="game-hud" data-testid="player-hud">
      <div>
        <div className="hp-label">Vitality</div>
        <div className="hp-bar-container">
          <div
            className={`hp-bar-fill ${pct < 30 ? 'low' : ''}`}
            style={{ width: `${pct}%` }}
            data-testid="player-hp-bar"
          />
        </div>
        <div className="hp-text">{hp} / {maxHp}</div>
      </div>
    </div>
  );
}

// ─── Boss Health Bar ─────────────────────────────────────
export function BossBar({ hp, maxHp, name }) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  return (
    <div className="boss-bar" data-testid="boss-bar">
      <div className="boss-name">{name}</div>
      <div className="boss-hp-container">
        <div className="boss-hp-fill" style={{ width: `${pct}%` }} data-testid="boss-hp-bar" />
      </div>
    </div>
  );
}

// ─── Dialogue Box ────────────────────────────────────────
export function DialogueBox({ speaker, text, onContinue, isTyping }) {
  return (
    <motion.div
      className="dialogue-box"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      data-testid="dialogue-box"
    >
      <div className="dialogue-speaker" data-testid="dialogue-speaker">{speaker}</div>
      <div className="dialogue-text" data-testid="dialogue-text">
        {text}
        {isTyping && <span style={{ opacity: 0.4 }}>|</span>}
      </div>
      {!isTyping && (
        <div className="dialogue-continue" data-testid="dialogue-continue">
          Press ENTER to continue
        </div>
      )}
    </motion.div>
  );
}

// ─── QTE System ──────────────────────────────────────────
export function QTEOverlay({ sequence, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]); // 'perfect' | 'good' | 'miss'
  const [timeLeft, setTimeLeft] = useState(100);
  const [showResult, setShowResult] = useState(null);
  const startTimeRef = useRef(Date.now());
  const keyTimeRef = useRef(Date.now());
  const doneRef = useRef(false);
  const timerRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    const totalTime = 3000 + sequence.length * 800; // ms
    startTimeRef.current = Date.now();
    keyTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / totalTime) * 100);
      setTimeLeft(pct);
      if (pct <= 0 && !doneRef.current) {
        doneRef.current = true;
        clearInterval(timerRef.current);
        onComplete('miss');
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [sequence, onComplete]);

  const handleKey = useCallback(
    (e) => {
      if (doneRef.current) return;
      const pressed = QTE_KEYS[e.key];
      if (!pressed) return;

      const expected = sequence[currentIdx];
      const timeSinceKey = Date.now() - keyTimeRef.current;

      if (pressed === expected) {
        const grade = timeSinceKey < 200 ? 'perfect' : timeSinceKey < 500 ? 'good' : 'late';
        const newResults = [...results, grade];
        setResults(newResults);
        keyTimeRef.current = Date.now();

        if (currentIdx + 1 >= sequence.length) {
          doneRef.current = true;
          clearInterval(timerRef.current);
          const perfects = newResults.filter((r) => r === 'perfect').length;
          const goods = newResults.filter((r) => r === 'good').length;
          let finalResult;
          if (perfects === sequence.length) finalResult = 'perfect';
          else if (perfects + goods === sequence.length) finalResult = 'good';
          else finalResult = 'late';

          setShowResult(finalResult);
          setTimeout(() => onComplete(finalResult), 800);
        } else {
          setCurrentIdx((i) => i + 1);
        }
      } else {
        doneRef.current = true;
        clearInterval(timerRef.current);
        setResults([...results, 'miss']);
        setShowResult('miss');
        setTimeout(() => onComplete('miss'), 600);
      }
    },
    [currentIdx, results, sequence, onComplete]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="qte-overlay" data-testid="qte-overlay">
      <div className="qte-label">REACT!</div>
      <div className="qte-arrows">
        {sequence.map((arrow, i) => (
          <div
            key={i}
            className={`qte-arrow ${
              i === currentIdx && !showResult
                ? 'active'
                : i < currentIdx
                ? results[i] === 'perfect' || results[i] === 'good'
                  ? 'success'
                  : 'failed'
                : ''
            }`}
            data-testid={`qte-arrow-${i}`}
          >
            {QTE_ARROWS[arrow]}
          </div>
        ))}
      </div>
      <div className="qte-timer">
        <div className="qte-timer-fill" style={{ width: `${timeLeft}%` }} data-testid="qte-timer" />
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            className={`qte-result ${showResult}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="qte-result"
          >
            {showResult === 'perfect'
              ? 'PERFECT!'
              : showResult === 'good'
              ? 'BLOCKED!'
              : showResult === 'late'
              ? 'GRAZED'
              : 'HIT!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Environment Prompt ──────────────────────────────────
export function EnvPrompt({ text, screenX, screenY }) {
  return (
    <div
      className="env-prompt"
      style={{ left: screenX, top: screenY }}
      data-testid="env-prompt"
    >
      {text}
    </div>
  );
}

// ─── Inventory Display ───────────────────────────────────
export function InventoryDisplay({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="inventory-display" data-testid="inventory-display">
      {items.map((item, i) => (
        <div key={i} className="inv-slot active">
          {item === 'rock' ? '.' : '?'}
        </div>
      ))}
    </div>
  );
}

// ─── Controls Help ───────────────────────────────────────
export function ControlsHelp({ mode }) {
  return (
    <div className="controls-help" data-testid="controls-help">
      <div className="control-hint">
        <span className="key-bind">WASD</span> move
      </div>
      {mode === 'explore' && (
        <div className="control-hint">
          <span className="key-bind">E</span> interact
        </div>
      )}
      {mode === 'battle' && (
        <>
          <div className="control-hint">
            <span className="key-bind">SPACE</span> attack
          </div>
          <div className="control-hint">
            <span className="key-bind">E</span> pick up
          </div>
          <div className="control-hint">
            <span className="key-bind">Q</span> throw
          </div>
          <div className="control-hint">
            <span className="key-bind">SHIFT</span> dodge
          </div>
        </>
      )}
    </div>
  );
}

// ─── Damage Flash ────────────────────────────────────────
export function DamageFlash() {
  return <div className="damage-flash" data-testid="damage-flash" />;
}
