import type { GameState, Penguin, LaunchInput, ParticleEffect } from './types';
import {
  ARENA_RADIUS, ARENA_SHRINK, SHRINK_DURATION, SPAWN_RADIUS, DT, V_REST, REST_FRAMES,
  V_MAX, V_MIN, DEAD_ZONE, POWER_EXPONENT,
  AIM_DURATION, ROUND_END_DURATION, MAX_SETTLE_TIME,
  AUTO_FIRE_IDLE_POWER, SCARF_COLORS, PENGUIN_RADIUS,

} from './constants';
import { mulberry32, seededShuffle } from './rng';
import { updatePhysics, detectAndResolveCollisions, allSettled, createPenguin, penguinSpeed, checkEliminationOOB } from './physics';
import { botAim, botThinkDelay } from './bot';

export interface MatchPlacement {
  penguinId: number;
  place: number;
}

export type EngineEvent =
  | { type: 'launch'; penguinId: number; vx: number; vy: number }
  | { type: 'allLaunch' }
  | { type: 'eliminated'; penguinId: number }
  | { type: 'roundStart'; round: number }
  | { type: 'roundEnd' }
  | { type: 'gameOver'; winnerId: number | null; placements: MatchPlacement[] }
  | { type: 'settled' };

export class KnockoutEngine {
  state: GameState;
  particles: ParticleEffect[] = [];
  private accumulator = 0;
  private eventQueue: EngineEvent[] = [];
  private listeners: Array<(e: EngineEvent) => void> = [];
  private countdownRemaining: number;
  private roundEndTimer = 0;
  private shrinkFrom = 0;
  private shrinkTo = 0;
  private shrinkElapsed = 0;
  private isShrinking = false;

  constructor(numPlayers: number, numBots: number, seed?: number) {
    const gameSeed = seed ?? Date.now();
    const rng = mulberry32(gameSeed);

    const totalPlayers = numPlayers + numBots;
    const penguins: Penguin[] = [];

    for (let i = 0; i < totalPlayers; i++) {
      const angle = (2 * Math.PI * i) / totalPlayers;
      const x = SPAWN_RADIUS * Math.cos(angle);
      const y = SPAWN_RADIUS * Math.sin(angle);
      const color = SCARF_COLORS[i % SCARF_COLORS.length];
      const isBot = i >= numPlayers;
      penguins.push(createPenguin(i, x, y, color, isBot));
    }

    const ids = penguins.map(p => p.id);
    const turnOrder = seededShuffle(ids, rng);

    this.countdownRemaining = 3;

    this.state = {
      penguins,
      turnOrder,
      currentTurnIdx: 0,
      phase: 'COUNTDOWN',
      turnTimer: AIM_DURATION,
      settleTimer: 0,
      seed: gameSeed,
      rng,
      round: 0,
      arenaRadius: ARENA_RADIUS,
      eliminationCounter: 0,
      winner: null,
    };
  }

