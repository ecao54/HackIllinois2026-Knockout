import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import PenguinSvg from '../components/PenguinSvg';

const DEPOSIT_OPTIONS = [
  { label: '$1', value: 1 },
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$25', value: 25 },
];

export default function Dashboard() {
  const { account, balance, refreshBalance } = useAuth();
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!account) return null;

  const handleDeposit = async () => {
    const amount = customAmount ? parseFloat(customAmount) : depositAmount;
    if (!amount || amount < 0.5) {
      setError('Minimum deposit is $0.50');
      return;
    }

    setDepositing(true);
    setError(null);

    try {
      const origin = window.location.origin;
      const checkout = await api.createCheckoutSession(
        account.player_id,
        amount,
        `${origin}/dashboard?deposited=true`,
        `${origin}/dashboard`,
      );
      window.location.href = checkout.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to start checkout.');
      setDepositing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  };

  const usdcBalance = balance?.usdc_balance ?? 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Account header */}
        <div className="flex items-center gap-4">
          <PenguinSvg size={64} color="orange" />
          <div>
            <h1 className="text-2xl font-bold text-slate-heading">{account.displayName}</h1>
            <p className="text-slate-muted text-sm">@{account.username}</p>
          </div>
        </div>

        {/* Balance card */}
        <div className="bg-white border border-ice-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-heading">Your Balance</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs text-slate-muted hover:text-ice-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="text-center py-4">
            <p className="text-5xl font-extrabold text-penguin-orange">
              ${usdcBalance.toFixed(2)}
            </p>
            <p className="text-slate-muted text-sm mt-2">Available to play</p>
          </div>
        </div>

        {/* Deposit section */}
        <div className="bg-white border border-ice-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-heading">Add Funds</h2>
          <p className="text-slate-muted text-sm">
            Deposit money to your account. Pay securely with your credit card.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEPOSIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDepositAmount(opt.value); setCustomAmount(''); }}
                className={`py-3 rounded-xl font-bold text-lg transition-all duration-150 cursor-pointer
                  ${!customAmount && depositAmount === opt.value
                    ? 'bg-penguin-orange text-white shadow-md shadow-orange-200 scale-105'
                    : 'bg-ice-50 text-slate-heading hover:bg-ice-100 border border-ice-200'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-muted text-sm whitespace-nowrap">Or custom:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted">$</span>
              <input
                type="number"
                min="0.50"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl bg-ice-50 border border-ice-200
                           text-slate-heading placeholder:text-slate-muted/50 focus:outline-none
                           focus:ring-2 focus:ring-penguin-orange/40 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleDeposit}
            disabled={depositing}
            className="w-full py-3.5 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50
                       disabled:cursor-not-allowed cursor-pointer shadow-md shadow-orange-200"
          >
            {depositing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to checkout...
              </span>
            ) : (
              `Deposit $${(customAmount ? parseFloat(customAmount) || 0 : depositAmount).toFixed(2)}`
            )}
          </button>

          <p className="text-center text-slate-muted/60 text-xs">
            Secure payment powered by Stripe. Minimum deposit $0.50.
          </p>
        </div>

        {/* Play CTA */}
        <div className="bg-gradient-to-r from-orange-50 to-ice-50 border border-ice-200 rounded-2xl p-6 text-center shadow-sm">
          <h3 className="text-xl font-bold text-slate-heading mb-2">Ready to play?</h3>
          <p className="text-slate-muted text-sm mb-4">
            {usdcBalance >= 0.5
              ? 'You have enough funds to join a game!'
              : 'Deposit at least $0.50 to start playing.'}
          </p>
          <button
            onClick={() => navigate('/lobby')}
            disabled={usdcBalance < 0.5}
            className="px-8 py-3 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30
                       disabled:cursor-not-allowed cursor-pointer shadow-md shadow-orange-200"
          >
            Find a Game
          </button>
        </div>

        {/* Account info */}
        <div className="bg-white border border-ice-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-heading mb-3">Account Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-muted">Username</span>
              <span className="text-slate-heading font-medium">@{account.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-muted">Player ID</span>
              <span className="text-slate-heading font-mono text-xs">{account.player_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-muted">Member since</span>
              <span className="text-slate-heading">{new Date(account.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
