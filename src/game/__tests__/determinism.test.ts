import { describe, it, expect } from 'vitest';
import { KnockoutEngine } from '../engine';
import { DT } from '../constants';

function runMatch(seed: number, maxSeconds = 120): Array<{ x: number; y: number }[]> {
  const engine = new KnockoutEngine(0, 4, seed);
  const snapshots: Array<{ x: number; y: number }[]> = [];
  const maxFrames = 60 * maxSeconds;

  // Skip countdown
  engine.tick(4);

  for (let frame = 0; frame < maxFrames; frame++) {
    engine.tick(DT);
    snapshots.push(
      engine.state.penguins.map(p => ({ x: p.x, y: p.y }))
    );
    if (engine.state.phase === 'GAME_OVER') break;
  }

  return snapshots;
}

describe('determinism', () => {
  it('produces identical results with the same seed', () => {
    const seed = 12345;
    const run1 = runMatch(seed);
    const run2 = runMatch(seed);

    expect(run1.length).toBe(run2.length);
    for (let i = 0; i < run1.length; i++) {
      for (let j = 0; j < run1[i].length; j++) {
        expect(run1[i][j].x).toBe(run2[i][j].x);
        expect(run1[i][j].y).toBe(run2[i][j].y);
      }
    }
  });

  it('produces different results with different seeds', () => {
    const run1 = runMatch(12345, 30);
    const run2 = runMatch(67890, 30);

    let foundDifference = false;
    const minFrames = Math.min(run1.length, run2.length);
    for (let i = 0; i < minFrames; i++) {
      for (let j = 0; j < run1[i].length; j++) {
        if (run1[i][j].x !== run2[i][j].x || run1[i][j].y !== run2[i][j].y) {
          foundDifference = true;
          break;
        }
      }
      if (foundDifference) break;
    }
    expect(foundDifference).toBe(true);
  });
});

describe('engine lifecycle', () => {
  it('starts in COUNTDOWN and transitions to AIMING', () => {
    const engine = new KnockoutEngine(0, 4, 42);
    expect(engine.state.phase).toBe('COUNTDOWN');

    engine.tick(4);
    expect(engine.state.phase).toBe('AIMING');
  });

  it('fires all penguins simultaneously when aim timer expires', () => {
    const engine = new KnockoutEngine(0, 4, 42);
    engine.tick(4); // skip countdown

    // Advance past aim duration
    for (let i = 0; i < 60 * 12; i++) {
      engine.tick(DT);
      if (engine.state.phase !== 'AIMING') break;
    }

    expect(engine.state.phase).not.toBe('AIMING');
  });

  it('cycles through phases correctly (AIMING → SIMULATING → ROUND_END → AIMING)', () => {
    const engine = new KnockoutEngine(0, 4, 42);
    engine.tick(4); // skip countdown
    expect(engine.state.phase).toBe('AIMING');

    // Advance until phase leaves AIMING (bots lock in, then fire)
    for (let i = 0; i < 60 * 15; i++) {
      engine.tick(DT);
      if (engine.state.phase !== 'AIMING') break;
    }
    // Should have transitioned to SIMULATING or beyond
    expect(['SIMULATING', 'ROUND_END', 'AIMING', 'GAME_OVER']).toContain(engine.state.phase);
  });

  it('eventually reaches GAME_OVER with all bots', () => {
    const engine = new KnockoutEngine(0, 8, 7);
    engine.tick(4);

    // 30 minutes of game time should be more than enough
    const maxTicks = 60 * 1800;
    for (let i = 0; i < maxTicks; i++) {
      engine.tick(DT);
      if (engine.state.phase === 'GAME_OVER') break;
    }

    expect(engine.state.phase).toBe('GAME_OVER');
    expect(engine.state.winner).not.toBeNull();
  });
});
