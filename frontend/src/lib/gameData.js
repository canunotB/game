// Tile types
export const TILES = {
  GRASS: 0,
  PATH: 1,
  TREE: 2,
  ROCK: 3,
  CLIFF: 4,
  BUILDING: 5,
  WATER: 6,
  MUD: 7,
  FLOWERS: 8,
};

// Solid tiles (can't walk through)
export const SOLID_TILES = [TILES.TREE, TILES.ROCK, TILES.CLIFF, TILES.BUILDING, TILES.WATER];

export const TILE_SIZE = 48;
export const PLAYER_SPEED = 3.5;
export const KAIREN_SPEED = 2.2;

// Village map (30x20 tiles)
// prettier-ignore
export const VILLAGE_MAP = [
  [2,2,2,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,2,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,2,0,0,0,0,0,5,5,5,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,4],
  [2,0,0,2,0,0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,2,0,0,0,0,4],
  [4,0,0,0,0,0,1,1,0,0,0,8,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1],
  [4,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0],
  [4,0,8,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0],
  [4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,0,0,0],
  [4,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,4],
  [4,0,0,2,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,4],
  [2,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,0,0,0,0,0,1,1,1,0,0,0,8,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,4],
  [2,0,8,0,2,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,2,0,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2],
  [2,0,0,0,0,0,0,5,5,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,0,0,0,2,0,0,5,5,5,0,0,0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0,0,2],
  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
];

export const VILLAGE_NPCS = [
  {
    id: 'elder_theron',
    name: 'Elder Theron',
    x: 10,
    y: 8,
    sprite: 'elder',
    dialogue: [
      "The winds carry a dark omen today...",
      "Child, the gods have spoken your name.",
    ],
  },
  {
    id: 'lyra',
    name: 'Lyra',
    x: 15,
    y: 11,
    sprite: 'girl',
    dialogue: [
      "H-have you seen him? The warrior in dark armor...",
      "Please don't go east... he's waiting there...",
    ],
  },
];

// Battle arena exit trigger (east side of village)
export const BATTLE_TRIGGER = { minX: 27, minY: 6, maxX: 29, maxY: 10 };

// Battle arena objects
export const BATTLE_ARENA = {
  width: 22,
  height: 16,
  playerSpawn: { x: 4, y: 12 },
  kairenSpawn: { x: 18, y: 4 },
  objects: [
    { type: 'rock_small', x: 3, y: 6, pickable: true },
    { type: 'rock_small', x: 8, y: 14, pickable: true },
    { type: 'rock_small', x: 16, y: 10, pickable: true },
    { type: 'rock_small', x: 19, y: 13, pickable: true },
    { type: 'rock_large', x: 12, y: 3, pickable: false },
    { type: 'tree', x: 6, y: 4 },
    { type: 'tree', x: 17, y: 8 },
    { type: 'tree', x: 10, y: 12 },
    { type: 'mud', x: 9, y: 7, radius: 1.8 },
    { type: 'mud', x: 15, y: 12, radius: 1.5 },
  ],
};

export const KAIREN_ATTACKS = {
  heavy_slash: {
    name: 'Heavy Slash',
    damage: 15,
    range: 2.5,
    telegraph: 1.2,
    recovery: 1.5,
    qteLength: 3,
  },
  thrust: {
    name: 'Piercing Thrust',
    damage: 10,
    range: 3,
    telegraph: 0.7,
    recovery: 0.8,
    qteLength: 2,
  },
  shield_bash: {
    name: 'Shield Bash',
    damage: 8,
    range: 1.8,
    telegraph: 0.5,
    recovery: 1.0,
    qteLength: 2,
    knockback: 3,
  },
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

export const QTE_ARROWS = {
  up: '\u2191',
  down: '\u2193',
  left: '\u2190',
  right: '\u2192',
};

export const QTE_KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export const COLORS = {
  grass: ['#2d5016', '#2a4c14', '#325a18', '#284812'],
  path: ['#8B7355', '#7d6749', '#937d5f'],
  mud: 'rgba(74, 60, 49, 0.7)',
  water: '#1a3a5c',
  cliff: '#3d3d3d',
  building: '#5c4a3a',
  rain: 'rgba(100, 160, 255, 0.35)',
  sky_dark: '#07090F',
};
