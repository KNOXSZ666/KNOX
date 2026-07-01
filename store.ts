import { create } from 'zustand';
import { detectLanguage, LANG } from './lang';

type Lang = 'vi' | 'en';

export interface User {
  id: number;
  username: string;
  email: string;
  zalo: string;
  balance: number;
  total_spent: number;
  total_deposited: number;
  vip_level: string;
  referral_code: string;
  referred_by: string;
  is_locked: boolean;
  deposit_code: string;
  created_at: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppStore {
  user: User | null;
  isAdmin: boolean;
  lang: Lang;
  toasts: Toast[];
  setUser: (user: User | null) => void;
  setAdmin: (v: boolean) => void;
  setLang: (lang: Lang) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  t: (key: string) => string;
}

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  isAdmin: false,
  lang: detectLanguage(),
  toasts: [],
  setUser: (user: User | null) => set({ user }),
  setAdmin: (v: boolean) => set({ isAdmin: v }),
  setLang: (lang: Lang) => {
    localStorage.setItem('knox_lang', lang);
    set({ lang });
  },
  addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id: string) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  t: (key: string) => {
    const l = get().lang;
    const dict = LANG[l] as Record<string, string>;
    return dict[key] || key;
  },
}));
