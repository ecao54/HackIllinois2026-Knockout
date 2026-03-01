import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import PenguinSvg from '../components/PenguinSvg';

export default function MockGameOver() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const won = searchParams.get('won') === 'true';
  const players = searchParams.get('players') || '4';
  const confettiFired = useRef(false);

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
          colors: ['#f97316', '#fbbf24', '#38bdf8', '#34d399'],
        });
        confetti({
          particleCount: 4,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-ice-100 to-sky">
      <div className="text-center max-w-md">
        {won ? (
          <>
            <div className="animate-float mb-6">
              <PenguinSvg size={120} color="orange" className="mx-auto" />
            </div>
            <h1 className="text-5xl font-extrabold text-penguin-orange mb-4">You Won!</h1>
            <div className="bg-white border border-orange-200 rounded-2xl p-6 mb-6 shadow-sm">
              <p className="text-slate-muted text-sm">Players knocked out</p>
              <p className="text-5xl font-extrabold text-penguin-orange">{parseInt(players) - 1}</p>
            </div>
            <p className="text-slate-body text-lg mb-8">
              Last penguin standing on the ice — well played!
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              <PenguinSvg size={120} color="blue" dead className="mx-auto" />
            </div>
            <h1 className="text-4xl font-extrabold text-ice-600 mb-4">Knocked Out!</h1>
            <p className="text-slate-muted text-lg mb-8">
              You were launched off the platform. Try again?
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 rounded-xl bg-penguin-orange hover:bg-orange-600
                       text-white font-bold text-lg transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                       shadow-md shadow-orange-200"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
