import { CoinType, Piece, Pocket, Vec2 } from '../types';
import { BASELINE_LEFT, BASELINE_RIGHT, P2_STRIKER_Y, POCKETS } from './carromBoardSetup';

export interface AIShotPlan {
  strikerX: number;
  shotVel: Vec2;
  power: number;
  targetCoinId?: string;
}

export function calculateAIShot(
  pieces: Piece[],
  pockets: Pocket[],
  cpuCoinType: CoinType = 'black'
): AIShotPlan {
  // 1. Gather candidate coins for CPU
  const activeCoins = pieces.filter((p) => !p.isPocketed && p.type !== 'striker');

  let targetCoins = activeCoins.filter((p) => p.type === cpuCoinType || p.type === 'red');
  if (targetCoins.length === 0) {
    // Fallback to any active coin if cpu target coins are gone
    targetCoins = activeCoins;
  }

  if (targetCoins.length === 0) {
    // Default fallback shot
    return {
      strikerX: 400,
      shotVel: new Vec2(0, 15),
      power: 15
    };
  }

  let bestShot: {
    score: number;
    strikerX: number;
    shotVel: Vec2;
    power: number;
    coinId: string;
  } | null = null;

  // 2. Evaluate candidate shots
  for (const coin of targetCoins) {
    for (const pocket of pockets) {
      // Vector from coin to pocket
      const coinToPocket = pocket.pos.sub(coin.pos);
      const pocketDist = coinToPocket.mag();
      const pocketDir = coinToPocket.norm();

      // Ghost ball position where striker must hit the coin
      // Ghost ball is placed behind coin in opposite direction of pocket
      const ghostPos = coin.pos.sub(pocketDir.mult(coin.radius + 21.0));

      // Test multiple baseline positions for striker
      const stepCount = 15;
      for (let i = 0; i <= stepCount; i++) {
        const testX = BASELINE_LEFT + ((BASELINE_RIGHT - BASELINE_LEFT) * i) / stepCount;
        const strikerPos = new Vec2(testX, P2_STRIKER_Y);

        // Vector from striker to ghost position
        const strikerToGhost = ghostPos.sub(strikerPos);
        const strikerDist = strikerToGhost.mag();
        const strikerDir = strikerToGhost.norm();

        // Cut angle check: dot product between striker path and pocket path
        const cutCos = strikerDir.dot(pocketDir);

        // We prefer cutCos > 0.3 (direct-ish shots)
        if (cutCos > 0.2) {
          // Check for line of sight obstruction from striker to ghost position
          let pathObstructed = false;
          for (const obstacle of activeCoins) {
            if (obstacle.id === coin.id) continue;
            const obstacleDist = obstacle.pos.dist(strikerPos);
            if (obstacleDist < strikerDist) {
              // Distance from obstacle center to striker trajectory ray
              const vecToObstacle = obstacle.pos.sub(strikerPos);
              const projLength = vecToObstacle.dot(strikerDir);
              if (projLength > 0 && projLength < strikerDist) {
                const projPoint = strikerPos.add(strikerDir.mult(projLength));
                const distToLine = obstacle.pos.dist(projPoint);
                if (distToLine < obstacle.radius + 22.0) {
                  pathObstructed = true;
                  break;
                }
              }
            }
          }

          if (!pathObstructed) {
            // Quality score calculation
            const score = cutCos * 100 - pocketDist * 0.1 - strikerDist * 0.05 + (coin.type === 'red' ? 25 : 0);

            if (!bestShot || score > bestShot.score) {
              const reqPower = Math.min(Math.max((strikerDist + pocketDist) * 0.035, 10), 22);
              bestShot = {
                score,
                strikerX: testX,
                shotVel: strikerDir.mult(reqPower),
                power: reqPower,
                coinId: coin.id
              };
            }
          }
        }
      }
    }
  }

  // 3. Return best shot or fallback shot towards center / random target
  if (bestShot) {
    return {
      strikerX: bestShot.strikerX,
      shotVel: bestShot.shotVel,
      power: bestShot.power,
      targetCoinId: bestShot.coinId
    };
  } else {
    // Fallback shot: aim at closest coin with moderate speed
    const closestCoin = targetCoins[0];
    const randX = 300 + Math.random() * 200;
    const strikerPos = new Vec2(randX, P2_STRIKER_Y);
    const dir = closestCoin.pos.sub(strikerPos).norm();
    return {
      strikerX: randX,
      shotVel: dir.mult(14),
      power: 14,
      targetCoinId: closestCoin.id
    };
  }
}
