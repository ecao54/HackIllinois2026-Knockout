import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import PenguinSvg from '../components/PenguinSvg';
import { getWalletId } from '../stores/demoPlayer';

const SETTLEMENT_STEPS = [
  { label: 'Verifying result…', delay: 0 },
  { label: 'Processing settlement…', delay: 1200 },
  { label: 'Paid out to your test account', delay: 2400 },
];

export default function GameOver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const won = searchParams.get('won') === 'true';
  const prize = searchParams.get('prize') || '0.00';
  const place = parseInt(searchParams.get('place') || (won ? '1' : '0'), 10);
  const payout = searchParams.get('payout') || (won ? prize : '0.00');
  const confettiFired = useRef(false);
  const [settlementStep, setSettlementStep] = useState(0);

  const walletId = getWalletId();
  const accountDisplay = walletId
    ? `acc_${walletId.slice(0, 8)}…${walletId.slice(-6)}`
    : null;
  const confId = walletId
    ? `tx_${walletId.replace(/-/g, '').slice(0, 12)}`
    : null;

  useEffect(() => {
    if (won && !confettiFired.current) {
      confettiFired.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD166', '#89C2FF', '#FF8FA3', '#34d399'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD166', '#89C2FF', '#FF8FA3', '#34d399'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [won]);

  useEffect(() => {
    const timers = SETTLEMENT_STEPS.map((step, i) =>
      setTimeout(() => setSettlementStep(i), step.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const settled = settlementStep >= SETTLEMENT_STEPS.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {won ? (
          <>
            <div className="animate-float mb-6">
              <PenguinSvg size={120} color="orange" className="mx-auto" />
            </div>
            <h1 className="text-5xl font-extrabold text-penguin-orange mb-4">
              {place === 1 ? '1st Place!' : '2nd Place!'}
            </h1>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-4">
              <p className="text-slate-muted text-sm">Your payout</p>
              <p className="text-5xl font-extrabold text-penguin-orange">${payout}</p>
              <p className="text-slate-muted/60 text-xs mt-2">
                {place === 1 ? '70%' : '30%'} of ${prize} pool
              </p>
            </div>

            {/* Pool breakdown */}
            <div className="bg-white/80 border border-ice-200 rounded-xl p-4 mb-4 text-sm">
              <p className="text-slate-muted text-xs mb-2 font-medium uppercase tracking-wider">Pool Distribution</p>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-heading font-medium">🥇 1st Place (70%)</span>
                <span className="font-bold text-penguin-orange">
                  ${(parseFloat(prize) * 0.7).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-heading font-medium">🥈 2nd Place (30%)</span>
                <span className="font-bold text-ice-600">
                  ${(parseFloat(prize) * 0.3).toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-slate-body text-lg mb-4">
              {place === 1
                ? 'Last penguin standing — well played!'
                : 'Runner-up — so close!'}
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <PenguinSvg size={120} color="blue" dead className="mx-auto" />
            </div>
            <h1 className="text-4xl font-extrabold text-ice-600 mb-4">
              You Fell In!
            </h1>
            <p className="text-slate-muted text-lg mb-4">
              Better luck next time — the ice was unforgiving today.
            </p>
          </>
        )}

        {/* Settlement status */}
        <div className="bg-white border border-ice-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 justify-center">
            {settled ? (
              <span className="text-green-600 text-sm font-medium">✓ {SETTLEMENT_STEPS[settlementStep].label}</span>
            ) : (
              <>
                <svg className="animate-spin h-4 w-4 text-ice-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-slate-muted text-sm">{SETTLEMENT_STEPS[settlementStep].label}</span>
              </>
            )}
          </div>
          <div className="mt-2 space-y-0.5 text-left max-w-xs mx-auto">
            {accountDisplay && (
              <p className="text-[10px] text-slate-muted/70 font-mono">Account: {accountDisplay}</p>
            )}
            {confId && (
              <p className="text-[10px] text-slate-muted/70 font-mono">Confirmation: {confId}</p>
            )}
            {!accountDisplay && (
              <p className="text-[10px] text-slate-muted/50">Credited to the account you used to deposit</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/lobby')}
            className="px-8 py-4 rounded-xl bg-black hover:bg-gray-800
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-xl bg-white border border-ice-200
                       text-slate-heading font-medium text-lg transition-all duration-150
                       hover:bg-ice-50 cursor-pointer"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
