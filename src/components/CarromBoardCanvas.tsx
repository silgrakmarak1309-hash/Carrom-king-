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

  // Sync striker baseline position when not moving
  useEffect(() => {
    if (!isPhysicsRunning) {
      const activeY = turn === 'player1' ? P1_STRIKER_Y : P2_STRIKER_Y;
      striker.pos.set(strikerBaselineX, activeY);
      striker.vel.set(0, 0);
    }
  }, [strikerBaselineX, turn, isPhysicsRunning, striker, disabled, pieces]);

  useEffect(() => {
    if (disabled || isPhysicsRunning) {
      isDraggingRef.current = false;
    }
  }, [disabled, isPhysicsRunning]);

  // Main Render Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = canvas.width / BOARD_V_SIZE;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);

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
        // Pocket Mesh Background
        ctx.fillStyle = '#0a0d12';
        ctx.beginPath();
        ctx.arc(pocket.pos.x, pocket.pos.y, pocket.r, 0, Math.PI * 2);
        ctx.fill();

        // Metallic Rim
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pocket.pos.x, pocket.pos.y, pocket.r - 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 3. Baselines & Circles (Strict Double Parallel Lines)
      drawBaselines(ctx);

      // 4. Center Concentric Rings & Floral Rosette
      drawCenterRosette(ctx);

      // 5. Render EXACTLY 2 GUIDE LINES during human player aiming phase
      if (!isPhysicsRunning && !isAiTurn && isDraggingRef.current) {
        drawAimingGuideLines(ctx, striker, aimPointerPosRef.current);
      }

      // 6. Render Coins & Striker
      pieces.forEach((piece) => {
        if (piece.isPocketed) return;
        drawPiece(ctx, piece);
      });

      if (striker && !striker.isPocketed) {
        drawPiece(ctx, striker);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pieces, striker, isPhysicsRunning, isAiTurn, turn]);

  // Helper: Draw Double Baselines with Red Endpoint Circles
  const drawBaselines = (ctx: CanvasRenderingContext2D) => {
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
      [
        { x: x1, y: y1 },
        { x: x2, y: y2 }
      ].forEach((pt) => {
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

    // 4 Sides: Bottom, Top, Left, Right
    drawDoubleLine(BASELINE_LEFT, P1_STRIKER_Y, BASELINE_RIGHT, P1_STRIKER_Y, false);
    drawDoubleLine(BASELINE_LEFT, P2_STRIKER_Y, BASELINE_RIGHT, P2_STRIKER_Y, false);
    drawDoubleLine(P2_STRIKER_Y, BASELINE_LEFT, P2_STRIKER_Y, BASELINE_RIGHT, true);
    drawDoubleLine(P1_STRIKER_Y, BASELINE_LEFT, P1_STRIKER_Y, BASELINE_RIGHT, true);

    // Corner Diagonal Arrow Lines
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
  };

  // Helper: Draw Center Rosette
  const drawCenterRosette = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 2;

    // Outer Circle Ring
    ctx.beginPath();
    ctx.arc(400, 400, 70, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Circle Ring
    ctx.beginPath();
    ctx.arc(400, 400, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Red Queen Circle Fill
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.beginPath();
    ctx.arc(400, 400, 15.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Helper: Draw EXACTLY 2 GUIDE LINES during shot aiming
  const drawAimingGuideLines = (ctx: CanvasRenderingContext2D, striker: Piece, pointerPos: Vec2) => {
    const pullVec = striker.pos.sub(pointerPos);
    const dragMag = pullVec.mag();

    if (dragMag < 5) return; // Too small drag threshold

    const aimDir = pullVec.norm();
    const power = Math.min(dragMag * 0.18, 24);
    const lineLength = Math.min(power * 25, 450);

    // ----------------------------------------------------
    // GUIDE LINE 1: Forward Aim Trajectory Line
    // ----------------------------------------------------
    const endPoint = striker.pos.add(aimDir.mult(lineLength));

    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.moveTo(striker.pos.x, striker.pos.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Target Tip Pointer Dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // ----------------------------------------------------
    // GUIDE LINE 2: Pull-back Power & Tension Vector Line
    // ----------------------------------------------------
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(striker.pos.x, striker.pos.y);
    ctx.lineTo(pointerPos.x, pointerPos.y);
    ctx.stroke();

    // Tension Drag Circle Indicator at Pointer
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pointerPos.x, pointerPos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  // Helper: Draw Coin / Striker Piece
  const drawPiece = (ctx: CanvasRenderingContext2D, piece: Piece) => {
    ctx.save();

    // Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(piece.pos.x, piece.pos.y, piece.radius, 0, Math.PI * 2);

    if (piece.type === 'white') {
      const grad = ctx.createRadialGradient(
        piece.pos.x - 4,
        piece.pos.y - 4,
        2,
        piece.pos.x,
        piece.pos.y,
        piece.radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.8, '#f1f5f9');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
    } else if (piece.type === 'black') {
      const grad = ctx.createRadialGradient(
        piece.pos.x - 4,
        piece.pos.y - 4,
        2,
        piece.pos.x,
        piece.pos.y,
        piece.radius
      );
      grad.addColorStop(0, '#475569');
      grad.addColorStop(0.7, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
    } else if (piece.type === 'red') {
      const grad = ctx.createRadialGradient(
        piece.pos.x - 4,
        piece.pos.y - 4,
        2,
        piece.pos.x,
        piece.pos.y,
        piece.radius
      );
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.6, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
    } else if (piece.type === 'striker') {
      const grad = ctx.createRadialGradient(
        piece.pos.x - 5,
        piece.pos.y - 5,
        3,
        piece.pos.x,
        piece.pos.y,
        piece.radius
      );
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#b45309');
      ctx.fillStyle = grad;
    }

    ctx.fill();

    // Coin Outer Border
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = piece.type === 'striker' ? '#451a03' : '#1e293b';
    ctx.lineWidth = piece.type === 'striker' ? 2.5 : 1.5;
    ctx.stroke();

    // Striker Decorative Ring
    if (piece.type === 'striker') {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(piece.pos.x, piece.pos.y, piece.radius - 5, 0, Math.PI * 2);
      ctx.stroke();
    }

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

  // Native Non-Passive Touch Listeners for Android WebView & Mobile Touch Devices
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

      // DPR handling for sharp graphics
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
