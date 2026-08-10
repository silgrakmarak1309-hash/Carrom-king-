import { CoinType, Piece, PuzzleLevel, Vec2 } from '../types';

export const BOARD_V_SIZE = 800;
export const BOUND_MIN = 50;
export const BOUND_MAX = 750;
export const BASELINE_LEFT = 215;
export const BASELINE_RIGHT = 585;
export const P1_STRIKER_Y = 642;
export const P2_STRIKER_Y = 158;

export const POCKETS = [
  { pos: new Vec2(58, 58), r: 36 },
  { pos: new Vec2(742, 58), r: 36 },
  { pos: new Vec2(58, 742), r: 36 },
  { pos: new Vec2(742, 742), r: 36 }
];

export const COIN_RADIUS = 15.5;
export const STRIKER_RADIUS = 21.0;

export function createPiece(x: number, y: number, type: CoinType, id?: string): Piece {
  const isStriker = type === 'striker';
  return {
    id: id || `coin_${Math.random().toString(36).substr(2, 9)}`,
    pos: new Vec2(x, y),
    vel: new Vec2(0, 0),
    radius: isStriker ? STRIKER_RADIUS : COIN_RADIUS,
    type,
    mass: isStriker ? 2.2 : 1.0,
    isPocketed: false,
    pocketedAnim: 1.0,
    friction: 0.984
  };
}

/**
 * Creates the official 19-coin symmetrical center formation for Carrom
 */
export function getClassicBoardCoins(): Piece[] {
  const pieces: Piece[] = [];
  const cx = 400;
  const cy = 400;
  const r = COIN_RADIUS;
  const coinDiameter = r * 2; // 31px

  // 1. Center Queen
  pieces.push(createPiece(cx, cy, 'red', 'queen'));

  // 2. Inner Ring (6 coins touching the queen at distance 31px)
  // Angles: 0, 60, 120, 180, 240, 300 degrees
  // Pattern: White, Black, White, Black, White, Black
  const innerPattern: CoinType[] = ['white', 'black', 'white', 'black', 'white', 'black'];

  for (let i = 0; i < 6; i++) {
    const angleRad = (i * 60 * Math.PI) / 180;
    const x = cx + coinDiameter * Math.cos(angleRad);
    const y = cy + coinDiameter * Math.sin(angleRad);
    pieces.push(createPiece(x, y, innerPattern[i], `inner_${i}`));
  }

  // 3. Outer Ring (12 coins touching the inner ring and each other)
  // 6 Groove coins at dist = coinDiameter * sqrt(3) ~ 53.693px at angles 30, 90, 150, 210, 270, 330
  // 6 Tip coins at dist = coinDiameter * 2 = 62px at angles 0, 60, 120, 180, 240, 300
  const grooveDist = coinDiameter * Math.sqrt(3);
  const tipDist = coinDiameter * 2;

  // Outer ring colors chosen to give balanced symmetrical 9 White / 9 Black total
  // Currently: 1 Queen, 3 White in inner, 3 Black in inner
  // Remaining needed: 6 White, 6 Black
  const groovePattern: CoinType[] = ['white', 'black', 'white', 'black', 'white', 'black'];
  const tipPattern: CoinType[] = ['black', 'white', 'black', 'white', 'black', 'white'];

  for (let i = 0; i < 6; i++) {
    // Groove coin
    const grooveAngle = ((i * 60 + 30) * Math.PI) / 180;
    const gx = cx + grooveDist * Math.cos(grooveAngle);
    const gy = cy + grooveDist * Math.sin(grooveAngle);
    pieces.push(createPiece(gx, gy, groovePattern[i], `outer_groove_${i}`));

    // Tip coin
    const tipAngle = (i * 60 * Math.PI) / 180;
    const tx = cx + tipDist * Math.cos(tipAngle);
    const ty = cy + tipDist * Math.sin(tipAngle);
    pieces.push(createPiece(tx, ty, tipPattern[i], `outer_tip_${i}`));
  }

  return pieces;
}

