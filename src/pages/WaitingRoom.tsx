import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api'; // eslint-disable-line @typescript-eslint/no-unused-vars
import PenguinSvg, { PENGUIN_COLORS } from '../components/PenguinSvg';

export default function WaitingRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { account } = useAuth();
  const [game, setGame] = useState<{ players?: { player_id?: string; pubkey?: string }[]; max_players?: number; buy_in_usdc?: string; prize_pool_usdc?: string; escrow_address?: string; status?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const joinedRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  const gameId = searchParams.get('game_id');

  useEffect(() => {
    if (!gameId || !account) {
      setError('Missing game or account information. Please start from the lobby.');
      return;
    }

    let cancelled = false;

    const joinAndPoll = async () => {
      if (!joinedRef.current) {
        setJoining(true);
        try {
          // TODO: joinGame removed — use wallet transfer for entry fee
          void gameId; void account;
          joinedRef.current = true;
        } catch (err: unknown) {
          const e = err as { code?: string; message?: string };
          const knownCodes: Record<string, string> = {
            GAME_FULL: 'This game is already full.',
            GAME_NOT_JOINABLE: 'This game has already started.',
            INSUFFICIENT_FUNDS: 'Insufficient funds. Please deposit more money from your dashboard.',
            MISSING_IDEMPOTENCY_KEY: 'Request error — please try again.',
            REQUEST_IN_FLIGHT: 'Your join is still processing — please wait.',
          };
          const msg = knownCodes[e.code || ''];
          if (msg) {
            setError(msg);
            setJoining(false);
            return;
          }
        }
        setJoining(false);
      }

      const pollGame = async () => {
        if (cancelled) return;
        try {
          const g = null as typeof game; // TODO: getGame removed from API
          if (cancelled) return;
          setGame(g);
          if (g.status === 'active' || g.status === 'resolved') {
            clearInterval(pollingRef.current);
            navigate(`/game/${gameId}`, { replace: true });
          }
        } catch {
          // Transient errors during polling
        }
      };

      await pollGame();
      pollingRef.current = setInterval(pollGame, 2000);
    };

    joinAndPoll();

    return () => {
      cancelled = true;
      clearInterval(pollingRef.current);
    };
  }, [gameId, account, navigate]);

  if (error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            {error.includes('funds') && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-penguin-orange hover:bg-orange-600 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                Deposit Funds
              </button>
            )}
            <button
              onClick={() => navigate('/lobby')}
              className="px-6 py-3 bg-ice-100 hover:bg-ice-200 text-slate-heading rounded-xl font-bold transition-colors cursor-pointer"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  const playerCount = game?.players?.length ?? 0;
  const maxPlayers = game?.max_players ?? 4;
  const myPlayerId = account?.wallet_id;
  const myPubkey = account?.public_key;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-slate-heading mb-2">Waiting for Players</h1>
        <p className="text-slate-muted mb-8">
          {joining ? 'Joining game...' : `${playerCount}/${maxPlayers} penguins ready`}
        </p>

        {/* Penguin slots */}
        <div className="flex justify-center gap-4 flex-wrap mb-8">
          {Array.from({ length: maxPlayers }).map((_, i) => {
            const player = game?.players?.[i];
            const isMe = player?.player_id === myPlayerId || player?.pubkey === myPubkey;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${player
                      ? isMe
                        ? 'bg-orange-50 border-2 border-penguin-orange shadow-sm'
                        : 'bg-ice-50 border-2 border-ice-300 shadow-sm'
                      : 'bg-white border-2 border-dashed border-ice-200'
                    }`}
                >
                  {player ? (
                    <PenguinSvg
                      size={48}
                      color={PENGUIN_COLORS[i]}
                      className="animate-float"
                    />
                  ) : (
                    <span className="text-2xl text-ice-300">?</span>
                  )}
                </div>
                <span className="text-xs text-slate-muted">
                  {player ? (isMe ? 'You' : `P${i + 1}`) : 'Waiting...'}
                </span>
              </div>
            );
          })}
        </div>

        {game && (
          <div className="space-y-3">
            <div className="bg-white border border-ice-200 rounded-xl p-4 inline-flex gap-6 shadow-sm">
              <div className="text-center">
                <p className="text-slate-muted text-xs">Wager</p>
                <p className="text-slate-heading font-bold">${game.buy_in_usdc}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-muted text-xs">Pool</p>
                <p className="text-penguin-orange font-bold">
                  ${game.prize_pool_usdc || (parseFloat(game.buy_in_usdc) * playerCount).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-muted text-xs">Escrow</p>
                <p className="text-green-600 font-bold text-sm">
                  {joinedRef.current ? '✓ Funded' : '—'}
                </p>
              </div>
            </div>

            {joinedRef.current && game.escrow_address && (
              <p className="text-xs text-slate-muted/70 font-mono truncate max-w-xs mx-auto">
                Escrow: {game.escrow_address.slice(0, 8)}…{game.escrow_address.slice(-6)}
              </p>
            )}
          </div>
        )}

        {/* Pulsing dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-ice-400"
              style={{
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
