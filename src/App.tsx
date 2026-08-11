import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, Piece, TurnPlayer, Vec2 } from './types';
import { CarromBoardCanvas } from './components/CarromBoardCanvas';
import { StrikerControlBar } from './components/StrikerControlBar';
import { HUD } from './components/HUD';
import { Dashboard } from './components/Dashboard';
import { ModeSelectModal } from './components/ModeSelectModal';
import { RulesModal } from './components/RulesModal';
import { WinnerPopupModal } from './components/WinnerPopupModal';
import { ProfileModal } from './components/ProfileModal';
import {
  BASELINE_LEFT,
  BASELINE_RIGHT,
  P1_STRIKER_Y,
  P2_STRIKER_Y,
  POCKETS,
  PUZZLE_LEVELS,
  createPiece,
  getClassicBoardCoins
} from './utils/carromBoardSetup';
import { updatePhysicsFrame } from './utils/carromPhysics';
import { calculateAIShot } from './utils/carromAI';
import { audio } from './utils/audio';
import { initAdMob, showInterstitialAd } from './utils/admob';
import { AdBanner } from './components/AdBanner';
import { RotateCcw, Trophy, Sparkles, Frown, ArrowRight, List } from 'lucide-react';

// Helper to find a non-overlapping spot near board center (400, 400) for refunded coins
function findNonOverlappingCenterPos(existingPieces: Piece[], targetRadius: number): Vec2 {
  const activePieces = existingPieces.filter((p) => !p.isPocketed);
  const center = new Vec2(400, 400);

  const isFree = (pos: Vec2) => {
    return activePieces.every((p) => p.pos.dist(pos) >= p.radius + targetRadius + 2);
  };

  if (isFree(center)) return center;

  // Expanding concentric rings around center
  for (let ring = 1; ring <= 15; ring++) {
    const dist = ring * (targetRadius * 2 + 4);
    const count = ring * 6;
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const candidate = new Vec2(400 + Math.cos(angle) * dist, 400 + Math.sin(angle) * dist);
      if (isFree(candidate)) {
        return candidate;
      }
    }
  }

  return center;
}

// Helper to return coins to board at non-overlapping positions
function returnCoinsToBoard(currentPieces: Piece[], coinsToReturn: Piece[]): Piece[] {
  if (coinsToReturn.length === 0) return currentPieces;

  const updatedList = currentPieces.map((p) => ({
    ...p,
    pos: new Vec2(p.pos.x, p.pos.y),
    vel: new Vec2(p.vel.x, p.vel.y)
  }));

  coinsToReturn.forEach((c) => {
    if (!c) return;
    let target = updatedList.find((p) => p.id === c.id || (p.type === c.type && p.type === 'red'));
    if (!target) {
      target = {
        ...c,
        id: c.id || `coin_${c.type}_${Date.now()}`,
        pos: new Vec2(c.pos.x, c.pos.y),
        vel: new Vec2(0, 0),
        isPocketed: false
      };
      updatedList.push(target);
    }
    target.isPocketed = false;
    target.vel = new Vec2(0, 0);
    target.pos = findNonOverlappingCenterPos(
      updatedList.filter((p) => p.id !== target!.id),
      target.radius
    );
  });

  return updatedList;
}

