import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@/App.css';
import TitleScreen from './components/TitleScreen';
import GameWorld from './components/GameWorld';
import { ENDING_LINES } from './lib/gameData';

function EndingScreen({ onRestart }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');

  useState(() => {
    let idx = 0;
    const showNextLine = () => {
      if (idx >= ENDING_LINES.length) return;
      const line = ENDING_LINES[idx];
      let charIdx = 0;
      setDisplayText('');
      const typeInterval = setInterval(() => {
        charIdx++;
        setDisplayText(line.slice(0, charIdx));
        if (charIdx >= line.length) {
          clearInterval(typeInterval);
          setTimeout(() => {
            idx++;
            setLineIndex(idx);
            showNextLine();
          }, 1500);
        }
      }, 50);
    };
    setTimeout(showNextLine, 1000);
  }, []);

  return (
    <div className="ending-screen" data-testid="ending-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {lineIndex >= ENDING_LINES.length ? (
          <>
            <div className="ending-title" data-testid="ending-title">To Be Continued...</div>
            <motion.p
              className="title-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              style={{ cursor: 'pointer' }}
              onClick={onRestart}
              data-testid="restart-button"
            >
              Press to play again
            </motion.p>
          </>
        ) : (
          <p className="ending-text" data-testid="ending-text">{displayText}</p>
        )}
      </motion.div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('title'); // title | game | ending

  const handleStart = useCallback(() => setScreen('game'), []);
  const handleEnding = useCallback(() => setScreen('ending'), []);
  const handleRestart = useCallback(() => setScreen('title'), []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {screen === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <TitleScreen onStart={handleStart} />
          </motion.div>
        )}

        {screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', height: '100%' }}
          >
            <GameWorld onEnding={handleEnding} />
          </motion.div>
        )}

        {screen === 'ending' && (
          <motion.div
            key="ending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <EndingScreen onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
