import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Frown, Sparkles, RotateCcw, ArrowRight, List, PartyPopper } from 'lucide-react';
import { GameMode } from '../types';
import { PUZZLE_LEVELS } from '../utils/carromBoardSetup';

interface WinnerPopupModalProps {
  gameOverText: string | null;
  mode: GameMode;
  p1Score: number;
  p2Score: number;
  currentPuzzleIndex: number;
  onPlayAgain: () => void;
  onNextLevel?: () => void;
  onOpenModeSelect: () => void;
}

// Simple floating confetti particles generator for celebration
const CONFETTI_PARTICLES = Array.from({ length: 16 }).map((_, i) => {
  const angle = (i / 16) * 360;
  const radius = 120 + Math.random() * 80;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;
  const colorClass = [
    'bg-amber-400',
    'bg-emerald-400',
    'bg-purple-400',
    'bg-sky-400',
    'bg-rose-400'
  ][i % 5];

  return {
    id: i,
    x,
    y,
    size: 6 + (i % 3) * 3,
    colorClass,
    delay: (i % 4) * 0.05
  };
});

export const WinnerPopupModal: React.FC<WinnerPopupModalProps> = ({
  gameOverText,
  mode,
  p1Score,
  p2Score,
  currentPuzzleIndex,
  onPlayAgain,
  onNextLevel,
  onOpenModeSelect
}) => {
  if (!gameOverText) return null;

  const isPlayerWin =
    gameOverText === 'YOU WON' ||
    gameOverText.includes('YOU WON') ||
    gameOverText.includes('PLAYER 1 WINS');

  const isAiWin =
    gameOverText === 'YOU LOST' ||
    gameOverText.includes('LOST') ||
    gameOverText.includes('COMPUTER');
  const isPuzzleCleared = mode === 'puzzle' && gameOverText.includes('CLEARED');
  const isPuzzleFailed = mode === 'puzzle' && !isPuzzleCleared;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/60 flex items-center justify-center p-4 select-none"
      >
        {/* Card Overlay Wrapper */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 text-slate-100 border-2 overflow-hidden ${
            isPlayerWin || isPuzzleCleared
              ? 'bg-slate-900/95 border-amber-400/80 shadow-[0_0_60px_rgba(251,191,36,0.35)]'
              : isAiWin || isPuzzleFailed
              ? 'bg-slate-900/95 border-rose-500/80 shadow-[0_0_60px_rgba(244,63,94,0.35)]'
              : 'bg-slate-900/95 border-emerald-500/80 shadow-[0_0_60px_rgba(16,185,129,0.35)]'
          }`}
        >
          {/* Confetti Particle Animations on Win */}
          {(isPlayerWin || isPuzzleCleared) && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
              {CONFETTI_PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    scale: [0, 1.2, 0.8],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    type: 'tween',
                    duration: 1.2,
                    ease: 'easeOut',
                    delay: p.delay,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className={`absolute rounded-full ${p.colorClass}`}
                  style={{ width: p.size, height: p.size }}
                />
              ))}
            </div>
          )}

          {/* Icon Header */}
          <div className="relative z-10 flex justify-center pt-2">
            {isPlayerWin ? (
              <motion.div
                initial={{ rotate: -15, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-2xl shadow-lg"
              >
                <Trophy className="w-14 h-14 text-amber-400" />
              </motion.div>
            ) : isAiWin || isPuzzleFailed ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl shadow-lg"
              >
                <Frown className="w-14 h-14 text-rose-500" />
              </motion.div>
            ) : isPuzzleCleared ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                className="p-3 bg-purple-500/20 border border-purple-400/50 rounded-2xl shadow-lg"
              >
                <Sparkles className="w-14 h-14 text-purple-400" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-3 bg-slate-800 rounded-2xl"
              >
                <PartyPopper className="w-14 h-14 text-slate-300" />
              </motion.div>
            )}
          </div>

          {/* Title & Headline */}
          <div className="relative z-10 space-y-1">
            {isPlayerWin ? (
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-black tracking-tight text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]"
              >
                YOU WON! 🎉
              </motion.h2>
            ) : isAiWin || isPuzzleFailed ? (
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-black tracking-tight text-rose-500 drop-shadow-[0_2px_10px_rgba(244,63,94,0.5)]"
              >
                {mode === 'puzzle' ? 'TRY AGAIN!' : 'YOU LOST!'}
              </motion.h2>
            ) : (
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-2xl font-black tracking-tight ${
                  isPuzzleCleared ? 'text-purple-400' : 'text-slate-200'
                }`}
              >
                {gameOverText}
              </motion.h2>
            )}

            <p className="text-xs font-semibold text-slate-300">
              {isPlayerWin && mode === 'vs_cpu' && 'Congratulations! You defeated the Computer AI.'}
              {isAiWin && mode === 'vs_cpu' && 'The Computer AI won this match. Try again!'}
              {mode === 'puzzle' && isPuzzleCleared && (PUZZLE_LEVELS[currentPuzzleIndex]?.title || 'Level Cleared!')}
              {mode === 'puzzle' && isPuzzleFailed && 'Shot missed or level objective not met. Try again!'}
              {mode === 'classic' && 'Match Complete! Great game.'}
            </p>
          </div>

          {/* Score Badge */}
          {mode !== 'puzzle' && (
            <div className="relative z-10 py-2 px-4 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs text-slate-300 font-mono flex items-center justify-center gap-3">
              <span>
                You: <strong className="text-amber-400 font-bold text-sm">{p1Score}</strong>
              </span>
              <span className="text-slate-500">|</span>
              <span>
                {mode === 'vs_cpu' ? 'CPU' : 'Player 2'}:{' '}
                <strong className="text-emerald-400 font-bold text-sm">{p2Score}</strong>
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="relative z-10 flex flex-col gap-2 pt-2">
            {mode === 'puzzle' && isPuzzleCleared && currentPuzzleIndex < 19 && onNextLevel && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNextLevel();
                }}
                className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <span>Next Level</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAgain();
              }}
              className={`w-full py-3 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
                isPlayerWin || isPuzzleCleared
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-rose-500 hover:bg-rose-400 text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {mode === 'puzzle'
                  ? isPuzzleCleared
                    ? 'Replay Level'
                    : 'TRY AGAIN'
                  : 'PLAY AGAIN'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModeSelect();
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer border border-slate-700/60"
            >
              <List className="w-3.5 h-3.5" />
              <span>Select Mode / Level</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
