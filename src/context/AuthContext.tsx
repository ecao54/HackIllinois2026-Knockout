import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../api';

export interface Account {
  username: string;
  displayName: string;
  wallet_id: string;
  public_key: string;
  createdAt: string;
}

interface BalanceInfo {
  sol_balance: number;
  usdc_balance: number;
}

interface AuthContextValue {
  account: Account | null;
  balance: BalanceInfo | null;
  loading: boolean;
  signup: (username: string, displayName: string) => Promise<void>;
  login: (username: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCOUNTS_KEY = 'penguin_accounts';
const ACTIVE_KEY = 'penguin_active_user';

function loadAccounts(): Record<string, Account> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, Account>) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeUser = localStorage.getItem(ACTIVE_KEY);
    if (activeUser) {
      const accounts = loadAccounts();
      const acct = accounts[activeUser];
      if (acct) {
        setAccount(acct);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!account) return;
    try {
      const wallet = await api.getWallet(account.wallet_id);
      setBalance({
        sol_balance: wallet.sol_balance ?? 0,
        usdc_balance: wallet.usdc_balance ?? 0,
      });
    } catch {
      // Silently fail — balance will show as stale
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [account, refreshBalance]);

  const signup = async (username: string, displayName: string) => {
    const accounts = loadAccounts();

    if (accounts[username.toLowerCase()]) {
      throw new Error('Username already taken. Try a different one or log in.');
    }

    const wallet = await api.createWallet();

    const acct: Account = {
      username: username.toLowerCase(),
      displayName: displayName || username,
      wallet_id: wallet.wallet_id,
      public_key: wallet.public_key,
      createdAt: new Date().toISOString(),
    };

    accounts[acct.username] = acct;
    saveAccounts(accounts);
    localStorage.setItem(ACTIVE_KEY, acct.username);
    setAccount(acct);
  };

  const login = async (username: string) => {
    const accounts = loadAccounts();
    const acct = accounts[username.toLowerCase()];

    if (!acct) {
      throw new Error('Account not found. Check your username or sign up.');
    }

    localStorage.setItem(ACTIVE_KEY, acct.username);
    setAccount(acct);
  };

  const logout = () => {
    localStorage.removeItem(ACTIVE_KEY);
    setAccount(null);
    setBalance(null);
  };

  return (
    <AuthContext.Provider value={{ account, balance, loading, signup, login, logout, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
