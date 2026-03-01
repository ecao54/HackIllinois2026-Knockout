import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import PenguinSvg from '../components/PenguinSvg';
import ArcticBackground from '../components/ArcticBackground';
import ArcticCard from '../components/ArcticCard';

function makeSteps(won: boolean, net: number, settled: boolean) {
  let netLabel: string;
  if (!settled) {
    netLabel = 'Settlement failed — balance unchanged';
  } else if (won) {
    netLabel = `+$${Math.abs(net).toFixed(2)} credited to balance`;
  } else if (net === 0) {
    netLabel = 'No balance change';
  } else {
    netLabel = `-$${Math.abs(net).toFixed(2)} deducted from balance`;
  }
  return [
    { label: 'Verifying result…', delay: 0 },
    { label: 'Processing settlement…', delay: 1200 },
    { label: netLabel, delay: 2400 },
  ];
}

export default function MockGameOver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const won = searchParams.get('won') === 'true';
  const players = parseInt(searchParams.get('players') || '4', 10);
  const _place = parseInt(searchParams.get('place') || (won ? '1' : '0'), 10); void _place;
  const wager = parseFloat(searchParams.get('wager') || '0.50');
  const net = parseFloat(searchParams.get('net') || '0');
  const settled = searchParams.get('settled') !== 'false';
  const confettiFired = useRef(false);
  const [settlementStep, setSettlementStep] = useState(0);

  const pool = wager * players;
  const myPayout = won ? Math.abs(net) : 0;

  useEffect(() => {
    if (won && !confettiFired.current) {
      confettiFired.current = true;
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD166', '#B8D4E8', '#FF8FA3', '#8B7355'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD166', '#B8D4E8', '#FF8FA3', '#8B7355'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [won]);

  const settlementSteps = makeSteps(won, net, settled);

  useEffect(() => {
    const timers = settlementSteps.map((step, i) =>
      setTimeout(() => setSettlementStep(i), step.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [won]);

  const isSettled = settlementStep >= settlementSteps.length - 1;

  return (
    <ArcticBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="text-center max-w-md space-y-6">
          {won ? (
            <>
              <div className="animate-float mb-4">
                <PenguinSvg size={120} color="orange" className="mx-auto" />
              </div>
              <h1 className="text-5xl font-extrabold text-penguin-orange mb-4 animate-fade-in" style={{ fontFamily: 'var(--font-heading)' }}>
                1st Place!
              </h1>

              <div
                className="rounded-2xl p-6 mb-4 animate-scale-in relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)',
                  boxShadow: '0 0 0 2px rgba(255, 209, 102, 0.4), 0 10px 40px rgba(139, 115, 85, 0.1)',
                }}
              >
                <p className="text-text-muted text-sm">Your payout</p>
                <p className="text-5xl font-extrabold text-penguin-orange" style={{ fontFamily: 'var(--font-heading)' }}>
                  +${myPayout.toFixed(2)}
                </p>
                <p className="text-text-muted/80 text-xs mt-2">
                  Net winnings from ${pool.toFixed(2)} pool
                </p>
              </div>

              <p className="text-text-secondary text-lg mb-4">
                Last penguin standing — well played!
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 animate-fade-in">
                <PenguinSvg size={120} color="blue" dead className="mx-auto" />
              </div>
              <h1 className="text-4xl font-extrabold text-taupe mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Knocked Out!</h1>
              <p className="text-text-muted text-lg mb-2">
                You were launched off the platform.
              </p>
              <p className="text-coral font-bold text-xl mb-4">
                {net === 0 ? 'No loss' : `-$${Math.abs(net).toFixed(2)}`}
              </p>
            </>
          )}

          {/* Settlement progress */}
          <ArcticCard className="animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {settlementSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < settlementStep ? 'bg-penguin-orange' : i === settlementStep && !isSettled ? 'bg-ice-400 animate-pulse' : 'bg-taupe/30'
                    }`}
                  />
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2">
                {isSettled ? (
                  <span className={`text-sm font-medium ${settled ? (won ? 'text-ice-600' : 'text-text-secondary') : 'text-coral'}`}>
                    {settled ? '✓' : '✗'} {settlementSteps[settlementStep].label}
                  </span>
                ) : (
                  <>
                    <svg className="animate-spin h-4 w-4 text-ice-400 flex-shrink-0" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-text-muted text-sm">{settlementSteps[settlementStep].label}</span>
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 text-center">
              {!settled && (
                <p className="text-[10px] text-coral">Could not settle — check your connection</p>
              )}
              {settled && won && (
                <p className="text-[10px] text-text-muted">Use Withdraw on the main page to cash out</p>
              )}
              {settled && !won && (
                <p className="text-[10px] text-text-muted">{net === 0 ? 'No deductible balance' : 'Wager deducted from balance'}</p>
              )}
            </div>
          </ArcticCard>

          {isSettled && (
            <button
              onClick={() => navigate('/')}
              className="w-full px-8 py-4 rounded-2xl bg-text-primary hover:bg-penguin-black
                text-white font-bold text-lg transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-fade-in"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    </ArcticBackground>
  );
}
