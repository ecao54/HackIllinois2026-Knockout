export interface Player {
  player_id: string;
  public_key: string;
  sol_balance?: number;
  usdc_balance?: number;
  stripe_onramp_session_url?: string;
}

export interface CheckoutSession {
  url: string;
  amount_usd: number;
}

export interface GamePlayer {
  pubkey: string;
  x: number;
  y: number;
  alive: boolean;
}

export interface Game {
  game_id: string;
  pda_address?: string;
  escrow_address?: string;
  status: 'waiting' | 'active' | 'resolved';
  grid_size: number;
  grid: number[];
  players: GamePlayer[];
  buy_in_usdc: string;
  max_players: number;
  prize_pool_usdc?: string;
  collapse_round?: number;
  winner?: string;
  stripe_payout_initiated?: boolean;
}

export interface JoinResult {
  game_id: string;
  player_id: string;
  start_x: number;
  start_y: number;
  status: string;
}

export interface MoveResult {
  game_id: string;
  player_id: string;
  new_x: number;
  new_y: number;
  alive: boolean;
  status: string;
  winner?: string;
  grid_snapshot: number[];
  collapse_round?: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}