export const PUZZLE_LEVELS: PuzzleLevel[] = [
  {
    id: 1,
    title: 'Level 1: Corner Pocket Direct',
    description: 'Pocket the white coin in the top-right corner pocket.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 550, y: 300, type: 'white' },
      { x: 350, y: 350, type: 'black' }
    ]
  },
  {
    id: 2,
    title: 'Level 2: Queen Sinking Challenge',
    description: 'Pocket the Red Queen in the bottom-left corner pocket.',
    targetScore: 30,
    allowedShots: 2,
    setupCoins: [
      { x: 300, y: 480, type: 'red' },
      { x: 420, y: 320, type: 'white' }
    ]
  },
  {
    id: 3,
    title: 'Level 3: Bank Shot Master',
    description: 'Bounce off the top cushion wall to pocket the black coin.',
    targetScore: 5,
    allowedShots: 2,
    setupCoins: [
      { x: 260, y: 240, type: 'black' },
      { x: 260, y: 420, type: 'white' }
    ]
  },
  {
    id: 4,
    title: 'Level 4: Double Pocket Clear',
    description: 'Clear both white coins into opposite top pockets in 2 shots.',
    targetScore: 20,
    allowedShots: 2,
    setupCoins: [
      { x: 280, y: 280, type: 'white' },
      { x: 520, y: 280, type: 'white' },
      { x: 400, y: 350, type: 'black' }
    ]
  },
  {
    id: 5,
    title: 'Level 5: Center Splitter',
    description: 'Split the tight center pair and pocket a coin.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 385, y: 400, type: 'white' },
      { x: 415, y: 400, type: 'black' }
    ]
  },
  {
    id: 6,
    title: 'Level 6: Obstacle Avoidance',
    description: 'Angle your shot around the black blocker coin to sink the white coin.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 650, y: 220, type: 'white' },
      { x: 520, y: 380, type: 'black' }
    ]
  },
  {
    id: 7,
    title: 'Level 7: Triple Cannon',
    description: 'Hit the front coin to trigger a combination carrom shot.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 400, y: 420, type: 'white' },
      { x: 400, y: 260, type: 'white' },
      { x: 320, y: 350, type: 'black' }
    ]
  },
  {
    id: 8,
    title: 'Level 8: Queen Cover Precision',
    description: 'Pocket the Red Queen and cover it with the white coin.',
    targetScore: 40,
    allowedShots: 2,
    setupCoins: [
      { x: 350, y: 450, type: 'red' },
      { x: 580, y: 280, type: 'white' },
      { x: 400, y: 360, type: 'black' }
    ]
  },
  {
    id: 9,
    title: 'Level 9: Side-Cushion Carrom',
    description: 'Rebound off the right wall to pocket the cornered white coin.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 680, y: 600, type: 'white' },
      { x: 550, y: 500, type: 'black' }
    ]
  },
  {
    id: 10,
    title: 'Level 10: The Triangle Break',
    description: 'Pocket at least 2 coins from this tight 4-coin triangle formation.',
    targetScore: 20,
    allowedShots: 3,
    setupCoins: [
      { x: 400, y: 360, type: 'white' },
      { x: 370, y: 410, type: 'white' },
      { x: 430, y: 410, type: 'white' },
      { x: 400, y: 410, type: 'black' }
    ]
  },
  {
    id: 11,
    title: 'Level 11: Tight Angle Cut',
    description: 'Execute an extreme thin-cut shot to slice the white coin into pocket.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 180, y: 220, type: 'white' },
      { x: 300, y: 280, type: 'black' }
    ]
  },
  {
    id: 12,
    title: 'Level 12: Wall Rebound Double Sinker',
    description: 'Clear both target white coins using cushion bank shots.',
    targetScore: 20,
    allowedShots: 3,
    setupCoins: [
      { x: 220, y: 180, type: 'white' },
      { x: 580, y: 180, type: 'white' },
      { x: 400, y: 320, type: 'black' }
    ]
  },
  {
    id: 13,
    title: 'Level 13: The Gauntlet Trap',
    description: 'Navigate between two heavy black blocker coins to sink the target.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 400, y: 180, type: 'white' },
      { x: 350, y: 380, type: 'black' },
      { x: 450, y: 380, type: 'black' }
    ]
  },
  {
    id: 14,
    title: 'Level 14: Queen + Double Cover',
    description: 'Pocket the Queen and clear both white coins within 3 shots.',
    targetScore: 50,
    allowedShots: 3,
    setupCoins: [
      { x: 400, y: 380, type: 'red' },
      { x: 280, y: 320, type: 'white' },
      { x: 520, y: 320, type: 'white' }
    ]
  },
  {
    id: 15,
    title: 'Level 15: Diagonal Multi-Bank',
    description: 'Bank the striker off two walls to reach the hidden white coin.',
    targetScore: 10,
    allowedShots: 2,
    setupCoins: [
      { x: 400, y: 140, type: 'white' },
      { x: 320, y: 320, type: 'black' },
      { x: 400, y: 320, type: 'black' },
      { x: 480, y: 320, type: 'black' }
    ]
  },
  {
    id: 16,
    title: 'Level 16: Quad Coin Sweep',
    description: 'Clear all 4 white coins positioned near the 4 board quadrants.',
    targetScore: 40,
    allowedShots: 4,
    setupCoins: [
      { x: 220, y: 220, type: 'white' },
      { x: 580, y: 220, type: 'white' },
      { x: 220, y: 520, type: 'white' },
      { x: 580, y: 520, type: 'white' }
    ]
  },
  {
    id: 17,
    title: 'Level 17: Pocket Guard Break',
    description: 'Knock away the guarding black coins and sink both white target coins.',
    targetScore: 20,
    allowedShots: 3,
    setupCoins: [
      { x: 700, y: 100, type: 'white' },
      { x: 650, y: 140, type: 'black' },
      { x: 140, y: 700, type: 'white' },
      { x: 180, y: 650, type: 'black' }
    ]
  },
  {
    id: 18,
    title: 'Level 18: Combination Cascade',
    description: 'Trigger a multi-coin chain collision that pockets 2 white coins.',
    targetScore: 20,
    allowedShots: 2,
    setupCoins: [
      { x: 400, y: 480, type: 'white' },
      { x: 400, y: 350, type: 'black' },
      { x: 400, y: 220, type: 'white' },
      { x: 250, y: 350, type: 'white' }
    ]
  },
  {
    id: 19,
    title: 'Level 19: The Iron Fortress',
    description: 'Penetrate a dense wall of defender coins to pocket the Queen and target.',
    targetScore: 40,
    allowedShots: 3,
    setupCoins: [
      { x: 400, y: 280, type: 'red' },
      { x: 400, y: 220, type: 'white' },
      { x: 320, y: 400, type: 'black' },
      { x: 360, y: 400, type: 'black' },
      { x: 400, y: 400, type: 'black' },
      { x: 440, y: 400, type: 'black' },
      { x: 480, y: 400, type: 'black' }
    ]
  },
  {
    id: 20,
    title: 'Level 20: Grand Master Challenge',
    description: 'Clear the ultimate cluster: Pocket the Queen and all white coins guarded by defenders.',
    targetScore: 60,
    allowedShots: 5,
    setupCoins: [
      { x: 400, y: 400, type: 'red' },
      { x: 320, y: 320, type: 'white' },
      { x: 480, y: 320, type: 'white' },
      { x: 320, y: 480, type: 'white' },
      { x: 480, y: 480, type: 'white' },
      { x: 400, y: 260, type: 'white' },
      { x: 400, y: 330, type: 'black' },
      { x: 330, y: 400, type: 'black' },
      { x: 470, y: 400, type: 'black' }
    ]
  }
];
