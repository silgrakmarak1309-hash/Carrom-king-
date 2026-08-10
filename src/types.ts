export type CoinType = 'white' | 'black' | 'red' | 'striker';

export type GameMode = 'classic' | 'vs_cpu' | 'puzzle' | 'practice';

export type TurnPlayer = 'player1' | 'player2';

export interface Vector2D {
  x: number;
  y: number;
}

export class Vec2 {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): Vec2 {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(v: Vector2D): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector2D): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mult(n: number): Vec2 {
    return new Vec2(this.x * n, this.y * n);
  }

  div(n: number): Vec2 {
    return n !== 0 ? new Vec2(this.x / n, this.y / n) : new Vec2();
  }

  mag(): number {
    return Math.hypot(this.x, this.y);
  }

  norm(): Vec2 {
    const m = this.mag();
    return m > 0 ? this.div(m) : new Vec2();
  }

  dist(v: Vector2D): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }
}

export interface Piece {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  type: CoinType;
  mass: number;
  isPocketed: boolean;
  pocketedAnim: number; // 0 to 1 for pocket shrink animation
  friction: number;
}

export interface Pocket {
  pos: Vec2;
  r: number;
}

export interface PuzzleLevel {
  id: number;
  title: string;
  description: string;
  targetScore: number;
  allowedShots: number;
  setupCoins: { x: number; y: number; type: CoinType }[];
}

export interface GameStats {
  p1Score: number;
  p2Score: number;
  p1CoinsPocketed: number;
  p2CoinsPocketed: number;
  queenOwner: 'none' | 'player1' | 'player2';
  queenCoverNeeded: boolean;
  shotsTaken: number;
}
