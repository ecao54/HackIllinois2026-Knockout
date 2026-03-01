export interface Wallet {
  wallet_id: string;
  public_key: string;
  sol_balance?: number;
  usdc_balance?: number;
  on_chain_usdc?: number;
  simulated_usdc?: number;
}

export interface DepositSession {
  url: string;
  amount_usd: number;
}

export interface TransferResult {
  wallet_id: string;
  before_balance: number;
  after_balance: number;
  amount_usdc: number;
  note?: string;
}

export interface WithdrawResult {
  status: string;
  wallet_id?: string;
  public_key?: string;
  amount_usdc?: number;
  remaining_balance?: number;
  confirmation_id?: string;
  settlement_mode?: string;
}

// Legacy types for grid-based game components (not used in demo flow)
export interface GamePlayer {
  player_id?: string;
  pubkey: string;
  x: number;
  y: number;
  alive: boolean;
}

export interface Game {
  game_id: string;
  status: string;
  grid_size: number;
  grid: number[];
  players: GamePlayer[];
  buy_in_usdc: string;
  max_players: number;
  prize_pool_usdc?: string;
  collapse_round?: number;
  winner?: string;
  placements?: { player_id: string; place: number }[];
  payouts?: { player_id: string; amount_usdc: string; status: string }[];
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  remediation?: string;
}
