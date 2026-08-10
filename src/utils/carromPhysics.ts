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

  const numPieces = pieces.length;
  const numPockets = pockets.length;

  for (let sub = 0; sub < SUB_STEPS; sub++) {
    // 1. Move pieces and check wall / pocket collisions
    for (let i = 0; i < numPieces; i++) {
      const p = pieces[i];
      if (p.isPocketed) continue;

      // Friction decay per sub-step (pre-calculated exponent base)
      const frictionSub = Math.pow(p.friction, 1 / SUB_STEPS);

      // Velocity & Position update
      const vx = p.vel.x;
      const vy = p.vel.y;

      const dtVx = vx / SUB_STEPS;
      const dtVy = vy / SUB_STEPS;

      p.pos.x += dtVx;
      p.pos.y += dtVy;

      const newVx = vx * frictionSub;
      const newVy = vy * frictionSub;

      const speedSq = newVx * newVx + newVy * newVy;
      if (speedSq < 0.0016) { // equivalent to mag < 0.04
        p.vel.x = 0;
        p.vel.y = 0;
      } else {
        p.vel.x = newVx;
        p.vel.y = newVy;
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
      for (let k = 0; k < numPockets; k++) {
        const h = pockets[k];
        const dx = h.pos.x - p.pos.x;
        const dy = h.pos.y - p.pos.y;
        const distSq = dx * dx + dy * dy;

        const maxSuctionDist = h.r + 5;
        const maxSuctionDistSq = maxSuctionDist * maxSuctionDist;

        if (distSq < maxSuctionDistSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const pullFactor = 0.15 / (SUB_STEPS * dist);
          p.vel.x += dx * pullFactor;
          p.vel.y += dy * pullFactor;
        }

        const pocketRadiusTrigger = h.r - 4;
        if (distSq < pocketRadiusTrigger * pocketRadiusTrigger) {
          p.isPocketed = true;
          p.vel.x = 0;
          p.vel.y = 0;
          pocketedThisStep.push(p);
          audio.playPocketSound();
          break;
        }
      }
    }

    // 2. Piece to Piece Collisions
    for (let i = 0; i < numPieces; i++) {
      const p1 = pieces[i];
      if (p1.isPocketed) continue;

      for (let j = i + 1; j < numPieces; j++) {
        const p2 = pieces[j];
        if (p2.isPocketed) continue;

        const dx = p2.pos.x - p1.pos.x;
        const dy = p2.pos.y - p1.pos.y;
        const minDist = p1.radius + p2.radius;

        // Fast bounding box pruning before distance check
        if (Math.abs(dx) >= minDist || Math.abs(dy) >= minDist) continue;

        const distSq = dx * dx + dy * dy;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq && distSq > 0.000001) {
          collisionsCount++;
          const dist = Math.sqrt(distSq);

          // Normal vector components
          const nx = dx / dist;
          const ny = dy / dist;

          // Separation displacement
          const overlap = minDist - dist;
          const halfOverlap = overlap * 0.5;
          p1.pos.x -= nx * halfOverlap;
          p1.pos.y -= ny * halfOverlap;
          p2.pos.x += nx * halfOverlap;
          p2.pos.y += ny * halfOverlap;

          // Relative velocity
          const vrelX = p1.vel.x - p2.vel.x;
          const vrelY = p1.vel.y - p2.vel.y;

          // Velocity along normal
          const velAlongNormal = vrelX * nx + vrelY * ny;

          if (velAlongNormal > 0) {
            const impulseMag = (-(1 + RESTITUTION_COIN) * velAlongNormal) / (1 / p1.mass + 1 / p2.mass);
            const impX = nx * impulseMag;
            const impY = ny * impulseMag;

            p1.vel.x += impX / p1.mass;
            p1.vel.y += impY / p1.mass;
            p2.vel.x -= impX / p2.mass;
            p2.vel.y -= impY / p2.mass;

            const vrelMag = Math.sqrt(vrelX * vrelX + vrelY * vrelY);
            audio.playCollision(vrelMag);
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

