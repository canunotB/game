import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QTE_ARROWS, QTE_KEYS, DIALOGUE_TONES, getReputationTitle,
  ALL_SKILLS, ALL_EQUIPMENT, DEFAULT_KEYBINDS, KEYBIND_LABELS,
  SKILL_UNLOCK_CONDITIONS, SKILL_UNLOCK_ORDER,
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

// ─── QTE System (Parry / Dodge / Barrage) ────────────────
export function QTEOverlay({ sequence, attackType, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [timeLeft, setTimeLeft] = useState(100);
  const [showResult, setShowResult] = useState(null);
  const doneRef = useRef(false);
  const startRef = useRef(Date.now());
  const keyRef = useRef(Date.now());
  const resultsRef = useRef([]);
  const isBarrage = attackType === 'barrage';

  useEffect(() => {
    startRef.current = Date.now();
    keyRef.current = Date.now();
    // Parry = very tight, Dodge = moderate, Barrage = longer
    const totalTime = attackType === 'parry' ? 1200 : attackType === 'dodge' ? 2000 + sequence.length * 400 : 2500 + sequence.length * 350;
    const timer = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - startRef.current) / totalTime) * 100);
      setTimeLeft(pct);
      if (pct <= 0 && !doneRef.current) {
        doneRef.current = true; clearInterval(timer);
        // On timeout: count remaining arrows as missed
        const missed = sequence.length - resultsRef.current.filter(r => r !== 'miss').length;
        setShowResult('miss');
        setTimeout(() => onComplete('miss', missed), 400);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [sequence, attackType, onComplete]);

  const handleKey = useCallback((e) => {
    if (doneRef.current) return;
    const pressed = QTE_KEYS[e.key];
    if (!pressed) return;
    const expected = sequence[currentIdx];
    const dt = Date.now() - keyRef.current;

    if (pressed === expected) {
      const grade = dt < 350 ? 'perfect' : dt < 700 ? 'good' : 'late';
      const nr = [...results, grade];
      setResults(nr); resultsRef.current = nr;
      keyRef.current = Date.now();
      if (currentIdx + 1 >= sequence.length) {
        doneRef.current = true;
        const p = nr.filter(r => r === 'perfect').length;
        const g = nr.filter(r => r === 'good').length;
        const missed = nr.filter(r => r === 'miss').length;
        const final = p === sequence.length ? 'perfect' : (p + g) === sequence.length ? 'good' : missed > 0 ? 'miss' : 'late';
        setShowResult(final);
        setTimeout(() => onComplete(final, missed), 500);
      } else { setCurrentIdx(i => i + 1); }
    } else {
      if (isBarrage) {
        // Barrage: wrong key counts as miss but CONTINUES
        const nr = [...results, 'miss'];
        setResults(nr); resultsRef.current = nr;
        keyRef.current = Date.now();
        if (currentIdx + 1 >= sequence.length) {
          doneRef.current = true;
          const missed = nr.filter(r => r === 'miss').length;
          const final = missed === 0 ? 'perfect' : 'miss';
          setShowResult(final);
          setTimeout(() => onComplete(final, missed), 500);
        } else { setCurrentIdx(i => i + 1); }
      } else {
        // Parry / Dodge: wrong key = immediate fail
        doneRef.current = true;
        const nr = [...results, 'miss'];
        setResults(nr); resultsRef.current = nr;
        setShowResult('miss');
        setTimeout(() => onComplete('miss', 1), 400);
      }
    }
  }, [currentIdx, results, sequence, onComplete, isBarrage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const label = attackType === 'parry' ? 'PARRY!' : attackType === 'dodge' ? 'DODGE!' : 'SURVIVE!';
  const labelColor = attackType === 'parry' ? '#ffa020' : attackType === 'dodge' ? '#ff4040' : '#a060ff';
  const missedSoFar = results.filter(r => r === 'miss').length;

  const resultText = () => {
    if (showResult === 'perfect') return attackType === 'parry' ? 'PERFECT PARRY!' : attackType === 'dodge' ? 'DODGED!' : 'SURVIVED!';
    if (showResult === 'good') return attackType === 'parry' ? 'PARRIED!' : 'BLOCKED!';
    if (showResult === 'late') return 'GRAZED';
    return attackType === 'parry' ? 'BROKEN!' : attackType === 'barrage' ? `HIT x${missedSoFar}` : 'HIT!';
  };

  return (
    <div className="qte-overlay" data-testid="qte-overlay">
      <div className="qte-label" style={{ color: labelColor }} data-testid="qte-label">{label}</div>
      <div className={`qte-arrows ${sequence.length > 6 ? 'qte-arrows-compact' : ''}`}>
        {sequence.map((arrow, i) => (
          <div key={i} className={`qte-arrow ${sequence.length > 6 ? 'qte-arrow-sm' : ''} ${i === currentIdx && !showResult ? 'active' : i < currentIdx ? (results[i] === 'miss' ? 'failed' : 'success') : ''}`} data-testid={`qte-arrow-${i}`}>
            {QTE_ARROWS[arrow]}
          </div>
        ))}
      </div>
      {isBarrage && missedSoFar > 0 && !showResult && (
        <div className="qte-miss-counter" data-testid="qte-miss-counter">Missed: {missedSoFar}</div>
      )}
      <div className="qte-timer"><div className="qte-timer-fill" style={{ width: `${timeLeft}%`, background: attackType === 'barrage' ? 'linear-gradient(90deg, #6020c0, #a060ff)' : undefined }} data-testid="qte-timer" /></div>
      <AnimatePresence>
        {showResult && (
          <motion.div className={`qte-result ${showResult}`} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} data-testid="qte-result">
            {resultText()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skill Bar (shows locked/unlocked) ───────────────────
export function SkillBar({ equippedSkills, unlockedSkills, cooldowns, mana, keybinds }) {
  // Show equipped skills + next locked skills to fill 5 slots
  const slots = [];
  for (let i = 0; i < 5; i++) {
    if (i < equippedSkills.length) {
      const sid = equippedSkills[i];
      const skill = ALL_SKILLS.find(s => s.id === sid);
      if (skill) { slots.push({ skill, unlocked: true, slotIdx: i }); continue; }
    }
    // Fill remaining with next locked skills
    const nextLocked = SKILL_UNLOCK_ORDER.find(sid =>
      !unlockedSkills.includes(sid) && !slots.some(s => s.skill?.id === sid)
    );
    if (nextLocked) {
      const skill = ALL_SKILLS.find(s => s.id === nextLocked);
      if (skill) { slots.push({ skill, unlocked: false, slotIdx: i }); continue; }
    }
    slots.push({ skill: null, unlocked: false, slotIdx: i });
  }

  return (
    <div className="skill-bar" data-testid="skill-bar">
      {slots.map(({ skill, unlocked, slotIdx }) => {
        if (!skill) return <div key={slotIdx} className="skill-slot empty" data-testid={`skill-slot-${slotIdx}`} />;
        const cd = unlocked ? (cooldowns[skill.id] || 0) : 0;
        const canUse = unlocked && cd <= 0 && mana >= skill.manaCost;
        const cdPct = cd > 0 ? (cd / skill.cooldown) * 100 : 0;
        const keyLabel = keybinds[`skill${slotIdx + 1}`] || (slotIdx + 1).toString();
        const cond = SKILL_UNLOCK_CONDITIONS[skill.id];
        return (
          <div key={slotIdx} className={`skill-slot ${unlocked ? (canUse ? 'ready' : 'on-cd') : 'locked'}`} data-testid={`skill-slot-${slotIdx}`} title={unlocked ? `${skill.name} - ${skill.desc}` : cond?.desc || 'Locked'}>
            <div className="skill-icon" style={{ color: unlocked ? skill.color : '#3a3a4a' }}>{skill.icon}</div>
            {cd > 0 && <div className="skill-cd-overlay" style={{ height: `${cdPct}%` }} />}
            {!unlocked && <div className="skill-lock-overlay" />}
            <div className="skill-key">{unlocked ? keyLabel : '?'}</div>
            <div className="skill-name-tag">{unlocked ? skill.name : cond?.desc || '???'}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Skill Unlock Notification ───────────────────────────
export function SkillUnlockNotification({ skill }) {
  return (
    <motion.div
      className="skill-unlock-notification"
      initial={{ scale: 0, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-testid="skill-unlock-notification"
    >
      <div className="unlock-flash" />
      <div className="unlock-label">SKILL AWAKENED</div>
      <div className="unlock-icon" style={{ color: skill.color }}>{skill.icon}</div>
      <div className="unlock-name">{skill.name}</div>
      <div className="unlock-desc">{skill.desc}</div>
    </motion.div>
  );
}

// ─── Zone Banner (on map load) ───────────────────────────
export function ZoneBanner({ name, hint }) {
  return (
    <motion.div className="zone-banner" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} data-testid="zone-banner">
      <div className="zone-name" data-testid="zone-name">{name}</div>
      <div className="zone-hint" data-testid="zone-hint">Find the exit: {hint}</div>
    </motion.div>
  );
}

// ─── Recovery Prompt (after QTE) ─────────────────────────
export function RecoveryPrompt({ direction }) {
  const arrows = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' };
  return (
    <motion.div className="recovery-prompt" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} data-testid="recovery-prompt">
      <div className="recovery-label">CATCH!</div>
      <div className="recovery-arrow">{arrows[direction]}</div>
    </motion.div>
  );
}

// ─── Game Menu (Tab) ─────────────────────────────────────
export function GameMenu({ equippedSkills, setEquippedSkills, unlockedSkills, combatStats, equipment, setEquipment, keybinds, setKeybinds, onClose }) {
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
    if (!unlockedSkills.includes(skillId)) return;
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
            <button className={`menu-tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')} data-testid="menu-tab-skills">Skill Tree</button>
            <button className={`menu-tab ${tab === 'equipment' ? 'active' : ''}`} onClick={() => setTab('equipment')} data-testid="menu-tab-equipment">Equipment</button>
            <button className={`menu-tab ${tab === 'keybinds' ? 'active' : ''}`} onClick={() => setTab('keybinds')} data-testid="menu-tab-keybinds">Keybinds</button>
          </div>
          <button className="menu-close" onClick={onClose} data-testid="menu-close">ESC</button>
        </div>

        <div className="menu-content">
          {tab === 'skills' && (
            <div className="menu-skills" data-testid="menu-skills-panel">
              <div className="menu-section-title">Combat Mastery ({unlockedSkills.length}/{ALL_SKILLS.length} Awakened)</div>
              <div className="skills-grid">
                {SKILL_UNLOCK_ORDER.map(skillId => {
                  const skill = ALL_SKILLS.find(s => s.id === skillId);
                  if (!skill) return null;
                  const isUnlocked = unlockedSkills.includes(skillId);
                  const equipped = equippedSkills.includes(skillId);
                  const cond = SKILL_UNLOCK_CONDITIONS[skillId];
                  const statVal = combatStats[cond?.stat] || 0;
                  const progress = cond ? Math.min(1, statVal / cond.threshold) : 0;
                  return (
                    <button
                      key={skillId}
                      className={`skill-card ${isUnlocked ? (equipped ? 'equipped' : 'unlocked') : 'locked'}`}
                      onClick={() => toggleSkill(skillId)}
                      data-testid={`skill-card-${skillId}`}
                    >
                      <div className="skill-card-icon" style={{ color: isUnlocked ? skill.color : '#2a2a3a' }}>{skill.icon}</div>
                      <div className="skill-card-info">
                        <div className="skill-card-name" style={{ color: isUnlocked ? '#F8FAFC' : '#64748B' }}>{skill.name}</div>
                        {isUnlocked ? (
                          <div className="skill-card-desc">{skill.desc}</div>
                        ) : (
                          <div className="skill-unlock-progress">
                            <div className="skill-condition">{cond?.desc}</div>
                            <div className="progress-bar-mini">
                              <div className="progress-fill-mini" style={{ width: `${progress * 100}%` }} />
                            </div>
                            <div className="progress-text">{statVal} / {cond?.threshold}</div>
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="skill-card-stats">
                            <span>Mana: {skill.manaCost}</span>
                            <span>CD: {skill.cooldown}s</span>
                            {skill.damage > 0 && <span>DMG: {skill.damage}</span>}
                            {skill.healAmount && <span>Heal: {skill.healAmount}</span>}
                          </div>
                        )}
                      </div>
                      <div className={`skill-equip-badge ${equipped ? 'on' : isUnlocked ? '' : 'locked-badge'}`}>
                        {equipped ? 'Equipped' : isUnlocked ? 'Equip' : 'Locked'}
                      </div>
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
                  <button key={action} className={`keybind-row ${rebindAction === action ? 'rebinding' : ''}`} onClick={() => setRebindAction(action)} data-testid={`keybind-${action}`}>
                    <span className="keybind-action">{label}</span>
                    <span className="keybind-key">{rebindAction === action ? 'Press key...' : keyDisplay(keybinds[action] || DEFAULT_KEYBINDS[action])}</span>
                  </button>
                ))}
              </div>
              <button className="keybind-reset-btn" onClick={() => { setKeybinds({ ...DEFAULT_KEYBINDS }); localStorage.removeItem('odyssey_keybinds'); }} data-testid="keybind-reset">Reset to Defaults</button>
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
      <div className="control-hint"><span className="key-bind">M1</span> attack</div>
      <div className="control-hint"><span className="key-bind">{kd(keybinds.dash)}</span> dash</div>
      <div className="control-hint"><span className="key-bind">{kd(keybinds.jump)}</span> jump</div>
      {mode === 'explore' && <div className="control-hint"><span className="key-bind">{kd(keybinds.interact)}</span> talk</div>}
      {mode === 'battle' && (
        <>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.interact)}</span> pick up</div>
          <div className="control-hint"><span className="key-bind">{kd(keybinds.throw)}</span> throw</div>
          <div className="control-hint"><span className="key-bind">1-5</span> skills</div>
        </>
      )}
    </div>
  );
}

export function DamageFlash() {
  return <div className="damage-flash" data-testid="damage-flash" />;
}
