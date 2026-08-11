import React, { useState, useEffect } from 'react';
import { Globe, Users, Play, X, Zap, Shield, Copy, Check, Radio, Award } from 'lucide-react';

interface OnlineMatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOnlineMatch: () => void;
  playerName: string;
  playerImage: string | null;
}

export const OnlineMatchmakingModal: React.FC<OnlineMatchmakingModalProps> = ({
  isOpen,
  onClose,
  onStartOnlineMatch,
  playerName,
  playerImage,
}) => {
  const [tab, setTab] = useState<'matchmaking' | 'custom_room' | 'leaderboard'>('matchmaking');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchTimer, setSearchTimer] = useState<number>(0);
  const [matchedOpponent, setMatchedOpponent] = useState<{ name: string; rank: string; avatar: string } | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [inputRoomCode, setInputRoomCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSearching) {
      timer = setInterval(() => {
        setSearchTimer((prev) => prev + 1);
      }, 1000);

      // Simulate finding opponent after 4 seconds
      const matchTimeout = setTimeout(() => {
        setMatchedOpponent({
          name: 'ProCarromKing_99',
          rank: 'Gold III (1,450 MMR)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        });
        setTimeout(() => {
          setIsSearching(false);
          setSearchTimer(0);
          onStartOnlineMatch();
          onClose();
        }, 2000);
      }, 4000);

      return () => {
        clearInterval(timer);
        clearTimeout(matchTimeout);
      };
    } else {
      setSearchTimer(0);
      setMatchedOpponent(null);
    }
  }, [isSearching, onStartOnlineMatch, onClose]);

  const handleCreateRoom = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsSearching(false);
            onClose();
          }}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-indigo-300 tracking-tight flex items-center gap-2">
              <span>ONLINE MULTIPLAYER</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-slate-400">Matchmaking & Global PvP Rooms</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-5 text-xs font-bold gap-2">
          <button
            onClick={() => setTab('matchmaking')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'matchmaking'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Quick Match</span>
          </button>
          <button
            onClick={() => setTab('custom_room')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'custom_room'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Private Room</span>
          </button>
          <button
            onClick={() => setTab('leaderboard')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'leaderboard'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Tab Content 1: Quick Matchmaking */}
        {tab === 'matchmaking' && (
          <div className="flex flex-col items-center text-center py-2">
            {!isSearching ? (
              <div className="w-full space-y-4">
                {/* Server Ping / Info Banner */}
                <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Server: <strong className="text-white">Asia-East (Auto)</strong></span>
                  </div>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    24ms
                  </span>
                </div>

                {/* Player Profile Preview vs Online Opponent Slot */}
                <div className="flex items-center justify-around py-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full border-2 border-indigo-400 bg-slate-900 overflow-hidden flex items-center justify-center">
                      {playerImage ? (
                        <img src={playerImage} alt={playerName} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-7 h-7 text-indigo-300" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-200 max-w-[100px] truncate">{playerName}</span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded font-black">
                      1,200 MMR
                    </span>
                  </div>

                  <div className="text-slate-500 font-black text-xl italic">VS</div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center">
                      <Users className="w-7 h-7 text-slate-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Random Player</span>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded font-bold">
                      Searching...
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSearching(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-950/50 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>FIND MATCH NOW</span>
                </button>
              </div>
            ) : (
              /* Searching Animation & Opponent Match Screen */
              <div className="py-8 flex flex-col items-center w-full">
                {!matchedOpponent ? (
                  <>
                    <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" />
                      <Globe className="w-10 h-10 text-indigo-400" />
                    </div>

                    <h3 className="text-lg font-black text-indigo-300 mb-1">SEARCHING FOR OPPONENT...</h3>
                    <p className="text-xs text-slate-400 mb-4">Finding players with similar MMR rating ({searchTimer}s)</p>

                    <button
                      onClick={() => setIsSearching(false)}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel Search
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl w-full mb-4 flex items-center justify-center gap-3">
                      <Shield className="w-6 h-6 text-emerald-400" />
                      <span className="text-sm font-black text-emerald-300">MATCH FOUND! STARTING GAME...</span>
                    </div>

                    <div className="flex items-center justify-around w-full py-4 bg-slate-950 rounded-2xl border border-indigo-500/40">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full border-2 border-indigo-400 bg-slate-900 overflow-hidden">
                          {playerImage ? (
                            <img src={playerImage} alt={playerName} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-7 h-7 text-indigo-300 m-auto" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-200">{playerName}</span>
                      </div>

                      <div className="text-indigo-400 font-black text-2xl animate-bounce">VS</div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full border-2 border-amber-400 bg-slate-900 overflow-hidden">
                          <img src={matchedOpponent.avatar} alt={matchedOpponent.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-amber-300">{matchedOpponent.name}</span>
                        <span className="text-[10px] text-amber-400 font-extrabold">{matchedOpponent.rank}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Custom Room */}
        {tab === 'custom_room' && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">Create Private Room</h3>
              {roomCode ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-900 border border-indigo-500/50 rounded-lg p-2.5 text-center font-mono font-black text-lg tracking-widest text-indigo-300">
                    {roomCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Generate Room Code
                </button>
              )}
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">Join Friend's Room</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Code"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
                <button
                  disabled={inputRoomCode.length < 6}
                  onClick={() => {
                    onStartOnlineMatch();
                    onClose();
                  }}
                  className={`px-4 py-2.5 font-bold rounded-lg text-xs ${
                    inputRoomCode.length === 6
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Leaderboard */}
        {tab === 'leaderboard' && (
          <div className="space-y-2 py-2 max-h-[250px] overflow-y-auto pr-1">
            {[
              { rank: 1, name: 'CarromMaster_X', mmr: '2,840', wins: 342 },
              { rank: 2, name: 'StrikerGod_99', mmr: '2,690', wins: 298 },
              { rank: 3, name: 'QueenHunter', mmr: '2,510', wins: 265 },
              { rank: 4, name: playerName || 'Player 1', mmr: '1,200', wins: 12, isUser: true },
            ].map((p) => (
              <div
                key={p.rank}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  p.isUser
                    ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black ${
                    p.rank === 1 ? 'bg-amber-400 text-slate-950' : p.rank === 2 ? 'bg-slate-300 text-slate-950' : p.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {p.rank}
                  </span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{p.wins} Wins</span>
                  <span className="text-indigo-400 font-extrabold">{p.mmr} MMR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
