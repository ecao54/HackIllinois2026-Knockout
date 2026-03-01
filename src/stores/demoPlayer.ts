const STORAGE_KEY = 'demo_wallet_id';

export function getWalletId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setWalletId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
}

export function clearWalletId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
