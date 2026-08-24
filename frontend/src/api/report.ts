import request from '@/utils/request';

const REPORT_BASE_URL = '/reports';

export interface DashboardStats {
  todayOrders: number;
  todayRecharge: number;
  todayMembers: number;
  todayWorkers: number;
  todayIncome: number;
  platformBalance: number;
}

export interface TrendData {
  date: string;
  orderAmount: number;
  orderCount: number;
  rechargeAmount: number;
  rechargeCount: number;
}

export interface PayMethodStats {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MemberRanking {
  memberId: string;
  memberUsername: string;
  memberNickname: string;
  totalConsume: number;
  orderCount: number;
}

export interface WorkerRanking {
  workerId: string;
  workerUsername: string;
  workerNickname: string;
  totalIncome: number;
  orderCount: number;
}

export interface DetailStats {
  date: string;
  orderAmount: number;
  orderCount: number;
  rechargeAmount: number;
  rechargeCount: number;
  newMembers: number;
  newWorkers: number;
  platformIncome: number;
  balancePayAmount: number;
  qrcodePayAmount: number;
}

export interface ReportQuery {
  startDate?: string;
  endDate?: string;
  type?: 'order' | 'recharge' | 'consume';
  period?: '7d' | '30d' | '90d';
}

const ReportAPI = {
  /** 获取今日概览数据 */
  getDashboardStats() {
    return request<any, any>({
      url: `${REPORT_BASE_URL}/today-overview`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      return response;
    }).catch((error) => {
      console.error('获取今日概览数据失败:', error);
      throw error;
    });
  },

  /** 获取趋势分析数据 */
  getTrendData(params: ReportQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 确保type参数存在，默认为order
    backendParams.type = params.type || 'order';
    if (params.period) backendParams.period = params.period;
    if (params.startDate && params.startDate.trim()) backendParams.start_date = params.startDate.trim();
    if (params.endDate && params.endDate.trim()) backendParams.end_date = params.endDate.trim();

    console.log('趋势分析API调用:', {
      url: `${REPORT_BASE_URL}/trends`,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: `${REPORT_BASE_URL}/trends`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式
      console.log('趋势分析API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    }).catch((error) => {
      console.error('趋势分析API调用失败:', error);
      throw error;
    });
  },

  /** 获取支付方式分布数据 */
  getPayMethodStats(params: ReportQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 确保type参数存在，默认为order
    backendParams.type = params.type || 'order';
    if (params.startDate && params.startDate.trim()) backendParams.start_date = params.startDate.trim();
    if (params.endDate && params.endDate.trim()) backendParams.end_date = params.endDate.trim();

    console.log('支付方式统计API调用:', {
      url: `${REPORT_BASE_URL}/payment-stats`,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: `${REPORT_BASE_URL}/payment-stats`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式
      console.log('支付方式统计API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    }).catch((error) => {
      console.error('支付方式统计API调用失败:', error);
      throw error;
    });
  },

  /** 获取会员消费排行榜 */
  getMemberRanking(params: ReportQuery & { limit?: number }) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 确保type参数存在，默认为consume
    backendParams.type = params.type || 'consume';
    if (params.limit) backendParams.limit = params.limit;
    if (params.startDate && params.startDate.trim()) backendParams.start_date = params.startDate.trim();
    if (params.endDate && params.endDate.trim()) backendParams.end_date = params.endDate.trim();

    console.log('会员排行榜API调用:', {
      url: `${REPORT_BASE_URL}/member-ranking`,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: `${REPORT_BASE_URL}/member-ranking`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式
      console.log('会员排行榜API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    }).catch((error) => {
      console.error('会员排行榜API调用失败:', error);
      throw error;
    });
  },

  /** 获取打手收入排行榜 */
  getWorkerRanking(params: ReportQuery & { limit?: number }) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 确保type参数存在，默认为consume
    backendParams.type = params.type || 'consume';
    if (params.limit) backendParams.limit = params.limit;
    if (params.startDate && params.startDate.trim()) backendParams.start_date = params.startDate.trim();
    if (params.endDate && params.endDate.trim()) backendParams.end_date = params.endDate.trim();

    console.log('打手排行榜API调用:', {
      url: `${REPORT_BASE_URL}/worker-ranking`,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: `${REPORT_BASE_URL}/worker-ranking`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式
      console.log('打手排行榜API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (Array.isArray(response)) {
        return response;
      }
      return [];
    }).catch((error) => {
      console.error('打手排行榜API调用失败:', error);
      throw error;
    });
  },

  /** 获取详细统计数据 */
  getDetailStats(params: ReportQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 确保type参数存在，默认为order
    backendParams.type = params.type || 'order';
    if (params.startDate && params.startDate.trim()) backendParams.start_date = params.startDate.trim();
    if (params.endDate && params.endDate.trim()) backendParams.end_date = params.endDate.trim();

    console.log('详细统计API调用:', {
      url: `${REPORT_BASE_URL}/comprehensive`,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: `${REPORT_BASE_URL}/comprehensive`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式
      console.log('详细统计API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (response && response.list !== undefined) {
        return {
          list: response.list,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('详细统计API调用失败:', error);
      throw error;
    });
  },

  /** 导出报表数据 */
  exportReport(params: ReportQuery & { type: 'dashboard' | 'trend' | 'detail' }) {
    return request({
      url: `${REPORT_BASE_URL}/export`,
      method: 'get',
      params,
      responseType: 'blob'
    });
  }
};

export default ReportAPI;