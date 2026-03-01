import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PenguinSvg from '../components/PenguinSvg';
import ArcticBackground from '../components/ArcticBackground';
import ArcticCard from '../components/ArcticCard';
import { api } from '../api';
import { getWalletId } from '../stores/demoPlayer';

type Stage = 'polling' | 'confirmed' | 'cancelled' | 'error';

export default function FundedCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stripeStatus = searchParams.get('status');

  const [stage, setStage] = useState<Stage>('polling');
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (stripeStatus === 'cancelled') {
      setStage('cancelled');
      return;
    }

    const walletId = getWalletId();
    if (!walletId) {
      setStage('error');
      setError('No wallet found. Please start over.');
      return;
    }

    (async () => {
      try {
        let funded = false;
        for (let attempt = 0; attempt < 30; attempt++) {
          const w = await api.getWallet(walletId);
          const bal = w.usdc_balance ?? 0;
          setBalance(bal);
          if (bal > 0) {
            funded = true;
            break;
          }
          await new Promise(r => setTimeout(r, 2000));
        }

        if (!funded) {
          setStage('error');
          setError('Payment not detected after 60 seconds. Please try again.');
          return;
        }

        setStage('confirmed');
        await new Promise(r => setTimeout(r, 2000));
        navigate('/', { replace: true });
      } catch (err: unknown) {
        setStage('error');
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    })();
  }, [navigate, stripeStatus]);

  return (
    <ArcticBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center animate-fade-in">
            <div className="animate-float mb-4">
              <PenguinSvg size={80} color="orange" className="mx-auto" />
            </div>
            <h2 className="text-2xl font-extrabold text-text-primary mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
              {stage === 'confirmed' ? 'Deposit Confirmed!' : stage === 'cancelled' ? 'Checkout Cancelled' : 'Confirming Deposit…'}
            </h2>
          </div>

          <ArcticCard className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-center gap-4 py-4">
              {stage === 'polling' && (
                <>
                  <svg className="animate-spin h-8 w-8 text-penguin-orange" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-text-muted text-sm">Waiting for Stripe payment to arrive…</p>
                </>
              )}
              {stage === 'confirmed' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-penguin-orange/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-penguin-orange">✓</span>
                  </div>
                  <p className="text-ice-600 font-medium">Payment received!</p>
                  <p className="text-text-muted text-sm">Returning to game setup…</p>
                </>
              )}
            </div>
          </ArcticCard>

          {balance !== null && (
            <ArcticCard className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-text-muted">Balance</p>
                <p className="text-2xl font-bold text-penguin-orange">${balance.toFixed(2)}</p>
              </div>
            </ArcticCard>
          )}

          {stage === 'cancelled' && (
            <div className="space-y-3 animate-fade-in">
              <ArcticCard>
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-text-muted font-medium">Payment cancelled</p>
                  <p className="text-text-muted text-sm">No charges were made.</p>
                </div>
              </ArcticCard>
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 rounded-2xl bg-text-primary hover:bg-penguin-black
                  text-white font-bold transition-all cursor-pointer
                  hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Back to Game
              </button>
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-coral font-medium text-sm text-center">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 rounded-2xl bg-text-primary hover:bg-penguin-black
                  text-white font-bold transition-all cursor-pointer
                  hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Back to Game
              </button>
            </div>
          )}
        </div>
      </div>
    </ArcticBackground>
  );
}
