import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PenguinSvg from '../components/PenguinSvg';

const PLAYER_OPTIONS = [2, 3, 4, 6, 8];

export default function PlaySetup() {
  const navigate = useNavigate();
  const [totalPlayers, setTotalPlayers] = useState(4);

  const startGame = () => {
    const bots = totalPlayers - 1;
    navigate(`/play/game?bots=${bots}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-ice-100 to-sky">
      <div className="w-full max-w-sm text-center">
        <div className="animate-float mb-6">
          <PenguinSvg size={100} color="orange" className="mx-auto" />
        </div>

        <h1 className="text-4xl font-extrabold text-slate-heading mb-8">
          Penguin <span className="text-black">Knockout</span>
        </h1>

        <div className="bg-white rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-heading mb-3">Total penguins</label>
            <div className="flex gap-2 justify-center">
              {PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  onClick={() => setTotalPlayers(count)}
                  className={`py-3 px-5 rounded-xl font-bold text-lg transition-all duration-150 cursor-pointer
                    ${totalPlayers === count
                      ? 'bg-ice-500 text-white scale-105'
                      : 'bg-ice-50 text-slate-heading hover:bg-ice-100'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-2 py-2">
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

          <p className="text-xs text-slate-muted">
            You vs {totalPlayers - 1} bot{totalPlayers - 1 > 1 ? 's' : ''}. Drag the slider to set power, aim with your mouse, and release to launch!
          </p>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-xl bg-black hover:bg-gray-800
                       text-white font-bold text-xl transition-all duration-150
                       hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
