import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import PenguinSvg from '../components/PenguinSvg';

export default function GameOver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const won = searchParams.get('won') === 'true';
  const prize = searchParams.get('prize') || '0.00';
  const confettiFired = useRef(false);

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
          colors: ['#f97316', '#fbbf24', '#38bdf8', '#34d399'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f97316', '#fbbf24', '#38bdf8', '#34d399'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [won]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {won ? (
          <>
            <div className="animate-float mb-6">
              <PenguinSvg size={120} color="orange" className="mx-auto" />
            </div>
            <h1 className="text-5xl font-extrabold text-penguin-orange mb-4">
              You Won!
            </h1>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-6 shadow-sm">
              <p className="text-slate-muted text-sm">Your winnings</p>
              <p className="text-5xl font-extrabold text-penguin-orange">${prize}</p>
              <p className="text-slate-muted/60 text-xs mt-2">
                Payout is processed automatically to your account
              </p>
            </div>
            <p className="text-slate-body text-lg mb-8">
              Your penguin survived the crumbling ice! Amazing skill.
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
            <p className="text-slate-muted text-lg mb-8">
              Better luck next time — the ice was unforgiving today.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/lobby')}
            className="px-8 py-4 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md shadow-orange-200"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-xl bg-white border border-ice-200
                       text-slate-heading font-medium text-lg transition-all duration-150
                       hover:bg-ice-50 cursor-pointer shadow-sm"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
