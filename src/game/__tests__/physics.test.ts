import { describe, it, expect } from 'vitest';
import {
  updatePhysics, resolveCircleCollision, checkEliminationOOB,
  createPenguin, penguinSpeed,
} from '../physics';
import {
  ARENA_RADIUS, DT, PENGUIN_RADIUS, FRICTION_COEFF, GRAVITY,
  V_MAX, V_MIN, DEAD_ZONE, POWER_EXPONENT,
} from '../constants';

describe('collision impulse', () => {
  it('transfers velocity from moving penguin to stationary one', () => {
    const a = createPenguin(0, -50, 0, '#f00', false);
    const b = createPenguin(1, -50 + PENGUIN_RADIUS * 2 - 2, 0, '#0f0', false);

    a.vx = 300;
    b.vx = 0;

    resolveCircleCollision(a, b);

    expect(a.vx).toBeLessThan(300);
    expect(b.vx).toBeGreaterThan(0);

    const totalBefore = 300 * a.mass;
    const totalAfter = a.vx * a.mass + b.vx * b.mass;
    expect(Math.abs(totalBefore - totalAfter)).toBeLessThan(0.01);
  });

  it('does not apply impulse to separating penguins', () => {
    const a = createPenguin(0, -50, 0, '#f00', false);
    const b = createPenguin(1, -50 + PENGUIN_RADIUS * 2 - 2, 0, '#0f0', false);

    a.vx = -100;
    b.vx = 100;
    const origAVx = a.vx;
    const origBVx = b.vx;

    const result = resolveCircleCollision(a, b);
    expect(result).toBe(false);
    expect(a.vx).toBe(origAVx);
    expect(b.vx).toBe(origBVx);
  });

  it('handles equal-mass head-on collision', () => {
    const a = createPenguin(0, -PENGUIN_RADIUS + 1, 0, '#f00', false);
    const b = createPenguin(1, PENGUIN_RADIUS - 1, 0, '#0f0', false);

    a.vx = 200;
    b.vx = -200;

    resolveCircleCollision(a, b);

    expect(a.vx).toBeLessThan(0);
    expect(b.vx).toBeGreaterThan(0);
  });
});

describe('elimination (no boundary wall)', () => {
  it('penguin on platform is safe', () => {
    const p = createPenguin(0, 100, 0, '#f00', false);
    expect(checkEliminationOOB(p)).toBe(false);
  });

  it('penguin at edge is safe (center inside)', () => {
    const p = createPenguin(0, ARENA_RADIUS, 0, '#f00', false);
    expect(checkEliminationOOB(p)).toBe(false);
  });

  it('penguin fully off the edge is eliminated', () => {
    const p = createPenguin(0, ARENA_RADIUS + PENGUIN_RADIUS + 1, 0, '#f00', false);
    expect(checkEliminationOOB(p)).toBe(true);
  });

  it('penguin partially off but center inside is safe', () => {
    const p = createPenguin(0, ARENA_RADIUS + PENGUIN_RADIUS - 1, 0, '#f00', false);
    expect(checkEliminationOOB(p)).toBe(false);
  });
});

describe('friction deceleration', () => {
  it('decelerates on the platform', () => {
    const p = createPenguin(0, 0, 0, '#f00', false);
    p.vx = 600;
    p.restFrames = 0;

    for (let i = 0; i < 60; i++) updatePhysics([p], DT);

    expect(penguinSpeed(p)).toBeLessThan(600);
    expect(penguinSpeed(p)).toBeGreaterThan(0);
  });

  it('no friction off the platform (only drag)', () => {
    const p = createPenguin(0, ARENA_RADIUS + 100, 0, '#f00', false);
    p.vx = 300;
    p.restFrames = 0;

    updatePhysics([p], DT);

    // Should barely decelerate (only drag, no friction)
    expect(p.vx).toBeGreaterThan(295);
  });

  it('clamps to zero at rest threshold', () => {
    const p = createPenguin(0, 0, 0, '#f00', false);
    p.vx = 0.3;
    p.restFrames = 0;

    updatePhysics([p], DT);

    expect(p.vx).toBe(0);
    expect(p.restFrames).toBe(1);
  });
});

describe('power curve', () => {
  it('0% power is below dead zone', () => {
    expect(0).toBeLessThanOrEqual(DEAD_ZONE);
  });

  it('100% produces V_MAX', () => {
    const t = (100 - DEAD_ZONE) / (100 - DEAD_ZONE);
    const v0 = V_MIN + (V_MAX - V_MIN) * Math.pow(t, POWER_EXPONENT);
    expect(v0).toBeCloseTo(V_MAX, 0);
  });

  it('dead zone boundary produces t=0', () => {
    const t = (DEAD_ZONE - DEAD_ZONE) / (100 - DEAD_ZONE);
    expect(t).toBe(0);
  });
});
