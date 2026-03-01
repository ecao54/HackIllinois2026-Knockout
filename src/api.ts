import type { Player, CheckoutSession, Game, JoinResult, MoveResult } from './types';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const error = Object.assign(new Error(body.message || res.statusText), {
        code: body.code || 'UNKNOWN',
        status: res.status,
      });
      throw error;
    }

    return res.json();
  }

  async createPlayer(): Promise<Player> {
    return this.request<Player>('/v1/players', { method: 'POST' });
  }

  async getPlayer(playerId: string): Promise<Player> {
    return this.request<Player>(`/v1/players/${playerId}`);
  }

  async createCheckoutSession(
    playerId: string,
    amountUsd: number,
    successUrl: string,
    cancelUrl: string,
  ): Promise<CheckoutSession> {
    return this.request<CheckoutSession>(
      `/v1/players/${playerId}/checkout-session`,
      {
        method: 'POST',
        body: JSON.stringify({
          amount_usd: amountUsd,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      },
    );
  }

  async createGame(buyInUsdc: string, maxPlayers: number): Promise<Game> {
    return this.request<Game>('/v1/games', {
      method: 'POST',
      body: JSON.stringify({
        buy_in_usdc: buyInUsdc,
        max_players: maxPlayers,
      }),
    });
  }

  async getGame(gameId: string): Promise<Game> {
    return this.request<Game>(`/v1/games/${gameId}`);
  }

  async joinGame(gameId: string, playerId: string): Promise<JoinResult> {
    return this.request<JoinResult>(`/v1/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Idempotency-Key': uuidv4() },
      body: JSON.stringify({ player_id: playerId }),
    });
  }

  async move(
    gameId: string,
    playerId: string,
    direction: 'up' | 'down' | 'left' | 'right',
  ): Promise<MoveResult> {
    return this.request<MoveResult>(`/v1/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Idempotency-Key': uuidv4() },
      body: JSON.stringify({ player_id: playerId, direction }),
    });
  }
}

export const api = new ApiClient(API_URL, API_KEY);
