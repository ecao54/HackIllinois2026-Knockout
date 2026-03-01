import { useRef, useEffect, useCallback } from 'react';
import type { Penguin, ParticleEffect } from './types';
import { ARENA_RADIUS, PENGUIN_RADIUS, MAX_DRAG_DISTANCE } from './constants';

export interface DragState {
  dragging: boolean;
  power: number;   // 0-100
  angle: number;   // radians — launch direction (opposite of drag)
  dragX: number;    // world-space drag endpoint
  dragY: number;
}

interface Props {
  penguins: Penguin[];
  particles: ParticleEffect[];
  humanId: number;
  phase: string;
  drag: DragState;
  alpha: number;
  arenaRadius: number;
  onDragStart?: (wx: number, wy: number) => void;
  onDragMove?: (wx: number, wy: number) => void;
  onDragEnd?: () => void;
}

const CANVAS_PADDING = 80;
const CANVAS_SIZE = (ARENA_RADIUS + CANVAS_PADDING) * 2;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function ArenaCanvas({
  penguins, particles, humanId, phase, drag, alpha, arenaRadius,
  onDragStart, onDragMove, onDragEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toCanvas = useCallback((worldX: number, worldY: number): [number, number] => {
    return [worldX + ARENA_RADIUS + CANVAS_PADDING, worldY + ARENA_RADIUS + CANVAS_PADDING];
  }, []);

  const toWorld = useCallback((clientX: number, clientY: number): [number, number] => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return [cx * scaleX - ARENA_RADIUS - CANVAS_PADDING, cy * scaleY - ARENA_RADIUS - CANVAS_PADDING];
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!onDragStart) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const [wx, wy] = toWorld(e.clientX, e.clientY);
    onDragStart(wx, wy);
  }, [toWorld, onDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!onDragMove) return;
    const [wx, wy] = toWorld(e.clientX, e.clientY);
    onDragMove(wx, wy);
  }, [toWorld, onDragMove]);

  const handlePointerUp = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const [cx, cy] = toCanvas(0, 0);
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // --- Water void (Arctic deep) ---
    ctx.fillStyle = '#2D3A4F';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Subtle water rings (Arctic ice)
    ctx.strokeStyle = 'rgba(184, 212, 232, 0.08)';
    ctx.lineWidth = 1;
    for (let r = arenaRadius + 30; r < ARENA_RADIUS + CANVAS_PADDING; r += 18) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // --- Platform shadow ---
    ctx.beginPath();
    ctx.arc(cx, cy + 6, arenaRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fill();

    // --- Ice surface (Arctic gradient) ---
    const iceGrad = ctx.createRadialGradient(cx - 40, cy - 40, 0, cx, cy, arenaRadius);
    iceGrad.addColorStop(0, '#F0F8FF');
    iceGrad.addColorStop(0.35, '#E8F4FC');
    iceGrad.addColorStop(1, '#B8D4E8');
    ctx.beginPath();
    ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2);
    ctx.fillStyle = iceGrad;
    ctx.fill();

    // Cracks (scale with arena)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(45, 58, 79, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const r1 = 40 + (i * 37) % 80;
      const r2 = 150 + (i * 53) % 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a + 0.15) * r2, cy + Math.sin(a + 0.15) * r2);
      ctx.stroke();
    }
    ctx.restore();

    // Edge (Arctic ice)
    ctx.beginPath();
    ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#B8D4E8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // --- Drag slingshot line ---
    const human = penguins.find(p => p.id === humanId);
    if (drag.dragging && human && human.alive && !human.lockedIn && phase === 'AIMING') {
      const [hx, hy] = toCanvas(human.x, human.y);
      const [dx, dy] = toCanvas(drag.dragX, drag.dragY);

      // Rubber band from penguin to drag point
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(dx, dy);
      ctx.strokeStyle = 'rgba(45, 58, 79, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Small circle at drag point
      ctx.beginPath();
      ctx.arc(dx, dy, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45, 58, 79, 0.35)';
      ctx.fill();

      // Launch direction arrow (opposite of drag)
      if (drag.power > 3) {
        const arrowLen = 40 + (drag.power / 100) * 80;
        const endX = hx + Math.cos(drag.angle) * arrowLen;
        const endY = hy + Math.sin(drag.angle) * arrowLen;

        // Power color: Warm Yellow → Coral Pink
        let arrowColor: string;
        if (drag.power < 50) arrowColor = 'rgba(255, 209, 102, 0.85)';
        else arrowColor = 'rgba(255, 143, 163, 0.85)';

        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Arrow tip
        const tipSize = 10;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - Math.cos(drag.angle - 0.35) * tipSize, endY - Math.sin(drag.angle - 0.35) * tipSize);
        ctx.lineTo(endX - Math.cos(drag.angle + 0.35) * tipSize, endY - Math.sin(drag.angle + 0.35) * tipSize);
        ctx.closePath();
        ctx.fillStyle = arrowColor;
        ctx.fill();

        // Power % label
        ctx.fillStyle = arrowColor;
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(drag.power)}%`, endX + Math.cos(drag.angle) * 18, endY + Math.sin(drag.angle) * 18);
      }
    }

    // --- Particles ---
    for (const pt of particles) {
      const [px, py] = toCanvas(pt.x, pt.y);
      const lifeRatio = pt.life / pt.maxLife;
      ctx.globalAlpha = lifeRatio;
      ctx.beginPath();
      ctx.arc(px, py, pt.radius * lifeRatio, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // --- Penguins ---
    const now = performance.now();
    for (const p of penguins) {
      if (!p.alive && p.eliminationOrder > 0) continue;

      const rx = lerp(p.prevX, p.x, alpha);
      const ry = lerp(p.prevY, p.y, alpha);
      const [px, py] = toCanvas(rx, ry);
      const r = PENGUIN_RADIUS;

      // Subtle idle wobble
      const wobble = Math.sin(now / 400 + p.id * 1.7) * 1.2;
      const squish = 1 + Math.sin(now / 500 + p.id * 2.3) * 0.02;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(wobble * 0.015);
      ctx.scale(1, squish);

      // Ground shadow
      ctx.beginPath();
      ctx.ellipse(0, r * 0.45, r * 0.9, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();

      // Little feet (Warm Yellow)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * r * 0.35, r * 0.38, r * 0.2, r * 0.1, side * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD166';
        ctx.fill();
      }

      // Body — Soft Navy outer
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2D3A4F';
      ctx.fill();

      // Body highlight rim
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(184, 212, 232, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // White tummy — big and round
      ctx.beginPath();
      ctx.ellipse(0, r * 0.1, r * 0.65, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fill();

      // Tummy inner glow
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.45, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fill();

      // Little flippers (slightly lighter navy)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * r * 0.85, r * 0.05, r * 0.2, r * 0.45, side * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#3d3f56';
        ctx.fill();
      }

      // Scarf / bandana
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.28, r * 0.58, r * 0.13, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // Scarf knot tail
      ctx.beginPath();
      ctx.moveTo(r * 0.35, -r * 0.22);
      ctx.quadraticCurveTo(r * 0.55, -r * 0.05, r * 0.4, r * 0.05);
      ctx.quadraticCurveTo(r * 0.3, -r * 0.05, r * 0.35, -r * 0.22);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Eyes — big sparkly
      const eyeSpread = r * 0.28;
      const eyeY = -r * 0.32;
      for (const side of [-1, 1]) {
        // White
        ctx.beginPath();
        ctx.ellipse(side * eyeSpread, eyeY, r * 0.18, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#2D3A4F';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Iris
        ctx.beginPath();
        ctx.arc(side * eyeSpread + side * 0.5, eyeY + 1, r * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = '#2D3A4F';
        ctx.fill();
        // Sparkle
        ctx.beginPath();
        ctx.arc(side * eyeSpread + side * 1.5, eyeY - 1.5, r * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Beak — contrasts with scarf if scarf is orange/yellow/red
      const isWarmScarf = ['#f97316', '#fbbf24', '#f87171'].includes(p.color);
      const beakColor = isWarmScarf ? '#2D3A4F' : '#FFD166';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.05);
      ctx.lineTo(-r * 0.15, r * 0.12);
      ctx.lineTo(r * 0.15, r * 0.12);
      ctx.closePath();
      ctx.fillStyle = beakColor;
      ctx.fill();

      // Blush cheeks (Coral Pink)
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * r * 0.42, -r * 0.12, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 143, 163, 0.35)';
        ctx.fill();
      }

      ctx.restore();

      // Lock-in / status ring (drawn outside transform)
      if (phase === 'AIMING' && p.alive) {
        if (p.lockedIn) {
          ctx.beginPath();
          ctx.arc(px, py, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('✓', px, py - r - 6);
        } else if (p.id === humanId) {
          ctx.beginPath();
          ctx.arc(px, py, r + 5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Name label
      ctx.fillStyle = p.id === humanId ? '#FFD166' : '#B8D4E8';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.isBot ? `Bot ${p.id}` : 'You', px, py + r + 16);

      // Bouncing arrow above human penguin (hidden while sliding)
      if (p.id === humanId && p.alive && phase !== 'SIMULATING') {
        const bounce = Math.sin(now / 250) * 5;
        const arrowY = py - r - 22 + bounce;
        const arrowSize = 9;

        ctx.beginPath();
        ctx.moveTo(px, arrowY + arrowSize);
        ctx.lineTo(px - arrowSize * 0.7, arrowY - arrowSize * 0.2);
        ctx.lineTo(px + arrowSize * 0.7, arrowY - arrowSize * 0.2);
        ctx.closePath();
        ctx.fillStyle = '#FFD166';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [penguins, particles, humanId, phase, drag, alpha, arenaRadius, toCanvas]);

  return (
    <div ref={containerRef} className="relative w-full aspect-square max-w-[700px] mx-auto touch-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl"
        style={{ imageRendering: 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
