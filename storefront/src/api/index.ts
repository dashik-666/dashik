import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:10000/api/v1/store';

export const TOKEN_KEY = 'lele_token';
export const MEMBER_KEY = 'lele_member';

export interface WorkerPackage {
  key: string;
  name: string;
  hours: number;
  price: number;
  note: string;
}

export interface WorkerItem {
  id: number;
  name: string;
  type: string;
  level: string;
  price_hour: number;
  status: string;
  skills: string[];
  remark: string;
  real_name: string;
  phone: string;
  wechat_id: string;
  reviewCount: number;
  avgRating: number;
  packages: WorkerPackage[];
}

export interface Member {
  id: number;
  username: string;
  nickname: string;
  phone: string;
  game_id?: string;
  avatar?: string;
  balance: number;
  total_recharge: number;
  total_consume: number;
  status: string;
}

export interface OrderItem {
  id: number;
  orderNo: string;
  memberId: number;
  worker: { id: number; name: string; type: string; level: string } | null;
  duration: number;
  price_origin: number;
  discount: number;
  price_final: number;
  status: string;
  statusText: string;
  pay_method: string;
  remark: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface ReviewItem {
  id: number;
  orderId: number;
  rating: number;
  content: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

export interface ApiResp<T> {
  code: string;
  msg: string;
  data: T;
}

const client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    cfg.headers = cfg.headers || {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

client.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401 && error.config && !error.config.url?.includes('/login')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(MEMBER_KEY);
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function unwrap<T>(resp: { data: ApiResp<T> }): T {
  const body = resp.data;
  if (body.code !== '00000') {
    throw new Error(body.msg || '请求失败');
  }
  return body.data;
}

export const api = {
  async getTypes(): Promise<string[]> {
    return unwrap(await client.get('/types'));
  },
  async getWorkers(type?: string, keyword?: string): Promise<WorkerItem[]> {
    return unwrap(await client.get('/workers', { params: { type, keyword } }));
  },
  async getWorker(id: number): Promise<WorkerItem> {
    return unwrap(await client.get(`/workers/${id}`));
  },
  async register(payload: { phone: string; password: string; nickname?: string; game_id?: string }) {
    return unwrap(await client.post('/register', payload));
  },
  async login(payload: { phone: string; password: string }) {
    return unwrap(await client.post('/login', payload));
  },
  async me(): Promise<Member> {
    return unwrap(await client.get('/me'));
  },
  async createOrder(payload: { worker_id: number; duration: number; remark?: string; game_id?: string; package_name?: string; package_key?: string }) {
    return unwrap(await client.post('/orders', payload));
  },
  async myOrders(): Promise<OrderItem[]> {
    return unwrap(await client.get('/orders'));
  },
  async getOrder(id: number | string): Promise<OrderItem> {
    return unwrap(await client.get(`/orders/${id}`));
  },
  async cancelOrder(id: number) {
    return unwrap(await client.post(`/orders/${id}/cancel`, {}));
  },
  async workerReviews(id: number): Promise<ReviewItem[]> {
    return unwrap(await client.get(`/workers/${id}/reviews`));
  },
  async reviewOrder(id: number, payload: { rating: number; content?: string }) {
    return unwrap(await client.post(`/orders/${id}/review`, payload));
  },
};
