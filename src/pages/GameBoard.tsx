import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api'; // eslint-disable-line @typescript-eslint/no-unused-vars

// Minimal game shape for grid-based mode (not used in demo flow)
interface Game {
  status: string;
  players: { player_id?: string; pubkey: string; x: number; y: number; alive: boolean }[];
  grid: number[];
  collapse_round?: number;
  winner?: string;
  prize_pool_usdc?: string;
  placements?: { player_id: string; place: number }[];
  payouts?: { player_id: string; amount_usdc: string }[];
}
import GameCanvas from '../components/GameCanvas';

export default function GameBoard() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  const playerId = account?.wallet_id ?? null;
  const publicKey = account?.public_key ?? null;

  const fetchGame = useCallback(async () => {
    if (!gameId) return;
    try {
      const g = null as Game | null; void gameId; // TODO: getGame removed from API
      setGame(g);
      if (g.status === 'resolved') {
        clearInterval(pollingRef.current);
      }
    } catch {
      // Transient errors during polling
    }
  }, [gameId]);

  useEffect(() => {
    fetchGame();
    pollingRef.current = setInterval(fetchGame, 1000);
    return () => clearInterval(pollingRef.current);
  }, [fetchGame]);

  const myPlayer = game?.players.find(
    (p) => p.player_id === playerId || p.pubkey === publicKey,
  );
  const isAlive = myPlayer?.alive ?? false;
  const isResolved = game?.status === 'resolved';

  useEffect(() => {
    if (isResolved && game) {
      const won = game.winner === playerId;
      const pool = parseFloat(game.prize_pool_usdc || '0');

      let place = 0;
      let payout = '0.00';
      if (game.placements?.length) {
        const myPlacement = game.placements.find(p => p.player_id === playerId);
        place = myPlacement?.place ?? 0;
      } else {
        place = won ? 1 : 0;
      }

      if (game.payouts?.length) {
        const myPayout = game.payouts.find(p => p.player_id === playerId);
        payout = myPayout?.amount_usdc ?? '0.00';
      } else {
        payout = place === 1 ? (pool * 0.7).toFixed(2)
               : place === 2 ? (pool * 0.3).toFixed(2)
               : '0.00';
      }

      const params = new URLSearchParams({
        won: String(place <= 2),
        prize: game.prize_pool_usdc || '0',
        place: String(place),
        payout,
      });
      navigate(`/game/${gameId}/over?${params}`, { replace: true });
    }
  }, [isResolved, game, playerId, gameId, navigate]);

  const handleMove = useCallback(
    async (direction: 'up' | 'down' | 'left' | 'right') => {
      if (!gameId || !playerId || moving || !isAlive || isResolved) return;

      setMoving(true);
      setMoveError(null);

      try {
        // TODO: move endpoint removed from API — game is now client-side
        const result = null as any; void gameId; void playerId; void direction;
        setGame((prev) =>
          prev
            ? {
                ...prev,
                grid: result.grid_snapshot,
                status: result.status as Game['status'],
                collapse_round: result.collapse_round ?? prev.collapse_round,
                winner: result.winner,
                players: prev.players.map((p) =>
                  (p.player_id === playerId || p.pubkey === publicKey)
                    ? { ...p, x: result.new_x, y: result.new_y, alive: result.alive }
                    : p,
                ),
              }
            : prev,
        );
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        const msgs: Record<string, string> = {
          PLAYER_ELIMINATED: "You've been eliminated!",
          TILE_IS_LAVA: "Can't move there — that tile collapsed!",
          OUT_OF_BOUNDS: "Can't move off the grid!",
          GAME_NOT_ACTIVE: 'Game is not active yet.',
          MISSING_IDEMPOTENCY_KEY: 'Request error — please try again.',
          REQUEST_IN_FLIGHT: 'Move still processing — hold on.',
        };
        setMoveError(msgs[e.code || ''] || e.message || 'Move failed');
        setTimeout(() => setMoveError(null), 2000);
      } finally {
        setMoving(false);
      }
    },
    [gameId, playerId, moving, isAlive, isResolved, publicKey],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 30) return;
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
      touchStart.current = null;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMove]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-ice-500">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading game...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate('/lobby')}
          className="px-6 py-3 bg-penguin-orange text-white rounded-xl font-bold cursor-pointer"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  const alivePlayers = game.players.filter((p) => p.alive).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-ice-100 to-sky">
      {/* Top HUD */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-ice-200/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-muted">Round</p>
            <p className="text-lg font-bold text-slate-heading">{game.collapse_round ?? 0}</p>
          </div>
          <div className="w-px h-8 bg-ice-200" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-muted">Alive</p>
            <p className="text-lg font-bold text-green-600">{alivePlayers}/{game.players.length}</p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-muted">
            Pool {game.status === 'active' ? '🔒' : ''}
          </p>
          <p className="text-lg font-bold text-penguin-orange">
            ${game.prize_pool_usdc || '0.00'}
          </p>
          {game.status === 'active' && (
            <p className="text-[9px] text-green-600 font-medium">Locked in escrow</p>
          )}
        </div>
      </header>

      {/* Game canvas */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <GameCanvas game={game} currentPubkey={publicKey} />

        {moveError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg animate-bounce">
            {moveError}
          </div>
        )}

        {!isAlive && !isResolved && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <p className="text-4xl mb-2">💀</p>
              <p className="text-2xl font-bold text-red-500">Eliminated!</p>
              <p className="text-slate-muted mt-2">Your penguin fell into the water</p>
              <p className="text-slate-muted/60 text-sm mt-4">Watching the remaining players...</p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile D-pad */}
      <div className="md:hidden p-4 pb-8">
        <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
          <div />
          <DpadButton dir="up" onMove={handleMove} disabled={!isAlive || moving} />
          <div />
          <DpadButton dir="left" onMove={handleMove} disabled={!isAlive || moving} />
          <div className="w-14 h-14 rounded-xl bg-ice-100 border border-ice-200" />
          <DpadButton dir="right" onMove={handleMove} disabled={!isAlive || moving} />
          <div />
          <DpadButton dir="down" onMove={handleMove} disabled={!isAlive || moving} />
          <div />
        </div>
      </div>

      {/* Desktop hint */}
      <div className="hidden md:block text-center py-3 text-slate-muted text-xs">
        Use arrow keys or WASD to move
      </div>
    </div>
  );
}

function DpadButton({
  dir,
  onMove,
  disabled,
}: {
  dir: 'up' | 'down' | 'left' | 'right';
  onMove: (d: 'up' | 'down' | 'left' | 'right') => void;
  disabled: boolean;
}) {
  const arrows: Record<string, string> = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };

  return (
    <button
      onClick={() => onMove(dir)}
      disabled={disabled}
      className="w-14 h-14 rounded-xl bg-white border border-ice-300 text-ice-700
                 font-bold text-xl flex items-center justify-center shadow-sm
                 active:bg-ice-100 active:scale-95 disabled:opacity-30
                 transition-all cursor-pointer"
    >
      {arrows[dir]}
    </button>
  );
}
