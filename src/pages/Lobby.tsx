import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import PenguinSvg from '../components/PenguinSvg';

const WAGER_OPTIONS = [
  { label: '$0.50', value: 0.5 },
  { label: '$1.00', value: 1 },
  { label: '$5.00', value: 5 },
];

const PLAYER_OPTIONS = [2, 4, 6];

export default function Lobby() {
  const navigate = useNavigate();
  const { account, balance, refreshBalance } = useAuth();
  const [wager, setWager] = useState(0.5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const usdcBalance = balance?.usdc_balance ?? 0;
  const canAfford = usdcBalance >= wager;

  const handleEnter = async () => {
    if (!canAfford) {
      setError(`Insufficient balance. You need $${wager.toFixed(2)} but have $${usdcBalance.toFixed(2)}. Deposit more funds first.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const game = await api.createGame(wager.toFixed(2), maxPlayers);
      navigate(`/game/waiting?game_id=${game.game_id}`);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      setError(e.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <PenguinSvg size={80} color="orange" className="mx-auto mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-slate-heading">Choose Your Game</h1>
          <p className="text-slate-muted mt-2">Pick your wager and player count</p>
        </div>

        <div className="bg-white border border-ice-200 rounded-2xl p-6 space-y-6 shadow-sm">
          {/* Balance reminder */}
          <div className="flex items-center justify-between bg-ice-50 rounded-xl px-4 py-3 border border-ice-100">
            <div>
              <p className="text-xs text-slate-muted">Your balance</p>
              <p className="font-bold text-penguin-orange">${usdcBalance.toFixed(2)}</p>
            </div>
            <button
              onClick={() => { refreshBalance(); }}
              className="text-xs text-slate-muted hover:text-ice-600 cursor-pointer"
            >
              Refresh
            </button>
          </div>

          {/* Wager selection */}
          <div>
            <label className="block text-sm font-medium text-slate-heading mb-3">Wager Amount</label>
            <div className="grid grid-cols-3 gap-3">
              {WAGER_OPTIONS.map((opt) => {
                const affordable = usdcBalance >= opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setWager(opt.value)}
                    disabled={!affordable}
                    className={`py-3 rounded-xl font-bold text-lg transition-all duration-150 cursor-pointer
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${wager === opt.value
                        ? 'bg-penguin-orange text-white shadow-md shadow-orange-200 scale-105'
                        : 'bg-ice-50 text-slate-heading hover:bg-ice-100 border border-ice-200'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player count */}
          <div>
            <label className="block text-sm font-medium text-slate-heading mb-3">Players</label>
            <div className="grid grid-cols-3 gap-3">
              {PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setMaxPlayers(count)}
                  className={`py-3 rounded-xl font-bold text-lg transition-all duration-150 cursor-pointer
                    ${maxPlayers === count
                      ? 'bg-ice-500 text-white shadow-md shadow-ice-200 scale-105'
                      : 'bg-ice-50 text-slate-heading hover:bg-ice-100 border border-ice-200'
                    }`}
                >
                  {count}
                  <span className="text-xs font-normal ml-1 opacity-70">
                    {count === 2 ? 'duel' : 'players'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pot preview */}
          <div className="bg-ice-50 border border-ice-100 rounded-xl p-4 text-center">
            <p className="text-slate-muted text-sm">Prize Pool</p>
            <p className="text-3xl font-bold text-penguin-orange">
              ${(wager * maxPlayers).toFixed(2)}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
              {!canAfford && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="block mx-auto mt-2 text-penguin-orange hover:text-orange-600 font-medium underline cursor-pointer"
                >
                  Deposit funds
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleEnter}
            disabled={loading || !canAfford}
            className="w-full py-4 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed cursor-pointer shadow-md shadow-orange-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating game...
              </span>
            ) : !canAfford ? (
              'Insufficient balance'
            ) : (
              `Enter Game — $${wager.toFixed(2)}`
            )}
          </button>

          {!canAfford && (
            <p className="text-center text-penguin-orange text-xs">
              You need at least ${wager.toFixed(2)} to join. Visit your dashboard to deposit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
