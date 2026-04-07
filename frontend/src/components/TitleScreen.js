import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STORY_LINES } from '../lib/gameData';

export default function TitleScreen({ onStart }) {
  const [phase, setPhase] = useState('title'); // title | story
  const [storyIndex, setStoryIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [typing, setTyping] = useState(false);

  const handleKeyDown = useCallback(
    (e) => {
      if (phase === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        setPhase('story');
      } else if (phase === 'story') {
        if (typing) {
          setDisplayText(STORY_LINES[storyIndex]);
          setTyping(false);
        } else if (e.key === 'Escape') {
          onStart();
        } else {
          if (storyIndex < STORY_LINES.length - 1) {
            setStoryIndex((i) => i + 1);
          } else {
            onStart();
          }
        }
      }
    },
    [phase, storyIndex, typing, onStart]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'story') return;
    const line = STORY_LINES[storyIndex];
    setDisplayText('');
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(line.slice(0, i));
      if (i >= line.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [storyIndex, phase]);

  // Rain drops for title
  const rainDrops = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    height: `${12 + Math.random() * 20}px`,
    duration: `${0.5 + Math.random() * 0.8}s`,
    delay: `${Math.random() * 2}s`,
  }));

  return (
    <div className="title-screen" data-testid="title-screen">
      {/* Rain */}
      <div className="title-rain">
        {rainDrops.map((d) => (
          <div
            key={d.id}
            className="rain-drop"
            style={{
              left: d.left,
              height: d.height,
              animationDuration: d.duration,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'title' && (
          <motion.div
            key="title"
            className="title-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <h1 className="title-text" data-testid="game-title">
              ODYSSEY'S
              <br />
              WRATH
            </h1>
            <p className="title-subtitle">A prophecy foretold your end</p>
            <p className="title-prompt" data-testid="start-prompt">
              Press ENTER to begin
            </p>
          </motion.div>
        )}

        {phase === 'story' && (
          <motion.div
            key="story"
            className="story-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.p
              key={storyIndex}
              className="story-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              data-testid="story-text"
            >
              {displayText}
              {typing && (
                <span
                  style={{ opacity: 0.5 }}
                  className="animate-pulse"
                >
                  |
                </span>
              )}
            </motion.p>
            <span className="story-skip" data-testid="story-skip">
              {storyIndex < STORY_LINES.length - 1
                ? 'Press any key to continue / ESC to skip'
                : 'Press any key to begin'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
