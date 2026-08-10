import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BASELINE_LEFT, BASELINE_RIGHT } from '../utils/carromBoardSetup';

interface StrikerControlBarProps {
  value: number;
  onChange: (x: number) => void;
  disabled: boolean;
}

export const StrikerControlBar: React.FC<StrikerControlBarProps> = ({ value, onChange, disabled }) => {
  const stepLeft = () => {
    if (disabled) return;
    onChange(Math.max(BASELINE_LEFT, value - 20));
  };

  const stepRight = () => {
    if (disabled) return;
    onChange(Math.min(BASELINE_RIGHT, value + 20));
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-xl flex items-center justify-between gap-2 z-20">
      <button
        type="button"
        onClick={stepLeft}
        disabled={disabled || value <= BASELINE_LEFT}
        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-amber-400 font-black text-xs rounded-lg transition-all border border-amber-500/20 shadow cursor-pointer select-none"
        title="Move Striker Left"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>LEFT</span>
      </button>

      <div className="relative flex-1 flex items-center px-1">
        <input
          type="range"
          min={BASELINE_LEFT}
          max={BASELINE_RIGHT}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40 disabled:cursor-not-allowed touch-none"
        />
      </div>

      <button
        type="button"
        onClick={stepRight}
        disabled={disabled || value >= BASELINE_RIGHT}
        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-amber-400 font-black text-xs rounded-lg transition-all border border-amber-500/20 shadow cursor-pointer select-none"
        title="Move Striker Right"
      >
        <span>RIGHT</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
