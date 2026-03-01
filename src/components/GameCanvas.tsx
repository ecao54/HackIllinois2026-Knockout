import { useRef, useEffect, useCallback } from 'react';
import type { Game, GamePlayer } from '../types';

const TILE_GAP = 2;
const BELLY_COLORS = [
  '#f97316', '#38bdf8', '#34d399', '#f472b6',
  '#a78bfa', '#f87171', '#fbbf24', '#2dd4bf',
  '#e2e8f0', '#a3e635',
];
const ANIM_DURATION = 150; // ms for penguin slide

interface AnimatedPlayer extends GamePlayer {
  renderX: number;
  renderY: number;
  targetX: number;
  targetY: number;
  animStart: number;
  startRenderX: number;
  startRenderY: number;
}

interface Props {
  game: Game;
  currentPubkey: string | null;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export default function GameCanvas({ game, currentPubkey }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevGridRef = useRef<number[]>([]);
  const animPlayersRef = useRef<Map<string, AnimatedPlayer>>(new Map());
  const rafRef = useRef<number>(0);
  const lastCollapseRoundRef = useRef<number>(0);
  const newlyCollapsedRef = useRef<Set<number>>(new Set());
  const collapseFlashRef = useRef<number>(0);

  // Update animated player targets when game changes
  useEffect(() => {
    const map = animPlayersRef.current;
    const now = performance.now();

    for (const player of game.players) {
      const existing = map.get(player.pubkey);
      if (existing) {
        if (existing.targetX !== player.x || existing.targetY !== player.y) {
          existing.startRenderX = existing.renderX;
          existing.startRenderY = existing.renderY;
          existing.targetX = player.x;
          existing.targetY = player.y;
          existing.animStart = now;
        }
        existing.alive = player.alive;
      } else {
        map.set(player.pubkey, {
          ...player,
          renderX: player.x,
          renderY: player.y,
          targetX: player.x,
          targetY: player.y,
          animStart: 0,
          startRenderX: player.x,
          startRenderY: player.y,
        });
      }
    }

    // Track newly collapsed tiles for flash effect
    const prevGrid = prevGridRef.current;
    const currentRound = game.collapse_round ?? 0;
    if (currentRound > lastCollapseRoundRef.current && prevGrid.length > 0) {
      const newSet = new Set<number>();
      for (let i = 0; i < game.grid.length; i++) {
        if (game.grid[i] === 1 && prevGrid[i] === 0) {
          newSet.add(i);
        }
      }
      newlyCollapsedRef.current = newSet;
      collapseFlashRef.current = now;
      lastCollapseRoundRef.current = currentRound;
    }

    prevGridRef.current = [...game.grid];
  }, [game]);

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const size = Math.min(rect.width, rect.height);
    const gridSize = game.grid_size || 10;
    const tileSize = (size - TILE_GAP * (gridSize + 1)) / gridSize;
    const offsetX = (rect.width - size) / 2;
    const offsetY = (rect.height - size) / 2;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const flashAge = now - collapseFlashRef.current;
    const flashActive = flashAge < 600;

    // -- Draw tiles --
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const idx = row * gridSize + col;
        const collapsed = game.grid[idx] === 1;
        const justCollapsed = newlyCollapsedRef.current.has(idx) && flashActive;

        const x = offsetX + TILE_GAP + col * (tileSize + TILE_GAP);
        const y = offsetY + TILE_GAP + row * (tileSize + TILE_GAP);

        // Shake effect on newly collapsed tiles
        let shakeX = 0, shakeY = 0;
        if (justCollapsed && flashAge < 300) {
          const intensity = 3 * (1 - flashAge / 300);
          shakeX = (Math.random() - 0.5) * intensity * 2;
          shakeY = (Math.random() - 0.5) * intensity * 2;
        }

        ctx.beginPath();
        ctx.roundRect(x + shakeX, y + shakeY, tileSize, tileSize, 5);

        if (collapsed) {
          const gradient = ctx.createLinearGradient(x, y, x, y + tileSize);
          gradient.addColorStop(0, '#2563eb');
          gradient.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = gradient;
          ctx.fill();

          if (justCollapsed) {
            const flashOpacity = Math.max(0, 1 - flashAge / 600);
            ctx.strokeStyle = `rgba(239, 68, 68, ${flashOpacity})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Crack lines
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${flashOpacity * 0.7})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.3);
            ctx.lineTo(x + tileSize * 0.5, y + tileSize * 0.5);
            ctx.lineTo(x + tileSize * 0.4, y + tileSize * 0.8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + tileSize * 0.5, y + tileSize * 0.5);
            ctx.lineTo(x + tileSize * 0.8, y + tileSize * 0.4);
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          // Water ripples
          const ripplePhase = (now / 1000 + idx * 0.3) % (Math.PI * 2);
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const ry = y + tileSize * 0.3 + i * tileSize * 0.2;
            const amp = 2 + Math.sin(ripplePhase + i) * 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 4, ry);
            ctx.quadraticCurveTo(x + tileSize / 2, ry + amp, x + tileSize - 4, ry);
            ctx.stroke();
          }
        } else {
          const gradient = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
          gradient.addColorStop(0, '#dbeafe');
          gradient.addColorStop(0.3, '#eff6ff');
          gradient.addColorStop(0.7, '#ffffff');
          gradient.addColorStop(1, '#dbeafe');
          ctx.fillStyle = gradient;
          ctx.fill();

          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.ellipse(x + tileSize * 0.3, y + tileSize * 0.25, tileSize * 0.18, tileSize * 0.08, -0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.ellipse(x + tileSize * 0.6, y + tileSize * 0.65, tileSize * 0.1, tileSize * 0.05, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // -- Update animated positions --
    const map = animPlayersRef.current;
    let needsAnim = false;

    for (const [, ap] of map) {
      if (ap.animStart > 0) {
        const elapsed = now - ap.animStart;
        const t = Math.min(1, elapsed / ANIM_DURATION);
        const e = easeOut(t);
        ap.renderX = ap.startRenderX + (ap.targetX - ap.startRenderX) * e;
        ap.renderY = ap.startRenderY + (ap.targetY - ap.startRenderY) * e;
        if (t < 1) needsAnim = true;
        else ap.animStart = 0;
      } else {
        ap.renderX = ap.targetX;
        ap.renderY = ap.targetY;
      }
    }

    // -- Draw alive penguins --
    for (const [pubkey, ap] of map) {
      if (!ap.alive) continue;
      const i = game.players.findIndex((p) => p.pubkey === pubkey);

      const px = offsetX + TILE_GAP + ap.renderX * (tileSize + TILE_GAP);
      const py = offsetY + TILE_GAP + ap.renderY * (tileSize + TILE_GAP);
      const cx = px + tileSize / 2;
      const cy = py + tileSize / 2;
      const isMe = pubkey === currentPubkey;
      const bellyColor = BELLY_COLORS[i % BELLY_COLORS.length];
      const radius = tileSize * 0.35;

      // Highlight ring (dashed gold)
      if (isMe) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius + 3, radius * 0.7, radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (classic black)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1e2e';
      ctx.fill();

      // White belly
      ctx.beginPath();
      ctx.arc(cx, cy + 2, radius * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Colored scarf
      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy - radius * 0.15, radius * 0.5, radius * 0.12, 0, 0, Math.PI);
      ctx.fill();

      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.25, cy - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + radius * 0.25, cy - radius * 0.2, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.2, cy - radius * 0.2, radius * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + radius * 0.3, cy - radius * 0.2, radius * 0.09, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - radius * 0.18, cy + radius * 0.3);
      ctx.lineTo(cx + radius * 0.18, cy + radius * 0.3);
      ctx.fill();
    }

    // -- Draw dead penguins --
    for (const [pubkey, ap] of map) {
      if (ap.alive) continue;

      const px = offsetX + TILE_GAP + ap.renderX * (tileSize + TILE_GAP);
      const py = offsetY + TILE_GAP + ap.renderY * (tileSize + TILE_GAP);
      const cx = px + tileSize / 2;
      const cy = py + tileSize / 2 + tileSize * 0.15;
      const radius = tileSize * 0.25;

      // Bobbing in water
      const bob = Math.sin(now / 600 + (pubkey.charCodeAt(0) || 0)) * 2;

      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy + bob, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1e2e';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + bob + 1, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // X eyes
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      const es = radius * 0.2;
      ctx.beginPath();
      ctx.moveTo(cx - radius * 0.3 - es, cy + bob - radius * 0.2 - es);
      ctx.lineTo(cx - radius * 0.3 + es, cy + bob - radius * 0.2 + es);
      ctx.moveTo(cx - radius * 0.3 + es, cy + bob - radius * 0.2 - es);
      ctx.lineTo(cx - radius * 0.3 - es, cy + bob - radius * 0.2 + es);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + radius * 0.3 - es, cy + bob - radius * 0.2 - es);
      ctx.lineTo(cx + radius * 0.3 + es, cy + bob - radius * 0.2 + es);
      ctx.moveTo(cx + radius * 0.3 + es, cy + bob - radius * 0.2 - es);
      ctx.lineTo(cx + radius * 0.3 - es, cy + bob - radius * 0.2 + es);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Continue animation loop if needed or if water ripples are showing
    const hasWater = game.grid.some((t) => t === 1);
    const hasDeadPlayers = game.players.some((p) => !p.alive);
    if (needsAnim || flashActive || hasWater || hasDeadPlayers) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [game, currentPubkey]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [draw]);

  // Kick off animation loop whenever game state changes
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [game, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square max-w-[600px] mx-auto rounded-2xl shadow-lg"
      style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #dbeafe 100%)' }}
    />
  );
}
