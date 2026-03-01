import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KnockoutEngine } from '../game/engine';
import { MAX_DRAG_DISTANCE } from '../game/constants';
import ArenaCanvas, { type DragState } from '../game/ArenaCanvas';
import ArcticBackground from '../components/ArcticBackground';
import StatBadge from '../components/StatBadge';
import { api } from '../api';
import { getWalletId } from '../stores/demoPlayer';

const EMPTY_DRAG: DragState = { dragging: false, power: 0, angle: 0, dragX: 0, dragY: 0 };

export default function MockGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const numBots = parseInt(searchParams.get('bots') || '3', 10);
  const wager = parseFloat(searchParams.get('wager') || '0.50');

  const pool = wager * (numBots + 1);

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
        const humanPlacement = e.placements.find(p => p.penguinId === 0);
        const place = humanPlacement?.place ?? 0;
        const won = place === 1;

        const goToGameOver = (settled: boolean, actualNet: number) => {
          const params = new URLSearchParams({
            won: String(won),
            players: String(numBots + 1),
            place: String(place),
            wager: String(wager),
            net: actualNet.toFixed(2),
            settled: String(settled),
          });
          navigate(`/play/over?${params}`, { replace: true });
        };

        const doSettle = async () => {
          const walletId = getWalletId();
          if (!walletId) {
            goToGameOver(false, 0);
            return;
          }

          try {
            if (won) {
              const netProfit = pool - wager;
              const result = await api.transfer(walletId, netProfit, 'prize winnings');
              const actualNet = result.after_balance - result.before_balance;
              goToGameOver(true, actualNet);
            } else {
              const result = await api.transfer(walletId, -wager, 'game loss');
              const actualNet = result.after_balance - result.before_balance;
              goToGameOver(true, actualNet);
            }
          } catch (err) {
            console.error('[transfer] Failed:', err);
            goToGameOver(false, won ? (pool - wager) : -wager);
          }
        };

        setTimeout(doSettle, 2500);
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
  }, [numBots, wager, pool, navigate, rerender]);

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
    <ArcticBackground>
      <div className="min-h-screen flex flex-col">
      {/* HUD - frosted glass */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/60 backdrop-blur-md border-b border-arctic-frost/50 animate-fade-in">
        <div className="flex items-center gap-2">
          <StatBadge label="Round" value={state.round} />
          <StatBadge
            label="Alive"
            value={`${aliveCount}/${penguins.length}`}
            className={aliveCount <= 2 ? '!border-coral/50' : ''}
          />
        </div>

        <div className="flex-1 flex justify-center px-2">
          <div className="bg-card-bg/60 backdrop-blur rounded-xl px-4 py-2 border border-taupe/20">
            {phase === 'COUNTDOWN' && (
              <p className="text-2xl font-extrabold text-penguin-orange animate-bounce" style={{ fontFamily: 'var(--font-heading)' }}>
                {engine.countdownValue}
              </p>
            )}
            {phase === 'AIMING' && (
              <div>
                <p className="text-sm font-bold text-text-primary">
                  {human.lockedIn ? 'Locked in!' : 'Drag your penguin to aim'}
                </p>
                <p className="text-xs text-text-muted">
                  {lockedInCount}/{aliveCount} ready
                </p>
              </div>
            )}
            {phase === 'SIMULATING' && (
              <p className="text-sm font-medium text-text-muted">Penguins sliding...</p>
            )}
            {phase === 'ROUND_END' && (
              <p className="text-sm font-bold text-arctic-ice animate-pulse">Arena shrinking...</p>
            )}
            {phase === 'GAME_OVER' && (
              <p className="text-lg font-bold text-penguin-orange">Game Over!</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatBadge label="Pool" value={`$${pool.toFixed(2)}`} className="!text-penguin-orange [&>p:last-child]:!text-penguin-orange" />
          <StatBadge
            label="Timer"
            value={phase === 'AIMING' ? Math.ceil(Math.max(0, state.turnTimer)) : '—'}
            className={phase === 'AIMING' && state.turnTimer < 3 ? 'animate-pulse !border-coral/50 [&>p:last-child]:!text-coral' : ''}
          />
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
          <div className="absolute inset-0 bg-arctic-frost/70 backdrop-blur-md flex items-center justify-center pointer-events-none">
            <div className="text-center animate-scale-in bg-card-bg rounded-2xl p-8 border border-taupe/30 shadow-xl">
              <p className="text-6xl mb-3">🌊</p>
              <p className="text-2xl font-bold text-coral" style={{ fontFamily: 'var(--font-heading)' }}>Knocked Off!</p>
              <p className="text-text-muted mt-2">Your penguin flew off the edge</p>
              <p className="text-text-muted/80 text-sm mt-4">Watching remaining players...</p>
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
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-ice-600 text-white px-4 py-2 rounded-xl text-sm font-bold pointer-events-none shadow-lg border border-arctic-frost/30 animate-scale-in">
            ✓ Locked in — waiting for others
          </div>
        )}
      </main>

      {/* Hint */}
      <div className="text-center py-3 text-text-muted text-xs bg-surface-elevated/40">
        Click &amp; drag <span className="font-medium text-penguin-orange">away</span> from your penguin to aim &mdash; farther = more power. Release to lock in!
      </div>
      </div>
    </ArcticBackground>
  );
}
