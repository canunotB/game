import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QTE_ARROWS, QTE_KEYS, DIALOGUE_TONES, getReputationTitle,
  ALL_SKILLS, ALL_EQUIPMENT, DEFAULT_KEYBINDS, KEYBIND_LABELS,
} from '../lib/gameData';

// ─── Player HUD ──────────────────────────────────────────
export function PlayerHUD({ hp, maxHp, stamina, maxStamina, mana, maxMana, reputation }) {
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const stPct = Math.max(0, (stamina / maxStamina) * 100);
  const mnPct = Math.max(0, (mana / maxMana) * 100);
  const repTitle = getReputationTitle(reputation);
  return (
    <div className="game-hud" data-testid="player-hud">
      <div>
        <div className="hp-label">Vitality</div>
        <div className="hp-bar-container"><div className={`hp-bar-fill ${hpPct < 30 ? 'low' : ''}`} style={{ width: `${hpPct}%` }} data-testid="player-hp-bar" /></div>
        <div className="hp-text">{hp} / {maxHp}</div>
      </div>
      <div>
        <div className="hp-label st-label">Stamina</div>
        <div className="hp-bar-container st-bar"><div className="hp-bar-fill stamina-fill" style={{ width: `${stPct}%` }} data-testid="player-stamina-bar" /></div>
      </div>
      <div>
        <div className="hp-label mn-label">Mana</div>
        <div className="hp-bar-container mn-bar"><div className="hp-bar-fill mana-fill" style={{ width: `${mnPct}%` }} data-testid="player-mana-bar" /></div>
      </div>
      <div className="rep-display" data-testid="reputation-display">
        <span className="rep-label">Reputation:</span> <span className="rep-value">{repTitle}</span>
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
      <div className="boss-hp-container"><div className="boss-hp-fill" style={{ width: `${pct}%` }} data-testid="boss-hp-bar" /></div>
    </div>
  );
}

// ─── Dialogue Box ────────────────────────────────────────
export function DialogueBox({ speaker, text, isTyping, choices, onChoose }) {
  return (
    <motion.div className="dialogue-box" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} data-testid="dialogue-box">
      <div className="dialogue-speaker" data-testid="dialogue-speaker">{speaker}</div>
      <div className="dialogue-text" data-testid="dialogue-text">{text}{isTyping && <span style={{ opacity: 0.4 }}>|</span>}</div>
      {!isTyping && choices && choices.length > 0 && (
        <div className="dialogue-choices" data-testid="dialogue-choices">
          {choices.map((c, i) => {
            const tone = DIALOGUE_TONES[c.tone];
            return (
              <button key={i} className="dialogue-choice-btn" onClick={() => onChoose(c)} data-testid={`dialogue-choice-${i}`}>
                <span className="choice-tone" style={{ color: tone.color }}>[{tone.label}]</span> {c.text}
              </button>
            );
          })}
        </div>
      )}
      {!isTyping && !choices && <div className="dialogue-continue" data-testid="dialogue-continue">Press ENTER to continue</div>}
    </motion.div>
  );
}

