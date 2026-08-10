import React from 'react';
import { GameMode } from '../types';
import { Bot, Puzzle, Trophy, Target, User, Volume2, VolumeX, HelpCircle, Play, Crown } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface DashboardProps {
  profileImage: string | null;
  profileName: string;
  isMuted: boolean;
  unlockedPuzzleLevel: number;
  onOpenProfile: () => void;
  onOpenRules: () => void;
  onToggleMute: () => void;
  onSelectMode: (mode: GameMode, puzzleLevelId?: number) => void;
  onOpenPuzzleSelector: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profileImage,
  profileName,
  isMuted,
  unlockedPuzzleLevel,
  onOpenProfile,
  onOpenRules,
  onToggleMute,
  onSelectMode,
  onOpenPuzzleSelector,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[90vh] py-4 px-4 text-slate-100">
      {/* Top Navigation / Header Bar */}
      <header className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-3 shadow-xl mb-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-lg text-slate-950 font-black">
            <Crown className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-amber-400 leading-none flex items-center gap-1.5">
              <span>CARROM CLASH</span>
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400 inline-block" />
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Pro Carrom Board
            </p>
          </div>
        </div>

        {/* Action Controls & Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-transform active:scale-95 cursor-pointer border border-slate-700/50"
            title="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Rules Button */}
          <button
            type="button"
            onClick={onOpenRules}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-transform active:scale-95 cursor-pointer border border-slate-700/50"
            title="Rules & How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Profile Avatar Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-800 hover:bg-slate-700/90 border border-amber-500/40 rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md"
            title="Player Profile"
          >
            <div className="w-7 h-7 rounded-full border-2 border-amber-400 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="Profile Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <span className="text-xs font-bold text-slate-200 max-w-[90px] truncate">
              {profileName || 'Player 1'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Hero Banner / Intro */}
      <div className="w-full text-center my-2 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Ultimate Carrom Experience
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-100 mb-2">
          SELECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">GAME MODE</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Choose a mode below to start playing immediately. Compete against AI, local friends, or solve trick shot puzzles!
        </p>
      </div>

      {/* Game Mode Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Card 1: VS COMPUTER */}
        <div className="relative group bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-950/40">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Bot className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">
              Single Player
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-black text-emerald-300 mb-1 tracking-tight">
              VS COMPUTER
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test your skills against our smart AI bot with realistic shot calculations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode('vs_cpu')}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>VS COMPUTER</span>
          </button>
        </div>

        {/* Card 2: PUZZLE MODE */}
        <div className="relative group bg-slate-900/90 border border-purple-500/40 hover:border-purple-400 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-950/40">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
              <Puzzle className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-full">
              {unlockedPuzzleLevel}/20 Unlocked
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-black text-purple-300 mb-1 tracking-tight">
              PUZZLE MODE
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Master 20 tactical trick shots and puzzle levels with limited shot counts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectMode('puzzle', unlockedPuzzleLevel)}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PUZZLE MODE</span>
            </button>
            <button
              type="button"
              onClick={onOpenPuzzleSelector}
              className="p-3 bg-purple-950/80 hover:bg-purple-900/80 border border-purple-600/60 text-purple-300 rounded-xl transition-transform active:scale-95 cursor-pointer"
              title="Select Level"
            >
              <Trophy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: 2 PLAYERS */}
        <div className="relative group bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-950/40">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Trophy className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded-full">
              Pass & Play
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-black text-amber-300 mb-1 tracking-tight">
              2 PLAYERS
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Play classic offline Carrom match locally with a friend on the same screen.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectMode('classic')}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>2 PLAYERS</span>
          </button>
        </div>
      </div>

      {/* Secondary Quick Action / Practice Banner */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-200">Want to warm up first?</h4>
            <p className="text-xs text-slate-400">Try Free Practice Mode to test shots with unlimited retries.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectMode('practice')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          Free Practice
        </button>
      </div>

      {/* AdMob Banner Container */}
      <div className="w-full mt-4 flex justify-center">
        <AdBanner />
      </div>
    </div>
  );
};
