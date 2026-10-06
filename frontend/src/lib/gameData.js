export const TILES = { GRASS: 0, PATH: 1, TREE: 2, ROCK: 3, CLIFF: 4, BUILDING: 5, WATER: 6, MUD: 7, FLOWERS: 8, RUINS: 9, STONE: 10 };
export const SOLID_TILES = [TILES.TREE, TILES.ROCK, TILES.CLIFF, TILES.BUILDING, TILES.WATER];
export const TILE_SIZE = 48;
export const PLAYER_SPEED = 4.5;
export const KAIREN_SPEED = 3.2;
export const MAX_STAMINA = 100;
export const MAX_MANA = 60;
export const ATTACK_STAMINA = 8;
export const DASH_STAMINA = 16;
export const STAMINA_REGEN = 42;
export const MANA_REGEN = 5;

// prettier-ignore
export const VILLAGE_MAP = [
[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
[4,0,2,0,0,0,0,2,0,0,0,0,0,9,0,0,0,0,0,2,0,0,0,0,0,0,0,2,0,4],
[4,0,0,5,5,0,0,0,0,1,1,1,5,5,5,0,0,0,0,0,0,5,5,0,0,0,0,0,0,4],
[4,2,0,5,5,0,0,1,1,1,0,0,5,5,5,0,0,2,0,0,0,5,5,0,0,2,0,0,0,4],
[4,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
[4,0,2,0,0,1,1,0,0,8,0,0,0,1,0,0,0,0,0,0,0,0,2,0,0,0,1,1,1,4],
[4,0,0,0,1,1,0,0,0,0,0,0,0,1,0,9,0,0,0,0,0,0,0,0,0,1,1,0,0,4],
[4,0,8,0,1,0,0,0,6,6,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,1],
[4,0,0,0,1,0,0,0,6,6,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,1],
[4,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,4],
[4,2,0,1,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,2,0,4],
[4,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
[4,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,4],
[4,0,0,0,1,1,0,0,9,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
[4,2,0,0,0,1,1,5,5,0,0,0,0,0,0,0,5,5,0,0,0,2,0,0,0,0,0,0,0,4],
[4,0,0,0,0,0,1,5,5,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,2,0,0,0,4],
[4,0,0,0,0,1,1,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
[4,0,2,0,0,1,0,0,0,2,0,0,0,0,2,0,0,0,0,2,0,0,0,2,0,0,0,0,0,4],
[4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
];

export const VILLAGE_NPCS = [
  { id: 'elder_theron', name: 'Elder Theron', x: 10, y: 7, sprite: 'elder' },
  { id: 'lyra', name: 'Lyra', x: 16, y: 10, sprite: 'girl' },
];

export const BATTLE_TRIGGER = { minX: 27, minY: 5, maxX: 29, maxY: 8 };

export const BATTLE_ARENA = {
  width: 24, height: 18,
  playerSpawn: { x: 5, y: 14 },
  kairenSpawn: { x: 19, y: 4 },
  objects: [
    { type: 'rock_small', x: 3, y: 6, pickable: true },
    { type: 'rock_small', x: 9, y: 15, pickable: true },
    { type: 'rock_small', x: 17, y: 11, pickable: true },
    { type: 'rock_small', x: 21, y: 14, pickable: true },
    { type: 'rock_large', x: 12, y: 3 },
    { type: 'tree', x: 6, y: 4 },
    { type: 'tree', x: 18, y: 9 },
    { type: 'tree', x: 11, y: 13 },
    { type: 'mud', x: 9, y: 8, radius: 1.8 },
    { type: 'mud', x: 16, y: 13, radius: 1.5 },
    { type: 'hazard', x: 4, y: 10, radius: 1.2 },
    { type: 'hazard', x: 20, y: 6, radius: 1.0 },
    { type: 'hazard', x: 13, y: 16, radius: 1.3 },
  ],
};

export const KAIREN_ATTACKS = {
  // PARRY attacks (1 QTE arrow, tight timing — fail = Kairen empowered)
  quick_slash: { type: 'parry', name: 'Quick Slash', damage: 8, range: 3, telegraph: 0.4, recovery: 0.5, qteLength: 1 },
  shield_bash: { type: 'parry', name: 'Shield Bash', damage: 6, range: 2.5, telegraph: 0.5, recovery: 0.6, qteLength: 1, knockback: 2 },
  // DODGE attacks (2-3 QTE arrows — fail = full damage)
  heavy_slash: { type: 'dodge', name: 'Heavy Slash', damage: 14, range: 4, telegraph: 0.7, recovery: 0.9, qteLength: 3 },
  thrust: { type: 'dodge', name: 'Thrust', damage: 11, range: 5, telegraph: 0.6, recovery: 0.8, qteLength: 2 },
  // BARRAGE attacks (8-12 arrows, doesn't end on miss — damage per missed arrow)
  barrage: { type: 'barrage', name: 'Barrage', damage: 24, range: 4, telegraph: 1.0, recovery: 1.5, qteLength: 10, phase: 2 },
  enraged_combo: { type: 'barrage', name: 'Fury', damage: 30, range: 5, telegraph: 1.2, recovery: 2.0, qteLength: 12, phase: 3 },
};

export const KAIREN_PHASES = {
  1: { hpThreshold: 100, speedMult: 1.0, swingRate: 0.35, attacks: ['quick_slash', 'shield_bash', 'heavy_slash', 'thrust'] },
  2: { hpThreshold: 50, speedMult: 1.2, swingRate: 0.45, attacks: ['quick_slash', 'shield_bash', 'heavy_slash', 'thrust', 'barrage'] },
  3: { hpThreshold: 30, speedMult: 1.4, swingRate: 0.55, attacks: ['quick_slash', 'shield_bash', 'heavy_slash', 'thrust', 'barrage', 'enraged_combo'] },
};

export const STORY_LINES = [
  "In the age of gods and monsters...",
  "A prophecy was spoken from the peaks of Olympus.",
  "\"A child, born under the bleeding moon,\"",
  "\"shall rise to challenge the divine throne.\"",
  "The gods would not suffer such defiance.",
  "They sent Kairen, blade of the heavens,",
  "to silence you before your story could begin.",
  "You are eight years old.",
  "You do not yet know why the world fears you.",
  "But today, at the edge of the ravine...",
  "you will learn.",
];

export const ENDING_LINES = [
  "Kairen's blade found its mark.",
  "The earth crumbled beneath your feet.",
  "You fell...",
  "into the darkness of the ravine.",
  "...",
  "But the prophecy does not end here.",
  "The gods made a mistake.",
  "You survived.",
];

export const QTE_ARROWS = { up: '\u2191', down: '\u2193', left: '\u2190', right: '\u2192' };
export const QTE_KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

export const DIALOGUE_TONES = {
  kind: { label: 'Kind', color: '#4ade80', repChange: 1 },
  neutral: { label: 'Neutral', color: '#94A3B8', repChange: 0 },
  aggressive: { label: 'Aggressive', color: '#ef4444', repChange: -1 },
  cunning: { label: 'Cunning', color: '#a78bfa', repChange: 0 },
};

export const NPC_DIALOGUE_OPTIONS = {
  elder_theron: [
    { tone: 'kind', text: "Are you alright, Elder? You seem troubled." },
    { tone: 'neutral', text: "What do you know about the prophecy?" },
    { tone: 'aggressive', text: "Tell me where Kairen is. Now." },
    { tone: 'cunning', text: "What's in it for me if I face this warrior?" },
  ],
  lyra: [
    { tone: 'kind', text: "Don't worry, I'll be careful." },
    { tone: 'neutral', text: "Have you seen anyone suspicious?" },
    { tone: 'aggressive', text: "Move. I don't have time for this." },
    { tone: 'cunning', text: "You know more than you're letting on." },
  ],
};

export function getReputationTitle(rep) {
  if (rep <= -5) return 'Feared';
  if (rep <= -2) return 'Distrusted';
  if (rep < 2) return 'Unknown';
  if (rep < 5) return 'Respected';
  return 'Revered';
}

// ─── SKILLS ──────────────────────────────────────────────
export const ALL_SKILLS = [
  { id: 'flame_dash', name: 'Flame Dash', icon: 'F', manaCost: 12, cooldown: 3, damage: 8, desc: 'Dash forward leaving fire', type: 'movement', color: '#ff6030' },
  { id: 'lightning_strike', name: 'Lightning', icon: 'L', manaCost: 15, cooldown: 4, damage: 14, desc: 'Strike from the sky', type: 'ranged', color: '#ffd700' },
  { id: 'wind_slash', name: 'Wind Slash', icon: 'W', manaCost: 8, cooldown: 2, damage: 10, desc: 'Quick cutting gust', type: 'melee', color: '#80d0ff' },
  { id: 'shadow_step', name: 'Shadow Step', icon: 'S', manaCost: 10, cooldown: 5, damage: 0, desc: 'Vanish briefly', type: 'utility', color: '#8040c0' },
  { id: 'earth_shield', name: 'Earth Shield', icon: 'E', manaCost: 14, cooldown: 6, damage: 0, desc: 'Block one hit', type: 'defense', color: '#8a7030' },
  { id: 'divine_wrath', name: 'Divine Wrath', icon: 'D', manaCost: 20, cooldown: 8, damage: 18, desc: 'Devastating blast', type: 'ranged', color: '#c0a0ff' },
  { id: 'healing_light', name: 'Heal', icon: 'H', manaCost: 18, cooldown: 10, damage: 0, healAmount: 15, desc: 'Restore vitality', type: 'heal', color: '#4ade80' },
];

export const DEFAULT_EQUIPPED_SKILLS = [];

export const SKILL_UNLOCK_CONDITIONS = {
  flame_dash: { stat: 'dashCount', threshold: 4, desc: 'Dash 4 times' },
  wind_slash: { stat: 'hitsLanded', threshold: 8, desc: 'Hit Kairen 8 times' },
  earth_shield: { stat: 'goodBlocks', threshold: 2, desc: 'Block 2 attacks' },
  lightning_strike: { stat: 'fullCombos', threshold: 2, desc: 'Land 2 full combos' },
  shadow_step: { stat: 'perfectDodges', threshold: 2, desc: 'Perfect counter 2 attacks' },
  divine_wrath: { stat: 'perfectDodges', threshold: 5, desc: 'Perfect counter 5 attacks' },
  healing_light: { stat: 'damageTaken', threshold: 40, desc: 'Survive 40 damage' },
};

export const SKILL_UNLOCK_ORDER = ['flame_dash', 'wind_slash', 'earth_shield', 'lightning_strike', 'shadow_step', 'divine_wrath', 'healing_light'];

export const DEFAULT_COMBAT_STATS = {
  dashCount: 0, hitsLanded: 0, fullCombos: 0,
  perfectDodges: 0, goodBlocks: 0, damageTaken: 0, damageDealt: 0,
  dodgeAttempts: 0, dodgeSuccess: 0,
  parryAttempts: 0, parrySuccess: 0,
  barrageAttempts: 0, barrageArrowsHit: 0,
};

// ─── EQUIPMENT ───────────────────────────────────────────
export const ALL_EQUIPMENT = {
  weapons: [
    { id: 'wooden_sword', name: 'Wooden Sword', damage: 6, speed: 1.0, desc: 'A simple training blade' },
    { id: 'bronze_blade', name: 'Bronze Blade', damage: 10, speed: 0.85, desc: 'Sharp and well-balanced' },
  ],
  armor: [
    { id: 'cloth_tunic', name: 'Cloth Tunic', defense: 0, desc: 'Basic clothing' },
    { id: 'leather_armor', name: 'Leather Armor', defense: 3, desc: 'Light protection' },
  ],
  accessories: [
    { id: 'none', name: 'None', desc: 'No accessory equipped' },
    { id: 'swift_boots', name: 'Swift Boots', speedBonus: 0.5, desc: 'Move faster' },
    { id: 'mana_charm', name: 'Mana Charm', manaBonus: 15, desc: '+15 max mana' },
  ],
};

export const DEFAULT_EQUIPMENT = { weapon: 'wooden_sword', armor: 'cloth_tunic', accessory: 'none' };

// ─── KEYBINDS ────────────────────────────────────────────
export const DEFAULT_KEYBINDS = {
  moveUp: 'w', moveDown: 's', moveLeft: 'a', moveRight: 'd',
  dash: 'shift', jump: ' ', interact: 'e', throw: 'q',
  skill1: '1', skill2: '2', skill3: '3', skill4: '4', skill5: '5',
  menu: 'tab',
};

export const KEYBIND_LABELS = {
  moveUp: 'Move Up', moveDown: 'Move Down', moveLeft: 'Move Left', moveRight: 'Move Right',
  dash: 'Dash', jump: 'Jump', interact: 'Interact', throw: 'Throw',
  skill1: 'Skill 1', skill2: 'Skill 2', skill3: 'Skill 3', skill4: 'Skill 4', skill5: 'Skill 5',
  menu: 'Menu',
};

// ─── ENEMY SPECIES ───────────────────────────────────────
export const ENEMY_SPECIES = {
  stone_warden: {
    name: 'Stone Warden', hp: 40, speed: 1.5, damage: 8, range: 2.5,
    attacks: ['rock_slam', 'quake_stomp', 'shoulder_bash'],
    passive: 'armored_hide', deathEffect: 'shatter',
    desc: 'Hulking gargoyle with heavy club',
    colors: { body: '#5a5a62', accent: '#3a3a40', glow: '#8a8a6a' },
  },
  cliff_raptor: {
    name: 'Cliff Raptor', hp: 22, speed: 4.5, damage: 6, range: 2,
    attacks: ['swift_strike', 'talon_dive', 'shriek'],
    passive: 'evasive', deathEffect: 'feather_burst',
    desc: 'Fast avian with razor claws',
    colors: { body: '#6a4a30', accent: '#c09050', glow: '#e0c080' },
  },
  spineback_lurker: {
    name: 'Spineback Lurker', hp: 28, speed: 2.8, damage: 7, range: 5,
    attacks: ['spine_toss', 'cling_bite', 'void_surge'],
    passive: 'spiked_carapace', deathEffect: 'spike_explode',
    desc: 'Barbed creature that burrows and ambushes',
    colors: { body: '#4a3a2a', accent: '#8a6040', glow: '#c08050' },
  },
  fungal_brute: {
    name: 'Fungal Brute', hp: 35, speed: 2.0, damage: 10, range: 2,
    attacks: ['pummel', 'spore_cloud', 'leap_smash'],
    passive: 'spore_regen', deathEffect: 'toxic_mushrooms',
    desc: 'Mushroom beast that poisons the air',
    colors: { body: '#3a5030', accent: '#6a9050', glow: '#90c060' },
  },
  glider_imp: {
    name: 'Glider Imp', hp: 16, speed: 5.0, damage: 5, range: 4,
    attacks: ['flying_slash', 'wing_gust', 'hex_shot'],
    passive: 'agile', deathEffect: 'smoke_puff',
    desc: 'Nimble flying trickster',
    colors: { body: '#5a3060', accent: '#9060a0', glow: '#c080e0' },
  },
  ravine_gnasher: {
    name: 'Ravine Gnasher', hp: 30, speed: 3.2, damage: 9, range: 2.5,
    attacks: ['chomp', 'jaw_ram', 'bone_toss'],
    passive: 'pack_leader', deathEffect: 'death_cry',
    desc: 'Reptilian pack hunter with crushing jaws',
    colors: { body: '#5a4030', accent: '#8a6040', glow: '#c08050' },
  },
  wraithshade: {
    name: 'Wraithshade', hp: 20, speed: 2.0, damage: 7, range: 3,
    attacks: ['night_shroud', 'phantom_blade', 'fade_leap'],
    passive: 'shadow_cloak', deathEffect: 'dark_mist',
    desc: 'Spectral shade that teleports and blinds',
    colors: { body: '#1a1a2e', accent: '#3a3a5a', glow: '#6060a0' },
  },
  stone_drake: {
    name: 'Stone Drake', hp: 45, speed: 1.8, damage: 12, range: 4,
    attacks: ['rock_breath', 'tail_sweep', 'charged_roar'],
    passive: 'ambush', deathEffect: 'debris_explosion',
    desc: 'Winged drake that breathes stone shards',
    colors: { body: '#4a4a3a', accent: '#6a6a5a', glow: '#a0a080' },
  },
};

// ─── TOWNS ───────────────────────────────────────────────
export const TOWNS = {
  cliffgate: { name: 'Cliffgate', biome: 'canyon', desc: 'Canyon gate town at the ravine entrance', enemies: ['stone_warden', 'cliff_raptor'] },
  timbercross: { name: 'Timbercross', biome: 'forest', desc: 'Pine forest border settlement', enemies: ['fungal_brute', 'spineback_lurker'] },
  stonebridge: { name: 'Stonebridge', biome: 'river', desc: 'River crossing village with ancient bridges', enemies: ['ravine_gnasher', 'cliff_raptor'] },
  ashenvale: { name: 'Ashenvale', biome: 'volcanic', desc: 'Volcanic outpost near smoldering peaks', enemies: ['stone_drake', 'glider_imp'] },
  frostwind: { name: 'Frostwind', biome: 'snow', desc: 'Snowy peak settlement battered by storms', enemies: ['wraithshade', 'stone_warden'] },
  mossgrove: { name: 'Mossgrove', biome: 'swamp', desc: 'Swamp town overgrown with fungi', enemies: ['fungal_brute', 'spineback_lurker'] },
  sunspire: { name: 'Sunspire', biome: 'desert', desc: 'Deserted shrine city in endless sand', enemies: ['glider_imp', 'wraithshade'] },
  ironfall: { name: 'Ironfall', biome: 'mountain', desc: 'Mountain mining outpost deep underground', enemies: ['stone_drake', 'ravine_gnasher'] },
};

// Enemies present in the starting village
export const VILLAGE_ENEMIES = [
  { id: 'se1', species: 'cliff_raptor', x: 22, y: 4, patrol: true },
  { id: 'se2', species: 'spineback_lurker', x: 4, y: 14, patrol: true },
  { id: 'se3', species: 'fungal_brute', x: 20, y: 14, patrol: false },
  { id: 'se4', species: 'glider_imp', x: 14, y: 3, patrol: true },
];

// Enemies in the battle arena (reinforcements / sub-bosses)
export const ARENA_ENEMIES = [
  { id: 'ae1', species: 'stone_warden', x: 4, y: 4, spawnTimer: 15 },
  { id: 'ae2', species: 'ravine_gnasher', x: 20, y: 15, spawnTimer: 25 },
];

// ─── SCRIPTED DIALOGUE (no AI) ───────────────────────────
export const NPC_SCRIPTS = {
  elder_theron: {
    greeting: {
      low: "You again. The village whispers about your temper, child. Mind your words here.",
      mid: "Ah, little one. You should not be out when the sky bleeds like this. Something walks the ravine road tonight.",
      high: "Child of the bleeding moon... you have been good to us. That is why it pains me to tell you what I have seen.",
    },
    responses: {
      kind: "Troubled? Yes. I dreamt of a blade falling from the heavens. It had your name carved along its edge. Stay close to the fires tonight.",
      neutral: "The prophecy says a child will shake the throne of the gods. The gods do not forgive such things. They send a man called Kairen to end such children.",
      aggressive: "Kairen? He waits where the path meets the ravine, east of the village. Go if you must — but do not expect to walk back.",
      cunning: "What's in it for you? Your life, child. Nothing more. Kairen does not bargain, and neither do the gods.",
    },
  },
  lyra: {
    greeting: {
      low: "Oh. It's you. People say you've been rude to the elder. Don't be rude to me.",
      mid: "Hey! Did you see the stranger by the ravine? Tall, blue armour, eyes like frost. He asked about you.",
      high: "There you are! I saved you some bread. Listen — there's a knight at the ravine edge. He scares me.",
    },
    responses: {
      kind: "Promise? ...Okay. If you go east, stay on the path. The raptors nest in the tall grass.",
      neutral: "The knight. He hasn't moved in hours. Just stands at the cliff edge, staring at the village. Staring at YOUR house.",
      aggressive: "Fine! Go then. But if you get thrown off a cliff don't come crying to me.",
      cunning: "...Maybe I do. He said the gods paid him in a single word: your name. I don't know what that means.",
    },
  },
  hermit_orin: {
    greeting: {
      low: "Hm. The ravine spits out another one. Most of them don't get up. You did. Interesting.",
      mid: "Easy, easy. You fell a long way, little sparrow. Orin pulled you from the river. You've slept two days.",
      high: "Awake at last. The river carried you to me — the gods meant you to drown, and the river disagreed.",
    },
    responses: {
      kind: "Kindness, down here? Rare. Keep it. You'll need it where you're going — Cliffgate, up the eastern path. The gate town at the ravine's mouth.",
      neutral: "Kairen's work. I know the cut of his blade. He threw a prophet down here forty years ago. That prophet was me.",
      aggressive: "Snarl all you like. Kairen is beyond you — for now. Grow stronger. Climb to Cliffgate. There are others who defied the gods and lived.",
      cunning: "Clever eyes. Yes, I want something: carry word to Cliffgate that Orin still breathes. Captain Vael will know what it means.",
    },
  },
  captain_vael: {
    greeting: {
      low: "Halt. A child crawling out of the ravine with blood on their hands. Give me a reason not to turn you away.",
      mid: "Halt! ...A child? Out of the ravine? Stand down, lads. Nobody climbs out of there. Who are you?",
      high: "By the gate! Orin's sparrow — he sent a hawk ahead. Welcome to Cliffgate, little one. You are among friends.",
    },
    responses: {
      kind: "Hm. Soft words from a hard road. Alright. Cliffgate guards the canyon pass — eight towns lie beyond it, and Kairen's shadow over all of them.",
      neutral: "Kairen was once one of us. A gate-captain, like me. Then the gods called him up the mountain and he came back... different.",
      aggressive: "Careful. Fire like that is what the gods fear. Keep it banked until you're ready. Then — Timbercross is next. Head through the eastern gate.",
      cunning: "Angling already? Good. The towns beyond need a blade that thinks. Prove yourself on the road to Timbercross and we'll talk.",
    },
  },
};

export const KAIREN_TAUNTS = [
  "Is this the child the gods fear?",
  "Your blade is a toy.",
  "Stand still. It will be quicker.",
  "Eight years. That is all you were given.",
  "The prophecy ends here.",
  "I take no pleasure in this.",
];

export const ARENA_INTRO_LINE = 'So... the prophecy child dares to face me.';

// ─── MAP PARSER ──────────────────────────────────────────
// # cliff  . stone  - path  B building  o boulder  R ruins  ~ water  m mud  g grass  T tree  f flowers
const CHAR_TILES = { '#': 4, '.': 10, '-': 1, 'B': 5, 'o': 3, 'R': 9, '~': 6, 'm': 7, 'g': 0, 'T': 2, 'f': 8 };
export function parseMap(rows) { return rows.map(r => [...r].map(c => CHAR_TILES[c] ?? 0)); }

export const RAVINE_MAP = parseMap([
  '######################',
  '#..o....R....o.......#',
  '#.....mm........o....#',
  '#.....m....~~........#',
  '#o........~~~.....R..#',
  '#........~~........--#',
  '#........~....o...---#',
  '#.......~~.......----#',
  '#.......-.........---#',
  '#..o...~~...mm.....-.#',
  '#......~....m..o.....#',
  '#.....~~.............#',
  '#.R...~..........o...#',
  '######################',
]);

export const CLIFFGATE_MAP = parseMap([
  '##########################',
  '#..o...............o.....#',
  '#....BB......BBB......BB.#',
  '#....BB..---.BBB......BB.#',
  '#.......--.--.....o......#',
  '#o.....--...--...........#',
  '#.....--..R..-------------',
  '#....--...............---#',
  '#-----................----',
  '#....--...o...........--.#',
  '#.....--........BB.......#',
  '#.o....---......BB...o...#',
  '#........---.............#',
  '#...BB.....---......R....#',
  '#...BB...................#',
  '##########################',
]);

export const MAPS = {
  village: {
    id: 'village', name: 'Hollow Village', tiles: VILLAGE_MAP, width: 30, height: 20,
    spawn: { x: 5, y: 10 }, npcs: VILLAGE_NPCS, enemies: VILLAGE_ENEMIES,
    exit: { minX: 26, minY: 4, maxX: 30, maxY: 10, type: 'battle', label: 'The Ravine Edge', marker: { x: 27.5, y: 6.5 } },
  },
  ravine: {
    id: 'ravine', name: 'Ravine Floor', tiles: RAVINE_MAP, width: 22, height: 14,
    spawn: { x: 3, y: 7 },
    npcs: [{ id: 'hermit_orin', name: 'Orin the Hermit', x: 4, y: 4, sprite: 'hermit' }],
    enemies: [
      { id: 're1', species: 'ravine_gnasher', x: 12, y: 7, patrol: true },
      { id: 're2', species: 'wraithshade', x: 16, y: 3, patrol: true },
      { id: 're3', species: 'spineback_lurker', x: 14, y: 11, patrol: true },
    ],
    exit: { minX: 19, minY: 5, maxX: 22, maxY: 9, type: 'map', next: 'cliffgate', label: 'Climb to Cliffgate', marker: { x: 19.5, y: 6.5 } },
  },
  cliffgate: {
    id: 'cliffgate', name: 'Cliffgate', tiles: CLIFFGATE_MAP, width: 26, height: 16,
    spawn: { x: 2, y: 8 },
    npcs: [{ id: 'captain_vael', name: 'Captain Vael', x: 9, y: 7, sprite: 'guard' }],
    enemies: [
      { id: 'ce1', species: 'stone_warden', x: 18, y: 4, patrol: false },
      { id: 'ce2', species: 'cliff_raptor', x: 14, y: 12, patrol: true },
      { id: 'ce3', species: 'cliff_raptor', x: 21, y: 11, patrol: true },
    ],
    exit: { minX: 23, minY: 6, maxX: 26, maxY: 9, type: 'ending', label: 'Eastern Gate - Timbercross', marker: { x: 24, y: 7 } },
  },
};

export const CHAPTER2_INTRO = [
  "You fell...",
  "into the darkness of the ravine.",
  "...",
  "But the prophecy does not end here.",
  "The gods made a mistake.",
  "You survived.",
  "CHAPTER II - THE RAVINE FLOOR",
];

export const FINAL_LINES = [
  "Cliffgate stands at the mouth of the canyon.",
  "Beyond it lie seven more towns, and the road to Timbercross.",
  "Kairen will hear that the child lived.",
  "Let him come.",
];