// ─── QTE System ──────────────────────────────────────────
export function QTEOverlay({ sequence, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(100);
  const [showResult, setShowResult] = useState(null);
  const doneRef = { current: false };
  const startRef = { current: Date.now() };
  const keyRef = { current: Date.now() };

  useEffect(() => {
    startRef.current = Date.now();
    keyRef.current = Date.now();
    const totalTime = 2000 + sequence.length * 500;
    const timer = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - startRef.current) / totalTime) * 100);
      setTimeLeft(pct);
      if (pct <= 0 && !doneRef.current) { doneRef.current = true; clearInterval(timer); onComplete('miss'); }
    }, 50);
    return () => clearInterval(timer);
  }, [sequence, onComplete]);

  const handleKey = useCallback((e) => {
    if (doneRef.current) return;
    const pressed = QTE_KEYS[e.key];
    if (!pressed) return;
    const expected = sequence[currentIdx];
    const dt = Date.now() - keyRef.current;
    if (pressed === expected) {
      const grade = dt < 180 ? 'perfect' : dt < 400 ? 'good' : 'late';
      const nr = [...results, grade];
      setResults(nr);
      keyRef.current = Date.now();
      if (currentIdx + 1 >= sequence.length) {
        doneRef.current = true;
        const p = nr.filter(r => r === 'perfect').length;
        const g = nr.filter(r => r === 'good').length;
        const final = p === sequence.length ? 'perfect' : p + g === sequence.length ? 'good' : 'late';
        setShowResult(final);
        setTimeout(() => onComplete(final), 500);
      } else { setCurrentIdx(i => i + 1); }
    } else {
      doneRef.current = true;
      setResults([...results, 'miss']);
      setShowResult('miss');
      setTimeout(() => onComplete('miss'), 400);
    }
  }, [currentIdx, results, sequence, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="qte-overlay" data-testid="qte-overlay">
      <div className="qte-label">REACT!</div>
      <div className="qte-arrows">
        {sequence.map((arrow, i) => (
          <div key={i} className={`qte-arrow ${i === currentIdx && !showResult ? 'active' : i < currentIdx ? (results[i] === 'miss' ? 'failed' : 'success') : ''}`} data-testid={`qte-arrow-${i}`}>
            {QTE_ARROWS[arrow]}
          </div>
        ))}
      </div>
      <div className="qte-timer"><div className="qte-timer-fill" style={{ width: `${timeLeft}%` }} data-testid="qte-timer" /></div>
      <AnimatePresence>
        {showResult && (
          <motion.div className={`qte-result ${showResult}`} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} data-testid="qte-result">
            {showResult === 'perfect' ? 'PERFECT COUNTER!' : showResult === 'good' ? 'BLOCKED!' : showResult === 'late' ? 'GRAZED' : 'HIT!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skill Bar (bottom-center during battle) ─────────────
export function SkillBar({ equippedSkills, cooldowns, mana, keybinds }) {
  return (
    <div className="skill-bar" data-testid="skill-bar">
      {equippedSkills.map((skillId, i) => {
        const skill = ALL_SKILLS.find(s => s.id === skillId);
        if (!skill) return <div key={i} className="skill-slot empty" data-testid={`skill-slot-${i}`} />;
        const cd = cooldowns[skillId] || 0;
        const canUse = cd <= 0 && mana >= skill.manaCost;
        const cdPct = cd > 0 ? (cd / skill.cooldown) * 100 : 0;
        const keyLabel = keybinds[`skill${i + 1}`] || (i + 1).toString();
        return (
          <div key={i} className={`skill-slot ${canUse ? 'ready' : 'on-cd'}`} data-testid={`skill-slot-${i}`} title={`${skill.name} - ${skill.desc}`}>
            <div className="skill-icon" style={{ color: skill.color }}>{skill.icon}</div>
            {cd > 0 && <div className="skill-cd-overlay" style={{ height: `${cdPct}%` }} />}
            <div className="skill-key">{keyLabel}</div>
            <div className="skill-name-tag">{skill.name}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recovery Prompt (after QTE) ─────────────────────────
export function RecoveryPrompt({ direction }) {
  const arrows = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' };
  return (
    <motion.div
      className="recovery-prompt"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="recovery-prompt"
    >
      <div className="recovery-label">CATCH!</div>
      <div className="recovery-arrow">{arrows[direction]}</div>
    </motion.div>
  );
}

// ─── Game Menu (Tab) ─────────────────────────────────────
export function GameMenu({ equippedSkills, setEquippedSkills, equipment, setEquipment, keybinds, setKeybinds, onClose }) {
  const [tab, setTab] = useState('skills');
  const [rebindAction, setRebindAction] = useState(null);

  useEffect(() => {
    if (!rebindAction) return;
    const handler = (e) => {
      e.preventDefault();
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
      if (key === 'escape') { setRebindAction(null); return; }
      setKeybinds(prev => {
        const next = { ...prev, [rebindAction]: key };
        localStorage.setItem('odyssey_keybinds', JSON.stringify(next));
        return next;
      });
      setRebindAction(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rebindAction, setKeybinds]);

  const toggleSkill = (skillId) => {
    setEquippedSkills(prev => {
      if (prev.includes(skillId)) return prev.filter(s => s !== skillId);
      if (prev.length >= 5) return prev;
      return [...prev, skillId];
    });
  };

  const cycleEquipment = (slot) => {
    const items = ALL_EQUIPMENT[slot + 's'] || ALL_EQUIPMENT[slot];
    if (!items) return;
    setEquipment(prev => {
      const idx = items.findIndex(i => i.id === prev[slot]);
      const next = items[(idx + 1) % items.length];
      return { ...prev, [slot]: next.id };
    });
  };

  const keyDisplay = (k) => {
    if (k === ' ') return 'SPACE';
    if (k === 'tab') return 'TAB';
    if (k === 'shift') return 'SHIFT';
    return k.toUpperCase();
  };

  return (
    <div className="game-menu-overlay" data-testid="game-menu">
      <div className="game-menu">
        <div className="menu-header">
          <div className="menu-tabs">
            <button className={`menu-tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')} data-testid="menu-tab-skills">Skills</button>
            <button className={`menu-tab ${tab === 'equipment' ? 'active' : ''}`} onClick={() => setTab('equipment')} data-testid="menu-tab-equipment">Equipment</button>
            <button className={`menu-tab ${tab === 'keybinds' ? 'active' : ''}`} onClick={() => setTab('keybinds')} data-testid="menu-tab-keybinds">Keybinds</button>
          </div>
          <button className="menu-close" onClick={onClose} data-testid="menu-close">ESC</button>
        </div>

        <div className="menu-content">
          {tab === 'skills' && (
            <div className="menu-skills" data-testid="menu-skills-panel">
              <div className="menu-section-title">Equipped ({equippedSkills.length}/5)</div>
              <div className="skills-grid">
                {ALL_SKILLS.map(skill => {
                  const equipped = equippedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      className={`skill-card ${equipped ? 'equipped' : ''}`}
                      onClick={() => toggleSkill(skill.id)}
                      data-testid={`skill-card-${skill.id}`}
                    >
                      <div className="skill-card-icon" style={{ color: skill.color }}>{skill.icon}</div>
                      <div className="skill-card-info">
                        <div className="skill-card-name">{skill.name}</div>
                        <div className="skill-card-desc">{skill.desc}</div>
                        <div className="skill-card-stats">
                          <span>Mana: {skill.manaCost}</span>
                          <span>CD: {skill.cooldown}s</span>
                          {skill.damage > 0 && <span>DMG: {skill.damage}</span>}
                          {skill.healAmount && <span>Heal: {skill.healAmount}</span>}
                        </div>
                      </div>
                      <div className={`skill-equip-badge ${equipped ? 'on' : ''}`}>{equipped ? 'Equipped' : 'Equip'}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'equipment' && (
            <div className="menu-equipment" data-testid="menu-equipment-panel">
              {['weapon', 'armor', 'accessory'].map(slot => {
                const items = ALL_EQUIPMENT[slot + 's'] || ALL_EQUIPMENT[slot];
                const current = items?.find(i => i.id === equipment[slot]) || items?.[0];
                return (
                  <div key={slot} className="equip-slot-card" data-testid={`equip-slot-${slot}`}>
                    <div className="equip-slot-label">{slot.toUpperCase()}</div>
                    <button className="equip-cycle-btn" onClick={() => cycleEquipment(slot)} data-testid={`equip-cycle-${slot}`}>
                      <div className="equip-item-name">{current?.name || 'None'}</div>
                      <div className="equip-item-desc">{current?.desc || ''}</div>
                      {current?.damage !== undefined && <div className="equip-stat">DMG: {current.damage}</div>}
                      {current?.defense !== undefined && current.defense > 0 && <div className="equip-stat">DEF: {current.defense}</div>}
                      {current?.speedBonus && <div className="equip-stat">SPD: +{current.speedBonus}</div>}
                      {current?.manaBonus && <div className="equip-stat">MANA: +{current.manaBonus}</div>}
                    </button>
                    <div className="equip-hint">Click to cycle</div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'keybinds' && (
            <div className="menu-keybinds" data-testid="menu-keybinds-panel">
              <div className="menu-section-title">Click an action, then press a key to rebind</div>
              <div className="keybinds-list">
                {Object.entries(KEYBIND_LABELS).map(([action, label]) => (
                  <button
                    key={action}
                    className={`keybind-row ${rebindAction === action ? 'rebinding' : ''}`}
                    onClick={() => setRebindAction(action)}
                    data-testid={`keybind-${action}`}
                  >
                    <span className="keybind-action">{label}</span>
                    <span className="keybind-key">{rebindAction === action ? 'Press key...' : keyDisplay(keybinds[action] || DEFAULT_KEYBINDS[action])}</span>
                  </button>
                ))}
              </div>
              <button
                className="keybind-reset-btn"
                onClick={() => { setKeybinds({ ...DEFAULT_KEYBINDS }); localStorage.removeItem('odyssey_keybinds'); }}
                data-testid="keybind-reset"
              >
                Reset to Defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory Display ───────────────────────────────────
export function InventoryDisplay({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="inventory-display" data-testid="inventory-display">
      {items.map((item, i) => (<div key={i} className="inv-slot active">{item === 'rock' ? '.' : '?'}</div>))}
    </div>
  );
}

// ─── Controls Help ───────────────────────────────────────
export function ControlsHelp({ mode, keybinds }) {
  const kd = (k) => {
    if (k === ' ') return 'SPACE';
    if (k === 'shift') return 'SHIFT';
    if (k === 'tab') return 'TAB';
    return k.toUpperCase();
  };
  return (
    <div className="controls-help" data-testid="controls-help">
      <div className="control-hint"><span className="key-bind">{kd(keybinds.moveUp)}{kd(keybinds.moveLeft)}{kd(keybinds.moveDown)}{kd(keybinds.moveRight)}</span> move</div>
      <div className="control-hint"><span className="key-bind">{kd(keybinds.menu)}</span> menu</div>
      {mode === 'explore' && <div className="control-hint"><span className="key-bind">{kd(keybinds.interact)}</span> interact</div>}
      {mode === 'battle' && (
        <>
          <div className="control-hint"><span className="key-bind">M1</span> attack</div>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.dash)}</span> dash</div>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.jump)}</span> jump</div>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.interact)}</span> pick up</div>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.throw)}</span> throw</div>
          <div className="control-hint"><span className="key-bind">1-5</span> skills</div>
        </>
      )}
    </div>
  );
}

// ─── Damage Flash ────────────────────────────────────────
export function DamageFlash() {
  return <div className="damage-flash" data-testid="damage-flash" />;
}
