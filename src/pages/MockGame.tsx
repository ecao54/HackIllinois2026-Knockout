import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KnockoutEngine } from '../game/engine';
import { MAX_DRAG_DISTANCE } from '../game/constants';
import ArenaCanvas, { type DragState } from '../game/ArenaCanvas';

const EMPTY_DRAG: DragState = { dragging: false, power: 0, angle: 0, dragX: 0, dragY: 0 };

export default function MockGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const numBots = parseInt(searchParams.get('bots') || '3', 10);

  const engineRef = useRef<KnockoutEngine | null>(null);
  const rafRef = useRef<number>(0);
  const prevTimeRef = useRef(0);

  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick(t => t + 1), []);

  const [drag, setDrag] = useState<DragState>(EMPTY_DRAG);
  const draggingRef = useRef(false);

  useEffect(() => {
    const engine = new KnockoutEngine(1, numBots);
    engineRef.current = engine;

    engine.on((e) => {
      if (e.type === 'gameOver') {
        setTimeout(() => {
          const won = e.winnerId === 0;
          navigate(`/play/over?won=${won}&players=${numBots + 1}`, { replace: true });
        }, 2500);
      }
    });

    prevTimeRef.current = performance.now();
    const loop = (now: number) => {
      const dt = (now - prevTimeRef.current) / 1000;
      prevTimeRef.current = now;
      engine.tick(dt);
      rerender();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [numBots, navigate, rerender]);

  const handleDragStart = useCallback((wx: number, wy: number) => {
    const engine = engineRef.current;
    if (!engine || engine.state.phase !== 'AIMING') return;
    const human = engine.humanPenguin;
    if (!human.alive || human.lockedIn) return;

    draggingRef.current = true;
    setDrag({ dragging: true, power: 0, angle: 0, dragX: wx, dragY: wy });
  }, []);

  const handleDragMove = useCallback((wx: number, wy: number) => {
    if (!draggingRef.current) return;
    const engine = engineRef.current;
    if (!engine) return;
    const human = engine.humanPenguin;

    const dx = wx - human.x;
    const dy = wy - human.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(100, (dist / MAX_DRAG_DISTANCE) * 100);
    // Launch direction is OPPOSITE of drag (slingshot)
    const angle = Math.atan2(-dy, -dx);

    setDrag({ dragging: true, power, angle, dragX: wx, dragY: wy });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const engine = engineRef.current;
    if (!engine || engine.state.phase !== 'AIMING') {
      setDrag(EMPTY_DRAG);
      return;
    }
    const human = engine.humanPenguin;
    if (!human.alive || human.lockedIn) {
      setDrag(EMPTY_DRAG);
      return;
    }

    // Read current drag state via a ref-safe approach
    setDrag(prev => {
      if (prev.power > 3) {
        engine.lockIn({ power: prev.power, angle: prev.angle });
      }
      return EMPTY_DRAG;
    });
  }, []);

  const engine = engineRef.current;
  if (!engine) return null;

  const { state, particles } = engine;
  const { penguins, phase } = state;
  const human = penguins[0];
  const isHumanAlive = human?.alive ?? false;
  const aliveCount = penguins.filter(p => p.alive).length;
  const lockedInCount = engine.alivePenguins.filter(p => p.lockedIn).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-ice-100 to-sky">
      {/* HUD */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-muted">Round</p>
            <p className="text-lg font-bold text-slate-heading">{state.round}</p>
          </div>
          <div className="w-px h-8" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-muted">Alive</p>
            <p className={`text-lg font-bold ${aliveCount <= 2 ? 'text-coral' : 'text-green-600'}`}>
              {aliveCount}/{penguins.length}
            </p>
          </div>
        </div>

        <div className="text-center">
          {phase === 'COUNTDOWN' && (
            <p className="text-2xl font-extrabold text-penguin-orange animate-bounce">
              {engine.countdownValue}
            </p>
          )}
          {phase === 'AIMING' && (
            <div>
              <p className="text-sm font-bold text-slate-heading">
                {human.lockedIn ? 'Locked in!' : 'Drag your penguin to aim'}
              </p>
              <p className="text-xs text-slate-muted">
                {lockedInCount}/{aliveCount} ready
              </p>
            </div>
          )}
          {phase === 'SIMULATING' && (
            <p className="text-sm font-medium text-slate-muted">Penguins sliding...</p>
          )}
          {phase === 'ROUND_END' && (
            <p className="text-sm font-bold text-ice-200 animate-pulse">Arena shrinking...</p>
          )}
          {phase === 'GAME_OVER' && (
            <p className="text-lg font-bold text-penguin-orange">Game Over!</p>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-muted">Timer</p>
          <p className={`text-lg font-bold ${phase === 'AIMING' && state.turnTimer < 3 ? 'text-coral' : 'text-slate-heading'}`}>
            {phase === 'AIMING' ? Math.ceil(Math.max(0, state.turnTimer)) : '—'}
          </p>
        </div>
      </header>

      {/* Game area */}
      <main className="flex-1 flex items-center justify-center p-4 relative">
        <ArenaCanvas
          penguins={penguins}
          particles={particles}
          humanId={0}
          phase={phase}
          drag={drag}
          alpha={engine.interpolationAlpha}
          arenaRadius={state.arenaRadius}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

        {/* Eliminated overlay */}
        {!isHumanAlive && phase !== 'GAME_OVER' && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-6xl mb-3">🌊</p>
              <p className="text-2xl font-bold text-coral">Knocked Off!</p>
              <p className="text-slate-muted mt-2">Your penguin flew off the edge</p>
              <p className="text-slate-muted/60 text-sm mt-4">Watching remaining players...</p>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        {phase === 'COUNTDOWN' && (
          <div className="absolute inset-0 bg-penguin-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-none rounded-2xl">
            <div className="text-center">
              <p className="text-8xl font-extrabold text-penguin-orange animate-bounce">
                {engine.countdownValue}
              </p>
              <p className="text-white font-bold text-xl mt-2">Get ready!</p>
            </div>
          </div>
        )}

        {/* Locked-in toast */}
        {phase === 'AIMING' && human.lockedIn && isHumanAlive && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold pointer-events-none">
            ✓ Locked in — waiting for others
          </div>
        )}
      </main>

      {/* Hint */}
      <div className="text-center py-3 text-slate-muted text-xs">
        Click &amp; drag <span className="font-medium text-penguin-orange">away</span> from your penguin to aim &mdash; farther = more power. Release to lock in!
      </div>
    </div>
  );
}
