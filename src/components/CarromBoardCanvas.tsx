import React, { useEffect, useRef } from 'react';
import { CoinType, Piece, Pocket, Vec2 } from '../types';
import { audio } from '../utils/audio';
import {
  BASELINE_LEFT,
  BASELINE_RIGHT,
  BOARD_V_SIZE,
  BOUND_MAX,
  BOUND_MIN,
  P1_STRIKER_Y,
  P2_STRIKER_Y,
  POCKETS,
  STRIKER_RADIUS
} from '../utils/carromBoardSetup';

interface CarromBoardCanvasProps {
  pieces: Piece[];
  striker: Piece;
  turn: 'player1' | 'player2';
  isPhysicsRunning: boolean;
  isAiTurn: boolean;
  strikerBaselineX: number;
  disabled?: boolean;
  onStrikerXChange: (x: number) => void;
  onTakeShot: (shotVel: Vec2) => void;
}

// ----------------------------------------------------
// PRE-RENDER CACHES FOR BOARD & PIECE SPRITES
// ----------------------------------------------------
let boardCacheCanvas: HTMLCanvasElement | null = null;
const spriteCache: Record<string, { canvas: HTMLCanvasElement; offset: number }> = {};

function getBoardCache(): HTMLCanvasElement {
  if (boardCacheCanvas) return boardCacheCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = BOARD_V_SIZE;
  canvas.height = BOARD_V_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Board Outer Wooden Frame
  ctx.fillStyle = '#2a1607';
  ctx.fillRect(0, 0, BOARD_V_SIZE, BOARD_V_SIZE);

  // Inner Wood Playing Surface
  const innerSize = BOUND_MAX - BOUND_MIN;
  const woodGrad = ctx.createRadialGradient(400, 400, 50, 400, 400, 500);
  woodGrad.addColorStop(0, '#faecd9');
  woodGrad.addColorStop(0.7, '#f3dcb8');
  woodGrad.addColorStop(1, '#e5c99d');

  ctx.fillStyle = woodGrad;
  ctx.fillRect(BOUND_MIN, BOUND_MIN, innerSize, innerSize);

  // Board Border Frame Shadow
  ctx.strokeStyle = '#1a0b03';
  ctx.lineWidth = 12;
  ctx.strokeRect(BOUND_MIN + 6, BOUND_MIN + 6, innerSize - 12, innerSize - 12);

  // 2. Corner Pockets
  POCKETS.forEach((pocket: Pocket) => {
    ctx.fillStyle = '#0a0d12';
    ctx.beginPath();
    ctx.arc(pocket.pos.x, pocket.pos.y, pocket.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pocket.pos.x, pocket.pos.y, pocket.r - 4, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 3. Baselines & End Circles
  drawBaselinesStatic(ctx);

  // 4. Center Concentric Rings & Floral Rosette
  drawCenterRosetteStatic(ctx);

  boardCacheCanvas = canvas;
  return canvas;
}

function drawBaselinesStatic(ctx: CanvasRenderingContext2D) {
  const gap = 16;
  const endCircleR = 12;

  const drawDoubleLine = (x1: number, y1: number, x2: number, y2: number, isVertical: boolean) => {
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (isVertical) {
      ctx.moveTo(x1 - gap / 2, y1);
      ctx.lineTo(x2 - gap / 2, y2);
      ctx.moveTo(x1 + gap / 2, y1);
      ctx.lineTo(x2 + gap / 2, y2);
    } else {
      ctx.moveTo(x1, y1 - gap / 2);
      ctx.lineTo(x2, y1 - gap / 2);
      ctx.moveTo(x1, y2 + gap / 2);
      ctx.lineTo(x2, y2 + gap / 2);
    }
    ctx.stroke();

    // End Circles
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach((pt) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, endCircleR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  drawDoubleLine(BASELINE_LEFT, P1_STRIKER_Y, BASELINE_RIGHT, P1_STRIKER_Y, false);
  drawDoubleLine(BASELINE_LEFT, P2_STRIKER_Y, BASELINE_RIGHT, P2_STRIKER_Y, false);
  drawDoubleLine(P2_STRIKER_Y, BASELINE_LEFT, P2_STRIKER_Y, BASELINE_RIGHT, true);
  drawDoubleLine(P1_STRIKER_Y, BASELINE_LEFT, P1_STRIKER_Y, BASELINE_RIGHT, true);

  const drawDiagonal = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  drawDiagonal(125, 125, 185, 185);
  drawDiagonal(675, 125, 615, 185);
  drawDiagonal(125, 675, 185, 615);
  drawDiagonal(675, 675, 615, 615);
}

function drawCenterRosetteStatic(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(400, 400, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(400, 400, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.beginPath();
  ctx.arc(400, 400, 15.5, 0, Math.PI * 2);
  ctx.fill();
}

function getPieceSprite(type: CoinType, radius: number): { canvas: HTMLCanvasElement; offset: number } {
  const key = `${type}_${radius}`;
  if (spriteCache[key]) return spriteCache[key];

  const pad = 8;
  const size = Math.ceil((radius + pad) * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    // Fast Translucent Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 3, radius, 0, Math.PI * 2);
    ctx.fill();

    // Radial Gradient Coin Fill
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    if (type === 'white') {
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.8, '#f1f5f9');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
    } else if (type === 'black') {
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
    } else if (type === 'red') {
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius);
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.6, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
    } else if (type === 'striker') {
      const grad = ctx.createRadialGradient(cx - 5, cy - 5, 3, cx, cy, radius);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
    }

    ctx.fill();

    // Outer Stroke
    ctx.strokeStyle = type === 'striker' ? '#451a03' : '#1e293b';
    ctx.lineWidth = type === 'striker' ? 2.5 : 1.5;
    ctx.stroke();

    // Striker Inner Gold Accent Ring
    if (type === 'striker') {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const result = { canvas, offset: size / 2 };
  spriteCache[key] = result;
  return result;
}

export const CarromBoardCanvas: React.FC<CarromBoardCanvasProps> = ({
  pieces,
  striker,
  turn,
  isPhysicsRunning,
  isAiTurn,
  strikerBaselineX,
  disabled = false,
  onStrikerXChange,
  onTakeShot
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Interaction State for Aiming
  const isDraggingRef = useRef<boolean>(false);
  const aimPointerPosRef = useRef<Vec2>(new Vec2(400, 642));

  // Refs for zero-teardown high FPS animation loop
  const piecesRef = useRef<Piece[]>(pieces);
  piecesRef.current = pieces;

  const strikerRef = useRef<Piece>(striker);
  strikerRef.current = striker;

  const isPhysicsRunningRef = useRef<boolean>(isPhysicsRunning);
  isPhysicsRunningRef.current = isPhysicsRunning;

  const isAiTurnRef = useRef<boolean>(isAiTurn);
  isAiTurnRef.current = isAiTurn;

  // Sync striker baseline position when not moving
  useEffect(() => {
    if (!isPhysicsRunning) {
      const activeY = turn === 'player1' ? P1_STRIKER_Y : P2_STRIKER_Y;
      striker.pos.set(strikerBaselineX, activeY);
      striker.vel.set(0, 0);
    }
  }, [strikerBaselineX, turn, isPhysicsRunning, striker, disabled]);

  useEffect(() => {
    if (disabled || isPhysicsRunning) {
      isDraggingRef.current = false;
    }
  }, [disabled, isPhysicsRunning]);

  // Main High Performance Render Loop (Continuous requestAnimationFrame)
  useEffect(() => {
    let animationFrameId: number;
    const boardCache = getBoardCache();

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = canvas.width / BOARD_V_SIZE;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);

          // 1. Draw Pre-rendered Static Board (Ultra Fast)
          ctx.drawImage(boardCache, 0, 0, BOARD_V_SIZE, BOARD_V_SIZE);

          // 2. Render Aiming Guide Lines during player turn
          if (!isPhysicsRunningRef.current && !isAiTurnRef.current && isDraggingRef.current) {
            drawAimingGuideLines(ctx, strikerRef.current, aimPointerPosRef.current);
          }

          // 3. Draw Board Pieces (Pre-rendered Sprites)
          const currentPieces = piecesRef.current;
          const len = currentPieces.length;
          for (let i = 0; i < len; i++) {
            const piece = currentPieces[i];
            if (piece.isPocketed) continue;
            const sprite = getPieceSprite(piece.type, piece.radius);
            ctx.drawImage(
              sprite.canvas,
              piece.pos.x - sprite.offset,
              piece.pos.y - sprite.offset
            );
          }

          // 4. Draw Striker
          const curStriker = strikerRef.current;
          if (curStriker && !curStriker.isPocketed) {
            const sprite = getPieceSprite('striker', curStriker.radius);
            ctx.drawImage(
              sprite.canvas,
              curStriker.pos.x - sprite.offset,
              curStriker.pos.y - sprite.offset
            );
          }

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Helper: Draw EXACTLY 2 GUIDE LINES during shot aiming
  const drawAimingGuideLines = (ctx: CanvasRenderingContext2D, striker: Piece, pointerPos: Vec2) => {
    const pullVec = striker.pos.sub(pointerPos);
    const dragMag = pullVec.mag();

    if (dragMag < 5) return;

    const aimDir = pullVec.norm();
    const power = Math.min(dragMag * 0.18, 24);
    const lineLength = Math.min(power * 25, 450);

    const endPoint = striker.pos.add(aimDir.mult(lineLength));

    ctx.save();
    // GUIDE LINE 1: Forward Trajectory
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(striker.pos.x, striker.pos.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target Tip Dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // GUIDE LINE 2: Pull-back Power Line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(striker.pos.x, striker.pos.y);
    ctx.lineTo(pointerPos.x, pointerPos.y);
    ctx.stroke();

    // Pointer Drag Indicator Circle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pointerPos.x, pointerPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  // Convert Client Coordinates to Virtual Board Coordinates
  const getCanvasCoordsFromClient = (clientX: number, clientY: number): Vec2 | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const scale = BOARD_V_SIZE / rect.width;
    const vx = (clientX - rect.left) * scale;
    const vy = (clientY - rect.top) * scale;

    return new Vec2(vx, vy);
  };

  // Mouse Input Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPhysicsRunning || isAiTurn || disabled) return;

    const coords = getCanvasCoordsFromClient(e.clientX, e.clientY);
    if (!coords) return;

    if (coords.dist(striker.pos) < STRIKER_RADIUS + 40) {
      isDraggingRef.current = true;
      aimPointerPosRef.current = coords;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || isPhysicsRunning || isAiTurn || disabled) return;

    const coords = getCanvasCoordsFromClient(e.clientX, e.clientY);
    if (coords) {
      aimPointerPosRef.current = coords;
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (isPhysicsRunning || isAiTurn) return;

    const pullVec = striker.pos.sub(aimPointerPosRef.current);
    const dragMag = pullVec.mag();
    const power = Math.min(dragMag * 0.18, 24);

    if (power > 1.2) {
      const shotVel = pullVec.norm().mult(power);
      audio.playStrikerHit(power);
      onTakeShot(shotVel);
    }
  };

  // Touch Listeners for Mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (isPhysicsRunning || isAiTurn || disabled) return;
      if (!e.touches || e.touches.length === 0) return;

      const touch = e.touches[0];
      const coords = getCanvasCoordsFromClient(touch.clientX, touch.clientY);
      if (!coords) return;

      if (coords.dist(striker.pos) < STRIKER_RADIUS + 40) {
        isDraggingRef.current = true;
        aimPointerPosRef.current = coords;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || isPhysicsRunning || isAiTurn || disabled) return;
      if (e.cancelable) e.preventDefault();
      if (!e.touches || e.touches.length === 0) return;

      const touch = e.touches[0];
      const coords = getCanvasCoordsFromClient(touch.clientX, touch.clientY);
      if (coords) {
        aimPointerPosRef.current = coords;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.cancelable) e.preventDefault();
      isDraggingRef.current = false;

      if (isPhysicsRunning || isAiTurn) return;

      const pullVec = striker.pos.sub(aimPointerPosRef.current);
      const dragMag = pullVec.mag();
      const power = Math.min(dragMag * 0.18, 24);

      if (power > 1.2) {
        const shotVel = pullVec.norm().mult(power);
        audio.playStrikerHit(power);
        onTakeShot(shotVel);
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: false });
    window.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [striker, isPhysicsRunning, isAiTurn, disabled, onTakeShot]);

  // Responsive Container Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const size = Math.min(container.clientWidth * 0.98, window.innerHeight * 0.73, 640);

      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="block rounded-lg shadow-2xl cursor-crosshair border border-amber-900/40 bg-amber-950 touch-none"
      />
    </div>
  );
};

