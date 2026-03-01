import type { Penguin } from './types';
import {
  FRICTION_COEFF, GRAVITY, DRAG_COEFF, V_REST, RESTITUTION,
  ARENA_RADIUS, PENGUIN_RADIUS, MAX_SPEED,
} from './constants';

export function updatePhysics(penguins: Penguin[], dt: number, arenaRadius = ARENA_RADIUS): void {
  for (const p of penguins) {
    if (!p.alive) continue;

    p.prevX = p.x;
    p.prevY = p.y;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

    if (speed < V_REST) {
      p.vx = 0;
      p.vy = 0;
      p.restFrames++;
      continue;
    }

    p.restFrames = 0;

    const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y);
    const onPlatform = distFromCenter <= arenaRadius;

    const friction = onPlatform ? FRICTION_COEFF * GRAVITY : 0;
    const drag = DRAG_COEFF * speed * speed / p.mass;
    const totalDecel = friction + drag;
    let newSpeed = speed - totalDecel * dt;
    if (newSpeed < 0) newSpeed = 0;

    if (newSpeed > MAX_SPEED) newSpeed = MAX_SPEED;

    const scale = newSpeed / speed;
    p.vx *= scale;
    p.vy *= scale;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function resolveCircleCollision(a: Penguin, b: Penguin): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let distSq = dx * dx + dy * dy;
  const minDist = a.radius + b.radius;

  if (distSq >= minDist * minDist) return false;

  let ndx = dx;
  let ndy = dy;
  if (distSq === 0) {
    ndx = 1;
    ndy = 0;
    distSq = 1;
  }

  const dist = Math.sqrt(distSq);
  const nx = ndx / dist;
  const ny = ndy / dist;

  const dvn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;

  if (dvn < 0) return false;

  const invMassSum = 1 / a.mass + 1 / b.mass;
  const j = -(1 + RESTITUTION) * dvn / invMassSum;

  a.vx += (j / a.mass) * nx;
  a.vy += (j / a.mass) * ny;
  b.vx -= (j / b.mass) * nx;
  b.vy -= (j / b.mass) * ny;

  const overlap = minDist - dist;
  const correction = overlap / 2 + 0.5;
  a.x -= correction * nx;
  a.y -= correction * ny;
  b.x += correction * nx;
  b.y += correction * ny;

  return true;
}

/** No boundary wall — penguins slide freely off the edge. */
export function checkEliminationOOB(p: Penguin, arenaRadius = ARENA_RADIUS): boolean {
  const distFromCenter = Math.sqrt(p.x * p.x + p.y * p.y);
  return distFromCenter > arenaRadius + p.radius;
}

export function detectAndResolveCollisions(penguins: Penguin[]): boolean {
  let hadCollision = false;
  const iterations = 3;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < penguins.length; i++) {
      if (!penguins[i].alive) continue;

      for (let j = i + 1; j < penguins.length; j++) {
        if (!penguins[j].alive) continue;
        if (resolveCircleCollision(penguins[i], penguins[j])) {
          hadCollision = true;
        }
      }
      // No boundary collision — penguins fly off freely
    }
  }

  return hadCollision;
}

export function allSettled(penguins: Penguin[], restThreshold: number): boolean {
  for (const p of penguins) {
    if (!p.alive) continue;
    if (p.restFrames < restThreshold) return false;
  }
  return true;
}

export function penguinSpeed(p: Penguin): number {
  return Math.sqrt(p.vx * p.vx + p.vy * p.vy);
}

export function distanceFromCenter(p: Penguin): number {
  return Math.sqrt(p.x * p.x + p.y * p.y);
}

export function createPenguin(
  id: number, x: number, y: number, color: string, isBot: boolean,
): Penguin {
  return {
    id, x, y, vx: 0, vy: 0, prevX: x, prevY: y,
    radius: PENGUIN_RADIUS, mass: 1.0,
    alive: true, restFrames: 9999,
    color, isBot, botThinkTimer: 0,
    eliminationOrder: 0,
    lockedIn: false, queuedLaunch: null,
  };
}
