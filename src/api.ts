import type { Wallet, DepositSession, TransferResult, WithdrawResult } from './types';
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Could not reach server. Check VITE_API_URL and that the API is running.');
      }
      throw err;
    }
    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const nested = body.error ?? {};
      const error = Object.assign(
        new Error(nested.message || body.message || res.statusText),
        {
          code: nested.code || body.code || 'UNKNOWN',
          status: body.statusCode || res.status,
          remediation: nested.remediation,
        },
      );
      throw error;
    }

    return res.json();
  }

  async createWallet(): Promise<Wallet> {
    return this.request<Wallet>('/v1/wallets', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getWallet(walletId: string): Promise<Wallet> {
    return this.request<Wallet>(`/v1/wallets/${walletId}`);
  }

  async deposit(walletId: string, redirectUrl: string, amountUsd?: number): Promise<DepositSession> {
    return this.request<DepositSession>(`/v1/wallets/${walletId}/deposit`, {
      method: 'POST',
      body: JSON.stringify({
        redirect_url: redirectUrl,
        ...(amountUsd != null && { amount_usd: amountUsd }),
      }),
    });
  }

  async transfer(walletId: string, amountUsdc: number, note?: string): Promise<TransferResult> {
    return this.request<TransferResult>(`/v1/wallets/${walletId}/transfer`, {
      method: 'POST',
      headers: { 'Idempotency-Key': uuidv4() },
      body: JSON.stringify({
        amount_usdc: amountUsdc,
        ...(note && { note }),
      }),
    });
  }

  async withdraw(walletId: string, amountUsdc?: number): Promise<WithdrawResult> {
    const body = amountUsdc != null ? { amount_usdc: amountUsdc } : {};
    return this.request<WithdrawResult>(`/v1/wallets/${walletId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient(API_URL, API_KEY);
