import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PenguinSvg from '../components/PenguinSvg';
import ArcticBackground from '../components/ArcticBackground';
import ArcticCard from '../components/ArcticCard';
import PillButton from '../components/PillButton';
import { api } from '../api';
import { getWalletId, setWalletId } from '../stores/demoPlayer';
import type { Wallet } from '../types';

const PLAYER_OPTIONS = [2, 3, 4, 6, 8];
const WAGER_OPTIONS = [0.5, 1, 5];

export default function PlaySetup() {
  const navigate = useNavigate();
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [wager, setWager] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  const bots = totalPlayers - 1;
  const balance = wallet?.usdc_balance ?? null;
  const withdrawable = wallet?.simulated_usdc ?? 0;
  const pool = wager * totalPlayers;
  const canAfford = (balance ?? 0) >= wager;

  const fetchBalance = async (): Promise<void> => {
    const walletId = getWalletId();
    if (!walletId) return;
    setBalanceLoading(true);
    setApiError(null);
    try {
      const w = await api.getWallet(walletId);
      setWallet(w);
    } catch {
      setWallet((prev) => (prev ? { ...prev, usdc_balance: prev.usdc_balance ?? 0 } : null));
      setApiError('Could not reach API. Check VITE_API_URL.');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const walletId = getWalletId();
    const currentBal = balance ?? 0;
    if (!walletId || currentBal <= 0) return;
    setWithdrawLoading(true);
    setWithdrawMessage(null);
    try {
      const result = await api.withdraw(walletId, currentBal);
      const amount = result.amount_usdc ?? currentBal;
      setWithdrawMessage(`Withdrew $${amount.toFixed(2)}`);
      const fresh = await api.getWallet(walletId);
      setWallet(fresh);
    } catch (err: unknown) {
      setWithdrawMessage(err instanceof Error ? err.message : 'Withdraw failed');
      try {
        const fresh = await api.getWallet(walletId);
        setWallet(fresh);
      } catch {}
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      let walletId = getWalletId();
      if (!walletId) {
        try {
          const w = await api.createWallet();
          walletId = w.wallet_id;
          setWalletId(walletId);
          setWallet(w);
          setApiError(null);
        } catch (err) {
          setApiError(err instanceof Error ? err.message : 'Could not reach API');
          setInitLoading(false);
          return;
        }
      }
      try {
        await fetchBalance();
      } finally {
        setInitLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchBalance();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const startGame = async () => {
    setLoading(true);
    setError(null);

    try {
      let walletId = getWalletId();

      if (!walletId) {
        const w = await api.createWallet();
        walletId = w.wallet_id;
        setWalletId(walletId);
      }

      // Always fetch fresh balance from API
      const fresh = await api.getWallet(walletId);
      setWallet(fresh);
      const currentBalance = fresh.usdc_balance ?? 0;

      if (currentBalance >= wager) {
        const params = new URLSearchParams({
          bots: String(bots),
          wager: String(wager),
          wallet_id: walletId,
        });
        navigate(`/play/game?${params}`);
      } else {
        // Insufficient balance → deposit via Stripe
        const amountToCharge = Math.max(0.5, wager - currentBalance);
        const redirectUrl = `${window.location.origin}/play/funded`;
        const session = await api.deposit(walletId, redirectUrl, amountToCharge);
        window.location.href = session.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <ArcticBackground>
      <div className="relative flex flex-col items-center justify-center px-4 py-12 min-h-screen">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <div className="animate-float mb-4">
              <PenguinSvg size={100} color="orange" className="mx-auto" />
            </div>
            <h1 className="text-4xl font-extrabold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
              Penguin <span className="text-penguin-orange">Knockout</span>
            </h1>
          </div>

          {/* Card: Choose your game */}
          <ArcticCard title="Choose your game" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-text-muted mb-2">Buy-in</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {WAGER_OPTIONS.map((w) => (
                    <PillButton key={w} selected={wager === w} onClick={() => setWager(w)}>
                      ${w.toFixed(2)}
                    </PillButton>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-text-muted mb-2">Total penguins</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {PLAYER_OPTIONS.map((count) => (
                    <PillButton key={count} selected={totalPlayers === count} onClick={() => setTotalPlayers(count)}>
                      {count}
                    </PillButton>
                  ))}
                </div>
              </div>
              <div className="bg-surface-elevated/60 rounded-xl p-3 flex justify-center gap-2">
                {Array.from({ length: totalPlayers }).map((_, i) => {
                  const colors = ['orange', 'blue', 'green', 'pink', 'purple', 'red', 'yellow', 'teal'];
                  return (
                    <div key={i} className="relative">
                      <PenguinSvg
                        size={36}
                        color={colors[i % colors.length]}
                        className={i === 0 ? 'animate-wiggle' : ''}
                      />
                      {i === 0 && (
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-penguin-orange whitespace-nowrap">
                          You
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ArcticCard>

          {/* Balance + Pool row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ArcticCard title="Your balance" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between">
                <div>
                  {initLoading || balanceLoading ? (
                    <div className="h-8 flex items-center">
                      <svg className="animate-spin h-5 w-5 text-ice-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : (
                    <p className="text-2xl font-extrabold text-penguin-orange">
                      ${(balance ?? 0).toFixed(2)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={fetchBalance}
                  disabled={balanceLoading || initLoading}
                  className="text-xs text-taupe hover:text-soft-brown font-medium disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Refresh
                </button>
              </div>
              {wallet && !balanceLoading && !initLoading && (
                <div className="mt-2 space-y-0.5 text-[10px] text-text-muted">
                  {balance !== null && balance >= wager && (
                    <p className="text-ice-600 font-medium">Balance covers buy-in</p>
                  )}
                  {balance !== null && balance < wager && balance > 0 && (
                    <p>Add ${(wager - balance).toFixed(2)} more for this buy-in</p>
                  )}
                  {withdrawable > 0 && (
                    <p>Withdrawable: ${withdrawable.toFixed(2)}</p>
                  )}
                </div>
              )}
              {wallet && !balanceLoading && !initLoading && (balance ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={withdrawLoading}
                  className="mt-3 w-full py-2 rounded-xl bg-surface-elevated hover:bg-taupe/20
                    text-soft-brown font-semibold text-sm transition-all
                    disabled:opacity-50 cursor-pointer"
                >
                  {withdrawLoading ? 'Processing…' : `Withdraw $${(balance ?? 0).toFixed(2)}`}
                </button>
              )}
            </ArcticCard>

            <ArcticCard title="Prize pool" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <p className="text-2xl font-extrabold text-penguin-orange">${pool.toFixed(2)}</p>
              <p className="text-[10px] text-text-muted mt-1">
                ${wager.toFixed(2)} × {totalPlayers} players
              </p>
            </ArcticCard>
          </div>

          {apiError && <p className="text-sm text-coral font-medium">{apiError}</p>}
          {withdrawMessage && (
            <p className={`text-sm ${withdrawMessage.startsWith('Withdrew') ? 'text-ice-600' : 'text-coral'}`}>
              {withdrawMessage}
            </p>
          )}

          {error && <p className="text-sm text-coral font-medium text-center">{error}</p>}

          {/* CTA */}
          <button
            onClick={startGame}
            disabled={loading || initLoading}
            className="w-full py-4 rounded-2xl bg-text-primary hover:bg-penguin-black
              text-white font-bold text-xl transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98] cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-xl hover:animate-pulse-glow animate-fade-in"
            style={{ fontFamily: 'var(--font-heading)', animationDelay: '0.3s' }}
          >
            {loading
              ? 'Entering game…'
              : canAfford
                ? `Enter Game — $${wager.toFixed(2)}`
                : `Fund & Play — $${wager.toFixed(2)}`}
          </button>
        </div>
      </div>
    </ArcticBackground>
  );
}