export default function App() {
  // Navigation & View State ('dashboard' or 'game')
  const [viewState, setViewState] = useState<'dashboard' | 'game'>('dashboard');

  // Initialize AdMob SDK on startup
  useEffect(() => {
    initAdMob();
  }, []);

  // Prevent Android WebView native pull-to-refresh gesture reload during touch interaction
  useEffect(() => {
    const handleGlobalTouch = (e: TouchEvent) => {
      if (e.cancelable) {
        const target = e.target as HTMLElement | null;
        const isInteractiveInput = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.closest('input')
        );
        if (!isInteractiveInput) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', handleGlobalTouch, { passive: false });
    document.addEventListener('touchmove', handleGlobalTouch, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouch);
      document.removeEventListener('touchmove', handleGlobalTouch);
    };
  }, []);

  // Game Setup & Mode State
  const [mode, setMode] = useState<GameMode>('classic');
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState<number>(0);
  const [unlockedPuzzleLevel, setUnlockedPuzzleLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('carrom_unlocked_puzzle');
      return saved ? Math.max(1, parseInt(saved, 10) || 1) : 1;
    } catch {
      return 1;
    }
  });
  const [puzzleShotsTaken, setPuzzleShotsTaken] = useState<number>(0);

  // Scores & Players State
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [turn, setTurn] = useState<TurnPlayer>('player1');

  // Queen Status State
  const [queenOwner, setQueenOwner] = useState<'none' | 'player1' | 'player2'>('none');
  const [queenCoverNeeded, setQueenCoverNeeded] = useState<boolean>(false);
  const [queenPendingPlayer, setQueenPendingPlayer] = useState<TurnPlayer | null>(null);

  // Physics & Animation State
  const [isPhysicsRunning, setIsPhysicsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals & Toast State
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('Drag Striker Backward to Aim & Shoot!');
  const [gameOverText, setGameOverText] = useState<string | null>(null);

  // Profile Image & Name State
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('carrom_profile_image');
    } catch {
      return null;
    }
  });
  const [profileName, setProfileName] = useState<string>(() => {
    try {
      return localStorage.getItem('carrom_profile_name') || 'Player 1';
    } catch {
      return 'Player 1';
    }
  });

  const handleUpdateProfileImage = (img: string | null) => {
    setProfileImage(img);
    try {
      if (img) {
        localStorage.setItem('carrom_profile_image', img);
      } else {
        localStorage.removeItem('carrom_profile_image');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfileName = (name: string) => {
    setProfileName(name);
    try {
      localStorage.setItem('carrom_profile_name', name);
    } catch (e) {
      console.error(e);
    }
  };

  // Board Pieces State
  const [pieces, setPieces] = useState<Piece[]>([]);
  const piecesRef = useRef<Piece[]>(pieces);
  piecesRef.current = pieces;

  const strikerRef = useRef<Piece>(createPiece(400, P1_STRIKER_Y, 'striker', 'striker_main'));
  const [strikerX, setStrikerX] = useState<number>(400);

  // Track coins pocketed in the current shot
  const shotPocketedRef = useRef<Piece[]>([]);
  const puzzleShotsTakenRef = useRef<number>(0);
  const physicsAnimFrameRef = useRef<number | null>(null);

  // Show Toast Message
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 2800);
  }, []);

  // Initialize Board State for Selected Game Mode
  const initBoard = useCallback((selectedMode: GameMode, puzzleIdx = 0) => {
    if (physicsAnimFrameRef.current !== null) {
      cancelAnimationFrame(physicsAnimFrameRef.current);
      physicsAnimFrameRef.current = null;
    }

    let initialCoins: Piece[] = [];

    if (selectedMode === 'puzzle') {
      const pLevel = PUZZLE_LEVELS[puzzleIdx] || PUZZLE_LEVELS[0];
      initialCoins = pLevel.setupCoins.map((sc, idx) =>
        createPiece(sc.x, sc.y, sc.type, `puzzle_coin_${idx}`)
      );
    } else {
      // Official 19-coin symmetrical center board arrangement
      initialCoins = getClassicBoardCoins();
    }

    shotPocketedRef.current = [];
    piecesRef.current = initialCoins;
    setPieces(initialCoins);
    setP1Score(0);
    setP2Score(0);
    setTurn('player1');
    setQueenOwner('none');
    setQueenCoverNeeded(false);
    setQueenPendingPlayer(null);
    setStrikerX(400);
    setIsPhysicsRunning(false);
    puzzleShotsTakenRef.current = 0;
    setPuzzleShotsTaken(0);
    setGameOverText(null);

    strikerRef.current.pos.set(400, P1_STRIKER_Y);
    strikerRef.current.vel.set(0, 0);
    strikerRef.current.isPocketed = false;

    showToast(
      selectedMode === 'classic'
        ? 'Classic Carrom Match Started!'
        : selectedMode === 'vs_cpu'
        ? 'vs Computer AI Match Started!'
        : selectedMode === 'puzzle'
        ? `${PUZZLE_LEVELS[puzzleIdx].title}`
        : selectedMode === 'online'
        ? 'Online PvP Match Connected!'
        : 'Free Practice Mode'
    );
  }, [showToast]);

  // Initial Load Setup
  useEffect(() => {
    initBoard('classic');
  }, [initBoard]);

  // Evaluate Turn Results after Physics Motion Stops
  const evaluateTurnResult = useCallback(() => {
    const pocketed = shotPocketedRef.current;
    const isStrikerFoul = pocketed.some((p) => p.type === 'striker');
    const pocketedQueen = pocketed.find((p) => p.type === 'red');
    const pocketedWhite = pocketed.filter((p) => p.type === 'white');
    const pocketedBlack = pocketed.filter((p) => p.type === 'black');

    let p1PointsGained = 0;
    let p2PointsGained = 0;
    let extraTurnGranted = false;

    // Track score and queen changes locally in this callback frame to prevent stale closure reads
    let updatedP1Score = p1Score;
    let updatedP2Score = p2Score;
    let currentQueenOwner = queenOwner;

    // --- PUZZLE MODE RULE VALIDATION ---
    if (mode === 'puzzle') {
      const pLevel = PUZZLE_LEVELS[currentPuzzleIndex] || PUZZLE_LEVELS[0];

      // 1. Handle Striker Foul Penalty
      if (isStrikerFoul) {
        audio.playFoulSound();
        showToast('FOUL! Striker Pocketed (-5 Pts)');
        updatedP1Score = Math.max(0, updatedP1Score - 5);
        setP1Score(updatedP1Score);

        // Return any coins pocketed during striker foul back to board
        const pocketedCoinsThisShot = pocketed.filter((p) => p.type !== 'striker');
        if (pocketedCoinsThisShot.length > 0) {
          setPieces((prev) => returnCoinsToBoard(prev, pocketedCoinsThisShot));
        }

        strikerRef.current.isPocketed = false;
        strikerRef.current.vel.set(0, 0);

        const activePieces = piecesRef.current.filter((p) => !p.isPocketed && p.type !== 'striker');
        const maxRemainingScore = activePieces.reduce(
          (sum, p) => sum + (p.type === 'white' ? 10 : p.type === 'red' ? 30 : p.type === 'black' ? 5 : 0),
          0
        );
        const isOutofShots = puzzleShotsTakenRef.current >= pLevel.allowedShots;
        const isGoalImpossible = updatedP1Score + maxRemainingScore < pLevel.targetScore;

        if (isOutofShots || isGoalImpossible) {
          audio.playFoulSound();
          setGameOverText('TRY AGAIN ❌');
          return;
        }

        setStrikerX(400);
        strikerRef.current.pos.set(400, P1_STRIKER_Y);
        return;
      }

      // 2. Score Pocketed Coins for Player 1
      let ptsGainedThisShot = 0;
      if (pocketedQueen) ptsGainedThisShot += 30;
      if (pocketedWhite.length > 0) ptsGainedThisShot += pocketedWhite.length * 10;
      if (pocketedBlack.length > 0) ptsGainedThisShot += pocketedBlack.length * 5;

      if (ptsGainedThisShot > 0) {
        updatedP1Score += ptsGainedThisShot;
        showToast(`Score: +${ptsGainedThisShot} Pts!`);
        audio.playPocketSound();
      }

      setP1Score(updatedP1Score);

      let remainingCoinsOnBoard = pieces;
      if (pocketed.length > 0) {
        remainingCoinsOnBoard = pieces.filter((p) => !pocketed.some((pk) => pk.id === p.id));
        setPieces(remainingCoinsOnBoard);
      }

      // 3. Evaluate Puzzle Completion or Failure
      const isGoalMet = updatedP1Score >= pLevel.targetScore;

      if (isGoalMet) {
        audio.playVictorySound();
        const nextLevelId = pLevel.id + 1;
        if (pLevel.id >= 20) {
          setGameOverText('PUZZLE MASTER COMPLETED! ALL 20 LEVELS CLEARED! 🏆');
        } else {
          setGameOverText(`LEVEL ${pLevel.id} CLEARED! 🎯`);
          setUnlockedPuzzleLevel((prev) => {
            const newUnlocked = Math.max(prev, nextLevelId);
            try {
              localStorage.setItem('carrom_unlocked_puzzle', newUnlocked.toString());
            } catch {}
            return newUnlocked;
          });
        }
        return;
      }

      const activeCoins = remainingCoinsOnBoard.filter((p) => !p.isPocketed && p.type !== 'striker');
      const maxRemainingScore = activeCoins.reduce(
        (sum, p) => sum + (p.type === 'white' ? 10 : p.type === 'red' ? 30 : p.type === 'black' ? 5 : 0),
        0
      );
      const isOutofShots = puzzleShotsTakenRef.current >= pLevel.allowedShots;
      const isGoalImpossible = updatedP1Score + maxRemainingScore < pLevel.targetScore;

      if (isOutofShots || isGoalImpossible) {
        audio.playFoulSound();
        setGameOverText('TRY AGAIN ❌');
        return;
      }

      setStrikerX(400);
      strikerRef.current.pos.set(400, P1_STRIKER_Y);
      return;
    }

    // --- CLASSIC / VS_CPU / PRACTICE MODE RULE VALIDATION ---
    // Always reset Striker state at end of shot evaluation so it never vanishes
    strikerRef.current.isPocketed = false;
    strikerRef.current.vel.set(0, 0);

    const ownCoinType = turn === 'player1' ? 'white' : 'black';
    const oppCoinType = turn === 'player1' ? 'black' : 'white';

    // 1. Handle Striker Foul Penalty
    if (isStrikerFoul) {
      audio.playFoulSound();
      showToast('FOUL! Striker Pocketed (-5 Pts)');
      if (turn === 'player1') {
        updatedP1Score = Math.max(0, updatedP1Score - 5);
        setP1Score(updatedP1Score);
      } else {
        updatedP2Score = Math.max(0, updatedP2Score - 5);
        setP2Score(updatedP2Score);
      }

      // Return any coins pocketed during striker foul back to board
      const pocketedCoinsThisShot = pocketed.filter((p) => p.type !== 'striker');
      if (pocketedCoinsThisShot.length > 0) {
        setPieces((prev) => returnCoinsToBoard(prev, pocketedCoinsThisShot));
      }

      // If Queen cover was pending for this player, cover failed -> return Queen to board
      if (queenCoverNeeded && queenPendingPlayer === turn) {
        setQueenCoverNeeded(false);
        setQueenPendingPlayer(null);
        const queenPiece = pieces.find((p) => p.type === 'red');
        if (queenPiece && queenPiece.isPocketed) {
          setPieces((prev) => returnCoinsToBoard(prev, [queenPiece]));
        }
      }

      extraTurnGranted = false;
    } else {
      // 2. Process Pocketed Coins when NO Striker Foul
      const coinsPocketedOnly = pocketed.filter((p) => p.type !== 'striker');

      if (coinsPocketedOnly.length > 0) {
        // Mark pocketed coins as pocketed in board pieces state
        setPieces((prev) =>
          prev.map((p) => {
            if (coinsPocketedOnly.some((pk) => pk.id === p.id)) {
              return { ...p, isPocketed: true, vel: new Vec2(0, 0) };
            }
            return p;
          })
        );

        const ownCoinsPocketed = coinsPocketedOnly.filter(
          (p) => mode === 'practice' || p.type === ownCoinType
        );
        const oppCoinsPocketed = coinsPocketedOnly.filter(
          (p) => mode !== 'practice' && p.type === oppCoinType
        );

        // Queen rules handling
        if (pocketedQueen) {
          if (queenOwner === 'none') {
            if (ownCoinsPocketed.length > 0) {
              // Covered Queen on the SAME SHOT!
              audio.playVictorySound();
              showToast('Queen Covered! (+30 Pts)');
              setQueenOwner(turn);
              currentQueenOwner = turn;
              setQueenCoverNeeded(false);
              setQueenPendingPlayer(null);
              if (turn === 'player1' || mode === 'practice') {
                updatedP1Score += 30;
              } else {
                updatedP2Score += 30;
              }
              extraTurnGranted = true;
            } else {
              // Pocketed Queen alone -> Cover required on next shot!
              audio.playPocketSound();
              showToast('Queen Pocketed! Cover required on next shot!');
              setQueenCoverNeeded(true);
              setQueenPendingPlayer(turn);
              extraTurnGranted = true;
            }
          }
        } else if (queenCoverNeeded && queenPendingPlayer === turn) {
          // Player was attempting to cover Queen from previous shot
          if (ownCoinsPocketed.length > 0) {
            // Successfully covered Queen on this shot!
            audio.playVictorySound();
            showToast('Queen Covered! (+30 Pts)');
            setQueenOwner(turn);
            currentQueenOwner = turn;
            setQueenCoverNeeded(false);
            setQueenPendingPlayer(null);
            if (turn === 'player1' || mode === 'practice') {
              updatedP1Score += 30;
            } else {
              updatedP2Score += 30;
            }
            extraTurnGranted = true;
          } else {
            // Failed to cover Queen -> return Queen to board!
            audio.playFoulSound();
            showToast('Queen Cover Failed! Red Queen returned to board.');
            setQueenCoverNeeded(false);
            setQueenPendingPlayer(null);
            const queenPiece = pieces.find((p) => p.type === 'red');
            if (queenPiece) {
              setPieces((prev) => returnCoinsToBoard(prev, [queenPiece]));
            }
          }
        }

        // Score own coins
        if (ownCoinsPocketed.length > 0) {
          audio.playPocketSound();
          extraTurnGranted = true;
          let ownPts = 0;
          ownCoinsPocketed.forEach((c) => {
            if (c.type === 'white') ownPts += 10;
            else if (c.type === 'black') ownPts += 5;
            else if (c.type === 'red' && queenOwner === turn) ownPts += 30;
          });

          if (turn === 'player1' || mode === 'practice') {
            updatedP1Score += ownPts;
            showToast(`Player 1: +${ownPts} Pts!`);
          } else {
            updatedP2Score += ownPts;
            showToast(`Player 2: +${ownPts} Pts!`);
          }
        }

        // Score opponent coins (opponent receives points for their coins pocketed)
        if (oppCoinsPocketed.length > 0) {
          let oppPts = 0;
          oppCoinsPocketed.forEach((c) => {
            if (c.type === 'white') oppPts += 10;
            else if (c.type === 'black') oppPts += 5;
          });

          if (turn === 'player1') {
            updatedP2Score += oppPts;
            showToast(`Opponent Coin Pocketed! P2 +${oppPts} Pts`);
          } else {
            updatedP1Score += oppPts;
            showToast(`Opponent Coin Pocketed! P1 +${oppPts} Pts`);
          }
        }
      } else {
        // No coins pocketed on this shot
        if (queenCoverNeeded && queenPendingPlayer === turn) {
          // Failed to cover Queen
          audio.playFoulSound();
          showToast('Queen Cover Failed! Red Queen returned to board.');
          setQueenCoverNeeded(false);
          setQueenPendingPlayer(null);
          const queenPiece = pieces.find((p) => p.type === 'red');
          if (queenPiece) {
            setPieces((prev) => returnCoinsToBoard(prev, [queenPiece]));
          }
        }
      }
    }

    setP1Score(updatedP1Score);
    setP2Score(updatedP2Score);

    const activePieces = pieces.filter((p) => !p.isPocketed && !pocketed.some((pk) => pk.id === p.id));
    const unpocketedWhite = activePieces.filter((p) => p.type === 'white');
    const unpocketedBlack = activePieces.filter((p) => p.type === 'black');
    const remainingNormalCoins = activePieces.filter((p) => p.type !== 'striker' && p.type !== 'red');
    const boardHasQueen = activePieces.some((p) => p.type === 'red');

    const isPlayer1Finished = unpocketedWhite.length === 0;
    const isPlayer2Finished = unpocketedBlack.length === 0;
    const isBoardCleared = remainingNormalCoins.length === 0;

    if (isPlayer1Finished || isPlayer2Finished || isBoardCleared) {
      if (boardHasQueen && currentQueenOwner === 'none') {
        // FOUL! Pocketed last normal coin without legally covering the Red Queen!
        audio.playFoulSound();
        showToast('FOUL! Cannot pocket last coin before Queen is covered! (-5 Pts)');
        if (turn === 'player1') {
          updatedP1Score = Math.max(0, updatedP1Score - 5);
          setP1Score(updatedP1Score);
        } else {
          updatedP2Score = Math.max(0, updatedP2Score - 5);
          setP2Score(updatedP2Score);
        }

        // Return the last pocketed normal coin back to the board center
        const normalCoinsToReturn = pocketed.filter((p) => p.type === 'white' || p.type === 'black');
        if (normalCoinsToReturn.length > 0) {
          setPieces((prev) => returnCoinsToBoard(prev, normalCoinsToReturn));
        }
        extraTurnGranted = false;
      } else {
        // Valid match completion!
        if (mode === 'vs_cpu') {
          if (updatedP1Score >= updatedP2Score) {
            audio.playVictorySound();
            setGameOverText('YOU WON');
          } else {
            audio.playFoulSound();
            setGameOverText('YOU LOST');
          }
        } else {
          audio.playVictorySound();
          const winnerText = updatedP1Score >= updatedP2Score ? 'PLAYER 1 WINS THE MATCH! 🏆' : 'PLAYER 2 WINS! 🏆';
          setGameOverText(winnerText);
        }
        return;
      }
    }

    // 5. Turn Switch Logic
    if (!extraTurnGranted && mode !== 'practice') {
      const nextTurn = turn === 'player1' ? 'player2' : 'player1';
      setTurn(nextTurn);
      const activeBaselineY = nextTurn === 'player1' ? P1_STRIKER_Y : P2_STRIKER_Y;
      setStrikerX(400);
      strikerRef.current.pos.set(400, activeBaselineY);
    } else {
      // Extra Turn: keep striker on current player's baseline
      const activeBaselineY = turn === 'player1' ? P1_STRIKER_Y : P2_STRIKER_Y;
      setStrikerX(400);
      strikerRef.current.pos.set(400, activeBaselineY);
    }
  }, [turn, queenOwner, queenCoverNeeded, queenPendingPlayer, mode, p1Score, p2Score, pieces, currentPuzzleIndex, puzzleShotsTaken, showToast]);

  // Main Physics Simulation Loop
  const runPhysicsLoop = useCallback(() => {
    setIsPhysicsRunning(true);
    shotPocketedRef.current = [];

    const allPieces = [...piecesRef.current, strikerRef.current];

    const step = () => {
      const result = updatePhysicsFrame(allPieces, POCKETS);

      if (result.pocketedThisStep.length > 0) {
        result.pocketedThisStep.forEach((p) => {
          if (!shotPocketedRef.current.some((existing) => existing.id === p.id)) {
            shotPocketedRef.current.push(p);
          }
        });
      }

      if (result.isMoving) {
        physicsAnimFrameRef.current = requestAnimationFrame(step);
      } else {
        physicsAnimFrameRef.current = null;
        setIsPhysicsRunning(false);
        evaluateTurnResult();
      }
    };

    physicsAnimFrameRef.current = requestAnimationFrame(step);
  }, [evaluateTurnResult]);

  // Handle Human Player Shot Execution
  const handleTakeShot = (shotVel: Vec2) => {
    if (isPhysicsRunning || !!gameOverText) return;
    if (mode === 'puzzle') {
      puzzleShotsTakenRef.current += 1;
      setPuzzleShotsTaken(puzzleShotsTakenRef.current);
    }
    strikerRef.current.vel = shotVel;
    runPhysicsLoop();
  };

  // AI Turn Trigger
  useEffect(() => {
    if (mode === 'vs_cpu' && turn === 'player2' && !isPhysicsRunning && !gameOverText) {
      showToast('Computer is thinking...');
      let shotTimer: NodeJS.Timeout;

      const aiTimer = setTimeout(() => {
        if (gameOverText) return;
        const currentPieces = piecesRef.current;
        const plan = calculateAIShot(currentPieces, POCKETS, 'black');
        setStrikerX(plan.strikerX);
        strikerRef.current.pos.set(plan.strikerX, P2_STRIKER_Y);

        shotTimer = setTimeout(() => {
          if (gameOverText) return;
          strikerRef.current.vel = plan.shotVel;
          audio.playStrikerHit(plan.power);
          runPhysicsLoop();
        }, 600);
      }, 800);

      return () => {
        clearTimeout(aiTimer);
        clearTimeout(shotTimer);
      };
    }
  }, [mode, turn, isPhysicsRunning, !!gameOverText]);

  // Handle Mode Change
  const handleSelectMode = (selectedMode: GameMode, puzzleLevelId?: number) => {
    setMode(selectedMode);
    if (puzzleLevelId !== undefined) {
      setCurrentPuzzleIndex(puzzleLevelId - 1);
      initBoard(selectedMode, puzzleLevelId - 1);
    } else {
      initBoard(selectedMode);
    }
    setViewState('game');
  };

  // Return to Dashboard safely stopping current physics/AI state
  const handleBackToDashboard = useCallback(() => {
    if (physicsAnimFrameRef.current !== null) {
      cancelAnimationFrame(physicsAnimFrameRef.current);
      physicsAnimFrameRef.current = null;
    }
    setIsPhysicsRunning(false);
    setGameOverText(null);
    setViewState('dashboard');
    showInterstitialAd();
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {viewState === 'dashboard' ? (
        <div className="w-full h-full overflow-y-auto py-2">
          <Dashboard
            profileImage={profileImage}
            profileName={profileName}
            isMuted={isMuted}
            unlockedPuzzleLevel={unlockedPuzzleLevel}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onToggleMute={() => {
              setIsMuted(!isMuted);
              audio.isMuted = !isMuted;
            }}
            onSelectMode={handleSelectMode}
            onOpenPuzzleSelector={() => setIsModeModalOpen(true)}
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-between py-2 px-3 overflow-hidden">
          {/* Top HUD Header */}
          <HUD
            p1Score={p1Score}
            p2Score={p2Score}
            p1Name={profileName}
            p2Name={mode === 'vs_cpu' ? 'CPU' : 'Player 2'}
            turn={turn}
            mode={mode}
            queenOwner={queenOwner}
            queenCoverNeeded={queenCoverNeeded}
            isMuted={isMuted}
            profileImage={profileImage}
            puzzleLevel={mode === 'puzzle' ? PUZZLE_LEVELS[currentPuzzleIndex] : undefined}
            puzzleShotsLeft={
              mode === 'puzzle'
                ? Math.max(0, (PUZZLE_LEVELS[currentPuzzleIndex]?.allowedShots || 0) - puzzleShotsTaken)
                : undefined
            }
            onToggleMute={() => {
              setIsMuted(!isMuted);
              audio.isMuted = !isMuted;
            }}
            onOpenModeSelect={() => setIsModeModalOpen(true)}
            onOpenRules={() => setIsRulesModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onBackToDashboard={handleBackToDashboard}
          />

          {/* Main Game Board Container */}
          <div className="relative flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-1">
            {/* Top Striker Placement Control Bar for Player 2 in 2-Player Mode */}
            {mode === 'classic' && (
              <div className="w-full max-w-md px-2 -mb-1 z-20">
                <StrikerControlBar
                  value={strikerX}
                  onChange={(x) => setStrikerX(x)}
                  disabled={isPhysicsRunning || turn !== 'player2' || !!gameOverText}
                />
              </div>
            )}

            <div className="relative w-full flex items-center justify-center">
              <CarromBoardCanvas
                pieces={pieces}
                striker={strikerRef.current}
                turn={turn}
                isPhysicsRunning={isPhysicsRunning}
                isAiTurn={mode === 'vs_cpu' && turn === 'player2'}
                strikerBaselineX={strikerX}
                disabled={!!gameOverText}
                onStrikerXChange={(x) => setStrikerX(x)}
                onTakeShot={handleTakeShot}
              />

              {/* Floating Toast Notice */}
              {toastMsg && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-900/90 border border-amber-500/60 rounded-full text-xs font-bold text-amber-300 shadow-xl pointer-events-none animate-pulse">
                  {toastMsg}
                </div>
              )}
            </div>

            {/* Bottom Striker Placement Control Bar for Player 1 */}
            <div className="w-full max-w-md px-2 -mt-1 z-20">
              <StrikerControlBar
                value={strikerX}
                onChange={(x) => setStrikerX(x)}
                disabled={
                  isPhysicsRunning ||
                  (mode === 'classic' && turn !== 'player1') ||
                  (mode === 'vs_cpu' && turn === 'player2') ||
                  !!gameOverText
                }
              />
            </div>

            {/* Banner Ad during active gameplay across all modes */}
            <div className="w-full mt-1 flex justify-center shrink-0 z-20">
              <AdBanner />
            </div>
          </div>
        </div>
      )}

      {/* Mode Select Modal */}
      <ModeSelectModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        onSelectMode={handleSelectMode}
        activeMode={mode}
        unlockedPuzzleLevel={unlockedPuzzleLevel}
        currentPuzzleLevelId={currentPuzzleIndex + 1}
      />

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profileImage={profileImage}
        onUpdateProfileImage={handleUpdateProfileImage}
        profileName={profileName}
        onUpdateProfileName={handleUpdateProfileName}
      />

      {/* Game Over Result Popup */}
      <WinnerPopupModal
        gameOverText={gameOverText}
        mode={mode}
        p1Score={p1Score}
        p2Score={p2Score}
        currentPuzzleIndex={currentPuzzleIndex}
        onPlayAgain={() => {
          showInterstitialAd(() => initBoard(mode, currentPuzzleIndex));
        }}
        onNextLevel={() => {
          showInterstitialAd(() => handleSelectMode('puzzle', currentPuzzleIndex + 2));
        }}
        onOpenModeSelect={() => {
          showInterstitialAd(() => {
            setGameOverText(null);
            setViewState('dashboard');
          });
        }}
      />
    </div>
  );
}
