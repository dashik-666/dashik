import { defineStore } from 'pinia';
import { api, Member, TOKEN_KEY, MEMBER_KEY } from '@/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    member: null as Member | null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    nickname: (state) => state.member?.nickname || '玩家',
  },
  actions: {
    setSession(data: any) {
      this.token = data.accessToken || '';
      this.member = data.member || null;
      if (data.accessToken) localStorage.setItem(TOKEN_KEY, data.accessToken);
      if (data.member) localStorage.setItem(MEMBER_KEY, JSON.stringify(data.member));
    },
    async login(phone: string, password: string) {
      const data = await api.login({ phone, password });
      this.setSession(data);
      return data;
    },
    async register(payload: { phone: string; password: string; nickname: string; game_id?: string }) {
      const data = await api.register(payload);
      this.setSession(data);
      return data;
    },
    async fetchMe() {
      if (!this.token) return;
      try {
        this.member = await api.me();
        localStorage.setItem(MEMBER_KEY, JSON.stringify(this.member));
      } catch {
        /* ignore */
      }
    },
    logout() {
      this.token = '';
      this.member = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
    },
  },
});
