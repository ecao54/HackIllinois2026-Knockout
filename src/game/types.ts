export interface Penguin {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  prevX: number;
  prevY: number;
  radius: number;
  mass: number;
  alive: boolean;
  restFrames: number;
  color: string;
  isBot: boolean;
  botThinkTimer: number;
  eliminationOrder: number;
  lockedIn: boolean; // has this penguin committed a launch for this round?
  queuedLaunch: LaunchInput | null; // stored until all players lock in
}

export type GamePhase = 'COUNTDOWN' | 'AIMING' | 'SIMULATING' | 'ROUND_END' | 'GAME_OVER';

export interface LaunchInput {
  power: number; // 0-100
  angle: number; // radians
}

export interface GameState {
  penguins: Penguin[];
  turnOrder: number[];
  currentTurnIdx: number;
  phase: GamePhase;
  turnTimer: number;
  settleTimer: number;
  seed: number;
  rng: () => number;
  round: number;
  arenaRadius: number;
  eliminationCounter: number;
  winner: number | null;
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}
