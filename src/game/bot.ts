import type { Penguin, LaunchInput } from './types';
import { ARENA_RADIUS } from './constants';

export function botAim(
  bot: Penguin,
  allPenguins: Penguin[],
  rng: () => number,
): LaunchInput {
  let nearest: Penguin | null = null;
  let nearestDist = Infinity;

  for (const p of allPenguins) {
    if (p.id === bot.id || !p.alive) continue;
    const dx = p.x - bot.x;
    const dy = p.y - bot.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = p;
    }
  }

  if (!nearest) return { power: 0, angle: 0 };

  let angle = Math.atan2(nearest.y - bot.y, nearest.x - bot.x);

  // Inaccuracy: ±15 degrees
  angle += (rng() - 0.5) * (Math.PI / 6);

  let idealPower = nearestDist / ARENA_RADIUS;
  idealPower = Math.max(0.2, Math.min(0.9, idealPower));

  let power = idealPower + (rng() - 0.5) * 0.15;
  power = Math.max(0.15, Math.min(0.95, power));

  return { power: power * 100, angle };
}

export function botThinkDelay(rng: () => number): number {
  return 1.0 + rng() * 2.0;
}
