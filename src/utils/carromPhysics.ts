import { Piece, Pocket, Vec2 } from '../types';
import { audio } from './audio';
import { BOUND_MAX, BOUND_MIN } from './carromBoardSetup';

const SUB_STEPS = 6;
const RESTITUTION_COIN = 0.92;
const RESTITUTION_WALL = 0.86;

export interface StepResult {
  isMoving: boolean;
  pocketedThisStep: Piece[];
  collisionsCount: number;
}

export function updatePhysicsFrame(pieces: Piece[], pockets: Pocket[]): StepResult {
  let isMoving = false;
  const pocketedThisStep: Piece[] = [];
  let collisionsCount = 0;

  for (let sub = 0; sub < SUB_STEPS; sub++) {
    // 1. Move pieces and check wall/pocket collisions
    pieces.forEach((p) => {
      if (p.isPocketed) return;

      // Position update
      const dtVel = p.vel.div(SUB_STEPS);
      p.pos = p.pos.add(dtVel);

      // Friction decay per sub-step
      p.vel = p.vel.mult(Math.pow(p.friction, 1 / SUB_STEPS));
      if (p.vel.mag() < 0.04) {
        p.vel.set(0, 0);
      } else {
        isMoving = true;
      }

      // Wall Bounce
      const minX = BOUND_MIN + p.radius;
      const maxX = BOUND_MAX - p.radius;
      const minY = BOUND_MIN + p.radius;
      const maxY = BOUND_MAX - p.radius;

      if (p.pos.x < minX) {
        p.pos.x = minX;
        p.vel.x = -p.vel.x * RESTITUTION_WALL;
        audio.playCollision(Math.abs(p.vel.x));
      } else if (p.pos.x > maxX) {
        p.pos.x = maxX;
        p.vel.x = -p.vel.x * RESTITUTION_WALL;
        audio.playCollision(Math.abs(p.vel.x));
      }

      if (p.pos.y < minY) {
        p.pos.y = minY;
        p.vel.y = -p.vel.y * RESTITUTION_WALL;
        audio.playCollision(Math.abs(p.vel.y));
      } else if (p.pos.y > maxY) {
        p.pos.y = maxY;
        p.vel.y = -p.vel.y * RESTITUTION_WALL;
        audio.playCollision(Math.abs(p.vel.y));
      }

      // Pocket Detection
      pockets.forEach((h) => {
        const dist = p.pos.dist(h.pos);
        // Soft suction effect near pocket
        if (dist < h.r + 5 && dist > 1) {
          const pullDir = h.pos.sub(p.pos).norm();
          p.vel = p.vel.add(pullDir.mult(0.15 / SUB_STEPS));
        }

        if (dist < h.r - 4) {
          p.isPocketed = true;
          p.vel.set(0, 0);
          pocketedThisStep.push(p);
          audio.playPocketSound();
        }
      });
    });

    // 2. Piece to Piece Collisions
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const p1 = pieces[i];
        const p2 = pieces[j];

        if (p1.isPocketed || p2.isPocketed) continue;

        const delta = p2.pos.sub(p1.pos);
        const dist = delta.mag();
        const minDist = p1.radius + p2.radius;

        if (dist < minDist && dist > 0.0001) {
          collisionsCount++;
          const normal = delta.norm();

          // Separation displacement to prevent overlap/sticking
          const overlap = minDist - dist;
          p1.pos = p1.pos.sub(normal.mult(overlap * 0.5));
          p2.pos = p2.pos.add(normal.mult(overlap * 0.5));

          // Relative velocity
          const vRel = p1.vel.sub(p2.vel);
          const velAlongNormal = vRel.dot(normal);

          // Only resolve if moving towards each other
          if (velAlongNormal > 0) {
            const impulseMag = (-(1 + RESTITUTION_COIN) * velAlongNormal) / (1 / p1.mass + 1 / p2.mass);
            const impulse = normal.mult(impulseMag);

            p1.vel = p1.vel.add(impulse.div(p1.mass));
            p2.vel = p2.vel.sub(impulse.div(p2.mass));

            audio.playCollision(vRel.mag());
          }
        }
      }
    }
  }

  return {
    isMoving,
    pocketedThisStep,
    collisionsCount
  };
}
