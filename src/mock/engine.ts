import { v4 as uuidv4 } from 'uuid';
import type { Game, GamePlayer } from '../types';

const GRID_SIZE = 10;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const DIRECTIONS: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickSpawnPositions(count: number, grid: number[]): [number, number][] {
  const safe: [number, number][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y * GRID_SIZE + x] === 0) safe.push([x, y]);
    }
  }

  // Spread players around the edges for a fair start
  const corners: [number, number][] = [
    [1, 1], [8, 1], [1, 8], [8, 8],
    [4, 0], [0, 4], [9, 4], [4, 9],
    [0, 0], [9, 9],
  ];
  const positions: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    if (i < corners.length) {
      positions.push(corners[i]);
    } else {
      positions.push(safe[randomInt(0, safe.length - 1)]);
    }
  }
  return positions;
}

export class MockGameEngine {
  game: Game;
  playerPubkey: string;
  private moveCount = 0;
  private aiInterval: ReturnType<typeof setInterval> | null = null;
  private collapseInterval: ReturnType<typeof setInterval> | null = null;
  private onUpdate: (game: Game) => void;

  constructor(maxPlayers: number, buyIn: string, onUpdate: (game: Game) => void) {
    this.onUpdate = onUpdate;
    this.playerPubkey = 'player_' + uuidv4().slice(0, 8);

    const grid = new Array(TOTAL_TILES).fill(0);
    const spawns = pickSpawnPositions(maxPlayers, grid);

    const players: GamePlayer[] = spawns.map((pos, i) => ({
      pubkey: i === 0 ? this.playerPubkey : `bot_${i}_${uuidv4().slice(0, 6)}`,
      x: pos[0],
      y: pos[1],
      alive: true,
    }));

    this.game = {
      game_id: 'mock_' + uuidv4().slice(0, 8),
      status: 'active',
      grid_size: GRID_SIZE,
      grid,
      players,
      buy_in_usdc: buyIn,
      max_players: maxPlayers,
      prize_pool_usdc: (parseFloat(buyIn) * maxPlayers).toFixed(2),
      collapse_round: 0,
    };

    this.startAI();
    this.startCollapses();
  }

  private startCollapses() {
    // Collapse tiles periodically, escalating over time
    this.collapseInterval = setInterval(() => {
      if (this.game.status !== 'active') return;

      const round = (this.game.collapse_round ?? 0) + 1;
      this.game.collapse_round = round;

      // Number of tiles to collapse scales with round
      const count = Math.min(round + 1, 6);
      this.collapseTiles(count);

      // Kill players on collapsed tiles
      this.checkEliminations();
      this.checkWinner();

      this.onUpdate({ ...this.game });
    }, 3500);
  }

  private collapseTiles(count: number) {
    const safeTiles: number[] = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      if (this.game.grid[i] === 0) safeTiles.push(i);
    }

    // Avoid collapsing tiles with alive players on them (give a chance)
    const playerTiles = new Set(
      this.game.players
        .filter((p) => p.alive)
        .map((p) => p.y * GRID_SIZE + p.x),
    );

    // Prefer non-player tiles, but if the board is tight, allow player tiles
    const preferred = safeTiles.filter((t) => !playerTiles.has(t));
    const pool = preferred.length >= count ? preferred : safeTiles;

    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = randomInt(0, pool.length - 1);
      this.game.grid[pool[idx]] = 1;
      pool.splice(idx, 1);
    }
  }

  private checkEliminations() {
    for (const player of this.game.players) {
      if (!player.alive) continue;
      const tileIdx = player.y * GRID_SIZE + player.x;
      if (this.game.grid[tileIdx] === 1) {
        player.alive = false;
      }
    }
  }

  private checkWinner() {
    const alive = this.game.players.filter((p) => p.alive);
    if (alive.length <= 1) {
      this.game.status = 'resolved';
      this.game.winner = alive.length === 1 ? alive[0].pubkey : undefined;
      this.stop();
    }
  }

  private startAI() {
    this.aiInterval = setInterval(() => {
      if (this.game.status !== 'active') return;

      // Each bot makes a move
      for (const player of this.game.players) {
        if (!player.alive || player.pubkey === this.playerPubkey) continue;

        // Simple AI: move toward center if far, otherwise move randomly away from collapsed tiles
        const dirs = Object.entries(DIRECTIONS);
        const safeMoves: [string, number, number][] = [];

        for (const [, [dx, dy]] of dirs) {
          const nx = player.x + dx;
          const ny = player.y + dy;
          if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
          if (this.game.grid[ny * GRID_SIZE + nx] === 1) continue;
          // Don't move onto another player
          const occupied = this.game.players.some(
            (p) => p.alive && p.pubkey !== player.pubkey && p.x === nx && p.y === ny,
          );
          if (occupied) continue;
          safeMoves.push([, nx, ny] as unknown as [string, number, number]);
        }

        if (safeMoves.length > 0) {
          // Prefer moves toward center or away from edges
          const centerX = GRID_SIZE / 2;
          const centerY = GRID_SIZE / 2;
          safeMoves.sort((a, b) => {
            const distA = Math.abs(a[1] - centerX) + Math.abs(a[2] - centerY);
            const distB = Math.abs(b[1] - centerX) + Math.abs(b[2] - centerY);
            return distA - distB;
          });

          // 60% chance to move toward center, 40% random
          const move = Math.random() < 0.6 ? safeMoves[0] : safeMoves[randomInt(0, safeMoves.length - 1)];
          player.x = move[1];
          player.y = move[2];
        }
      }

      this.onUpdate({ ...this.game });
    }, 1200);
  }

  movePlayer(direction: 'up' | 'down' | 'left' | 'right'): {
    success: boolean;
    error?: string;
    errorCode?: string;
  } {
    if (this.game.status !== 'active') {
      return { success: false, error: 'Game is not active', errorCode: 'GAME_NOT_ACTIVE' };
    }

    const player = this.game.players.find((p) => p.pubkey === this.playerPubkey);
    if (!player || !player.alive) {
      return { success: false, error: "You've been eliminated!", errorCode: 'PLAYER_ELIMINATED' };
    }

    const [dx, dy] = DIRECTIONS[direction];
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
      return { success: false, error: "Can't move off the grid!", errorCode: 'OUT_OF_BOUNDS' };
    }

    if (this.game.grid[ny * GRID_SIZE + nx] === 1) {
      return { success: false, error: "Can't move there — that tile collapsed!", errorCode: 'TILE_IS_LAVA' };
    }

    player.x = nx;
    player.y = ny;
    this.moveCount++;

    // After every few player moves, do a small extra collapse for pressure
    if (this.moveCount % 4 === 0) {
      this.collapseTiles(1);
    }

    this.checkEliminations();
    this.checkWinner();
    this.onUpdate({ ...this.game });

    return { success: true };
  }

  stop() {
    if (this.aiInterval) clearInterval(this.aiInterval);
    if (this.collapseInterval) clearInterval(this.collapseInterval);
    this.aiInterval = null;
    this.collapseInterval = null;
  }
}
