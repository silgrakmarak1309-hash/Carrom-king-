import React, { useState } from 'react';
import { GameMode } from '../types';
import { PUZZLE_LEVELS } from '../utils/carromBoardSetup';
import { Trophy, Bot, Puzzle, Target, X, Lock, CheckCircle2, ChevronLeft } from 'lucide-react';

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode, puzzleLevelId?: number) => void;
  activeMode: GameMode;
  unlockedPuzzleLevel?: number;
  currentPuzzleLevelId?: number;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  activeMode,
  unlockedPuzzleLevel = 1,
  currentPuzzleLevelId = 1
}) => {
  const [view, setView] = useState<'modes' | 'puzzles'>('modes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {view === 'puzzles' ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setView('modes')}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <h2 className="text-lg font-black text-purple-400 tracking-tight flex-1 text-center pr-6">
                PUZZLE LEVELS
              </h2>
            </div>
            <p className="text-xs text-slate-400 text-center mb-3">
              Unlocked: Level {unlockedPuzzleLevel} of 20
            </p>

            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-4 sm:grid-cols-5 gap-2 my-1">
              {PUZZLE_LEVELS.map((lvl) => {
                const isUnlocked = lvl.id <= unlockedPuzzleLevel;
                const isCurrent = activeMode === 'puzzle' && currentPuzzleLevelId === lvl.id;
                const isCompleted = lvl.id < unlockedPuzzleLevel;

                return (
                  <button
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onClick={() => {
                      onSelectMode('puzzle', lvl.id);
                      onClose();
                    }}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition-all h-14 ${
                      isCurrent
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200 ring-2 ring-purple-500/50'
                        : isUnlocked
                        ? isCompleted
                          ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-purple-950/40 border-purple-600/60 text-purple-300 hover:bg-purple-900/60'
                        : 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <span className="text-sm font-black">{lvl.id}</span>
                        {isCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 absolute top-1 right-1" />
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold">{lvl.id}</span>
                        <Lock className="w-3 h-3 text-slate-600 mt-0.5" />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-black text-amber-400 mb-1 tracking-tight text-center">SELECT GAME MODE</h2>
            <p className="text-xs text-slate-400 text-center mb-5">Choose your preferred Carrom match mode</p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  onSelectMode('classic');
                  onClose();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'classic'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="p-2.5 bg-amber-500/20 rounded-lg text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Classic Carrom</div>
                  <div className="text-xs text-slate-400">2-Player Local Pass & Play match</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectMode('vs_cpu');
                  onClose();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'vs_cpu'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">vs Computer (AI)</div>
                  <div className="text-xs text-slate-400">Play against smart AI bot</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setView('puzzles');
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'puzzle'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 rounded-lg text-purple-400">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Puzzle Challenge</div>
                    <div className="text-xs text-slate-400">20 trick shots & tactical puzzles</div>
                  </div>
                </div>
                <div className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-extrabold">
                  {unlockedPuzzleLevel}/20
                </div>
              </button>

              <button
                onClick={() => {
                  onSelectMode('practice');
                  onClose();
                }}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  activeMode === 'practice'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Free Practice</div>
                  <div className="text-xs text-slate-400">Unlimited practice shots and warm-up</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