  on(listener: (e: EngineEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit(event: EngineEvent): void {
    this.eventQueue.push(event);
    for (const l of this.listeners) l(event);
  }

  get aliveCount(): number {
    return this.state.penguins.filter(p => p.alive).length;
  }

  get alivePenguins(): Penguin[] {
    return this.state.penguins.filter(p => p.alive);
  }

  get allLockedIn(): boolean {
    return this.alivePenguins.every(p => p.lockedIn);
  }

  get humanPenguin(): Penguin {
    return this.state.penguins[0];
  }

  drainEvents(): EngineEvent[] {
    const events = this.eventQueue.slice();
    this.eventQueue = [];
    return events;
  }

  tick(realDt: number): void {
    if (this.state.phase === 'GAME_OVER') return;

    if (this.state.phase === 'COUNTDOWN') {
      this.countdownRemaining -= realDt;
      if (this.countdownRemaining <= 0) {
        this.startAimPhase();
      }
      return;
    }

    if (this.state.phase === 'ROUND_END') {
      this.roundEndTimer -= realDt;
      this.updateParticles(realDt);

      // Animate arena shrink during the first SHRINK_DURATION seconds
      if (this.isShrinking) {
        this.shrinkElapsed += realDt;
        const t = Math.min(1, this.shrinkElapsed / SHRINK_DURATION);
        const eased = t * (2 - t); // ease-out quad
        this.state.arenaRadius = this.shrinkFrom + (this.shrinkTo - this.shrinkFrom) * eased;

        // Push penguins inward as the circle contracts
        const safeRadius = this.state.arenaRadius - PENGUIN_RADIUS - 2;
        for (const p of this.alivePenguins) {
          const dist = Math.sqrt(p.x * p.x + p.y * p.y);
          if (dist > safeRadius && safeRadius > 0) {
            const scale = safeRadius / Math.max(dist, 0.001);
            p.x *= scale;
            p.y *= scale;
            p.prevX = p.x;
            p.prevY = p.y;
          }
        }

        if (t >= 1) this.isShrinking = false;
      }

      if (this.roundEndTimer <= 0) {
        if (this.aliveCount <= 1) {
          this.endMatch();
        } else {
          this.startAimPhase();
        }
      }
      return;
    }

    const frameTime = Math.min(realDt, 0.1);
    this.accumulator += frameTime;

    while (this.accumulator >= DT) {
      this.fixedUpdate(DT);
      this.accumulator -= DT;
    }
  }

  get countdownValue(): number {
    return Math.ceil(Math.max(0, this.countdownRemaining));
  }

  get roundEndCountdown(): number {
    return Math.ceil(Math.max(0, this.roundEndTimer));
  }

  get interpolationAlpha(): number {
    return this.accumulator / DT;
  }

  // --- Public API for human player ---

  /** Human player locks in their launch. */
  lockIn(input: LaunchInput): void {
    const { state } = this;
    if (state.phase !== 'AIMING') return;
    const human = this.humanPenguin;
    if (!human.alive || human.lockedIn) return;

    human.lockedIn = true;
    human.queuedLaunch = input;
  }

  // --- Internal ---

  private startAimPhase(): void {
    const { state } = this;
    state.round++;
    state.phase = 'AIMING';
    state.turnTimer = AIM_DURATION;

    // Reset lock-in for all alive penguins
    for (const p of state.penguins) {
      p.lockedIn = false;
      p.queuedLaunch = null;
    }

    // Set bot think timers
    for (const p of this.alivePenguins) {
      if (p.isBot) {
        p.botThinkTimer = botThinkDelay(state.rng);
      }
    }

    this.emit({ type: 'roundStart', round: state.round });
  }

  private fixedUpdate(dt: number): void {
    const { state } = this;

    if (state.phase === 'AIMING') {
      state.turnTimer -= dt;

      // Bots think and lock in
      for (const p of this.alivePenguins) {
        if (!p.isBot || p.lockedIn) continue;
        p.botThinkTimer -= dt;
        if (p.botThinkTimer <= 0) {
          const input = botAim(p, state.penguins, state.rng);
          p.lockedIn = true;
          p.queuedLaunch = input;
        }
      }

      // If everyone locked in or timer expired → fire all
      if (this.allLockedIn || state.turnTimer <= 0) {
        this.fireAll();
      }

    } else if (state.phase === 'SIMULATING') {
      state.settleTimer += dt;

      let maxSpeed = 0;
      for (const p of state.penguins) {
        if (!p.alive) continue;
        const s = penguinSpeed(p);
        if (s > maxSpeed) maxSpeed = s;
      }

      let substeps = 1;
      if (maxSpeed * dt > PENGUIN_RADIUS) {
        substeps = Math.ceil(maxSpeed * dt / PENGUIN_RADIUS);
      }

      const subDt = dt / substeps;
      for (let s = 0; s < substeps; s++) {
        updatePhysics(state.penguins, subDt, state.arenaRadius);
        detectAndResolveCollisions(state.penguins);
      }

      this.checkEliminations();

      const isSettled = allSettled(state.penguins, REST_FRAMES);

      if (isSettled || state.settleTimer > MAX_SETTLE_TIME) {
        if (state.settleTimer > MAX_SETTLE_TIME) {
          this.forceSettle();
        }
        this.emit({ type: 'settled' });

        if (this.aliveCount <= 1) {
          this.endMatch();
        } else {
          // Start round-end cooldown + begin shrink animation
          state.phase = 'ROUND_END';
          this.roundEndTimer = ROUND_END_DURATION;

          this.shrinkFrom = state.arenaRadius;
          this.shrinkTo = state.arenaRadius * ARENA_SHRINK;
          this.shrinkElapsed = 0;
          this.isShrinking = true;

          this.emit({ type: 'roundEnd' });
        }
      }

      this.updateParticles(dt);
    }
  }

  private fireAll(): void {
    const { state } = this;

    // Auto-assign launches for anyone who didn't lock in
    for (const p of this.alivePenguins) {
      if (!p.lockedIn) {
        const angle = state.rng() * Math.PI * 2;
        p.queuedLaunch = { power: AUTO_FIRE_IDLE_POWER, angle };
        p.lockedIn = true;
      }
    }

    // Apply all launches simultaneously
    for (const p of this.alivePenguins) {
      const input = p.queuedLaunch;
      if (!input || input.power <= DEAD_ZONE) continue;

      const t = Math.max(0, Math.min(1, (input.power - DEAD_ZONE) / (100 - DEAD_ZONE)));
      const v0 = V_MIN + (V_MAX - V_MIN) * Math.pow(t, POWER_EXPONENT);

      p.vx = v0 * Math.cos(input.angle);
      p.vy = v0 * Math.sin(input.angle);
      p.restFrames = 0;

      this.emit({ type: 'launch', penguinId: p.id, vx: p.vx, vy: p.vy });
      this.spawnLaunchParticles(p);
    }

    this.emit({ type: 'allLaunch' });
    state.phase = 'SIMULATING';
    state.settleTimer = 0;
  }

  private checkEliminations(): void {
    for (const p of this.state.penguins) {
      if (!p.alive) continue;
      if (checkEliminationOOB(p, this.state.arenaRadius)) {
        p.alive = false;
        this.state.eliminationCounter++;
        p.eliminationOrder = this.state.eliminationCounter;
        this.emit({ type: 'eliminated', penguinId: p.id });
        this.spawnEliminationParticles(p);
      }
    }
  }

  private forceSettle(): void {
    for (const p of this.state.penguins) {
      if (!p.alive) continue;
      p.vx = 0;
      p.vy = 0;
      p.restFrames = REST_FRAMES;
    }
  }

  private endMatch(): void {
    const alive = this.state.penguins.filter(p => p.alive);
    if (alive.length === 1) {
      this.state.winner = alive[0].id;
    } else if (alive.length === 0) {
      const eliminated = this.state.penguins
        .filter(p => p.eliminationOrder === this.state.eliminationCounter)
        .sort((a, b) => {
          const da = Math.sqrt(a.x * a.x + a.y * a.y);
          const db = Math.sqrt(b.x * b.x + b.y * b.y);
          return da - db;
        });
      this.state.winner = eliminated.length > 0 ? eliminated[0].id : null;
    } else {
      this.state.winner = alive[0].id;
    }

    const placements = this.computePlacements();
    this.state.phase = 'GAME_OVER';
    this.emit({ type: 'gameOver', winnerId: this.state.winner, placements });
  }

  private computePlacements(): MatchPlacement[] {
    const penguins = this.state.penguins;
    const sorted = [...penguins].sort((a, b) => {
      if (a.alive !== b.alive) return a.alive ? -1 : 1;
      return (b.eliminationOrder ?? 0) - (a.eliminationOrder ?? 0);
    });
    return sorted.map((p, i) => ({ penguinId: p.id, place: i + 1 }));
  }

  // ---- Particle effects ----

  private spawnLaunchParticles(p: Penguin): void {
    for (let i = 0; i < 8; i++) {
      const angle = this.state.rng() * Math.PI * 2;
      const speed = 30 + this.state.rng() * 60;
      this.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.4 + this.state.rng() * 0.3, maxLife: 0.7,
        radius: 2 + this.state.rng() * 3, color: '#CDEBFF',
      });
    }
  }

  private spawnEliminationParticles(p: Penguin): void {
    for (let i = 0; i < 12; i++) {
      const angle = this.state.rng() * Math.PI * 2;
      const speed = 40 + this.state.rng() * 80;
      this.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.5 + this.state.rng() * 0.5, maxLife: 1.0,
        radius: 3 + this.state.rng() * 4, color: p.color,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.95;
      pt.vy *= 0.95;
    }
  }
}
