import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-black text-amber-400 mb-1 tracking-tight">CARROM RULES & HOW TO PLAY</h2>
        <p className="text-xs text-slate-400 mb-4">Official regulations and shot instructions</p>

        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-amber-300 text-sm mb-1">🎯 Aiming & Shooting</div>
            <p>1. Slide the bottom bar to position the striker anywhere on your baseline.</p>
            <p>2. Drag backward from the striker to aim and set power.</p>
            <p>3. Release to launch the striker smoothly.</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-emerald-300 text-sm mb-1">🏆 Scoring</div>
            <p>• White Coin: +10 Points</p>
            <p>• Black Coin: +5 Points</p>
            <p>• Red Queen: +30 Points (Must be covered by pocketing any coin in the same or next shot!)</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <div className="font-bold text-red-400 text-sm mb-1">⚠️ Fouls & Turn Rules</div>
            <p>• Pocketing the Striker is a Foul (-5 pts penalty & turn passes to opponent).</p>
            <p>• Pocketing your own coin grants an extra turn!</p>
            <p>• If no coins are pocketed, turn passes to the other player.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Got it, Let's Play!</span>
        </button>
      </div>
    </div>
  );
};
