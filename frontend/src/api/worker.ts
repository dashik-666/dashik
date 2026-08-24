import request from '@/utils/request';

const WORKER_BASE_URL = '/workers';

export interface WorkerQuery {
  keyword?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  limit: number;
}

export interface WorkerVO {
  id: string;
  username: string;
  nickname: string;
  phone: string;
  email?: string;
  avatar?: string;
  realName: string;
  idCard: string;
  bankCard: string;
  bankName: string;
  hourlyRate: number;
  status: string;
  accountName?: string;
  level?: string;
  skills?: string[];
  totalOrders: number;
  totalIncome: number;
  createTime: string;
  updateTime: string;
}

export interface WorkerForm {
  id?: string;
  username?: string;
  nickname: string;
  phone: string;
  email?: string;
  avatar?: string;
  realName: string;
  idCard: string;
  bankCard: string;
  bankName: string;
  hourlyRate: number;
  status: string;
  level?: string;
  accountName?: string;
  bankAddress?: string;
  bio?: string;
  skills?: string[];
  remark?: string;
}

export interface WorkerOrderRecord {
  id: string;
  orderNo: string;
  memberId: string;
  memberUsername: string;
  serviceHours: number;
  amount: number;
  income: number;
  createTime: string;
  remark?: string;
}

export interface WorkerIncomeStats {
  todayIncome: number;
  monthIncome: number;
  totalIncome: number;
  totalOrders: number;
}

export interface WorkerStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  averageRate: number;
}

// 数据映射函数
function mapWorkerFromBackend(item: any): WorkerVO {
  console.log('映射打手数据:', {
    id: item.id,
    name: item.name,
    total_orders: item.total_orders,
    total_income: item.total_income
  });
  
  return {
    id: String(item.id),
    username: item.username || '',
    nickname: item.name || item.nickname || '', // 修复：后端返回的是name字段
    phone: item.phone || '',
    email: item.email || '',
    avatar: item.avatar || '',
    realName: item.real_name || item.realName || '',
    idCard: item.id_number || item.id_card || item.idCard || '', // 修复：后端返回的是id_number字段
    bankCard: item.bank_account || item.bank_card || item.bankCard || '', // 修复：后端返回的是bank_account字段
    bankName: item.bank_name || item.bankName || '',
    hourlyRate: Number(item.price_hour || item.hourly_rate || item.hourlyRate || 0), // 修复：后端返回的是price_hour字段
    status: item.status || '待审核',
    accountName: item.account_name || item.accountName || '', // 添加：开户姓名字段
    level: item.level || '',
    skills: item.skills || [],
    totalOrders: Number(item.total_orders || item.totalOrders || 0),
    totalIncome: Number(item.total_income || item.totalIncome || 0),
    createTime: item.created_at || item.createdAt || item.createTime || '',
    updateTime: item.updated_at || item.updatedAt || item.updateTime || ''
  };
}

const WorkerAPI = {
  /** 获取打手分页列表 */
  getPage(params: WorkerQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 只添加非空参数
    if (params.page) backendParams.page = params.page;
    if (params.limit) backendParams.limit = params.limit;
    if (params.keyword && params.keyword.trim()) backendParams.keyword = params.keyword.trim();
    if (params.status && params.status.trim()) backendParams.status = params.status.trim();
    if (params.startTime && params.startTime.trim()) backendParams.start_date = params.startTime.trim();
    if (params.endTime && params.endTime.trim()) backendParams.end_date = params.endTime.trim();

    console.log('打手API调用:', {
      url: WORKER_BASE_URL,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: WORKER_BASE_URL,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式 { list: [], total: number }
      console.log('打手API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (response && response.list !== undefined) {
        const mappedList = Array.isArray(response.list) ? response.list.map(mapWorkerFromBackend) : [];
        return {
          list: mappedList,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('打手API调用失败:', error);
      throw error;
    });
  },

  /** 获取打手详情 */
  getDetail(id: string) {
    return request<any, any>({
      url: `${WORKER_BASE_URL}/${id}`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      if (response) {
        return mapWorkerFromBackend(response);
      }
      throw new Error('打手详情数据格式错误');
    }).catch((error) => {
      console.error('获取打手详情失败:', error);
      throw error;
    });
  },

  /** 新增打手 */
  create(data: WorkerForm) {
    // 转换字段名称以匹配后端API
    const backendData: any = {
      name: data.nickname, // 昵称
      real_name: data.realName, // 真实姓名
      id_number: data.idCard, // 身份证号
      phone: data.phone, // 手机号
      bank_account: data.bankCard, // 银行卡号
      bank_name: data.bankName, // 开户行名称
      account_name: data.accountName, // 开户姓名
      price_hour: data.hourlyRate, // 小时费率
      type: '跑刀', // 默认类型（使用后端枚举值）
      status: data.status || '可用', // 状态转换
      level: data.level || 'A', // 级别
      skills: data.skills || [] // 技能标签
    };

    console.log('打手创建API调用:', {
      url: WORKER_BASE_URL,
      data: backendData,
      originalData: data
    });

    return request({
      url: WORKER_BASE_URL,
      method: 'post',
      data: backendData
    }).then(response => {
      console.log('打手创建API响应:', response);
      
      // 验证响应数据
      if (response && (response as any).id) {
        console.log('打手创建成功，返回打手记录:', response);
        return response;
      } else {
        console.error('打手创建响应数据格式错误:', response);
        throw new Error('打手创建响应数据格式错误');
      }
    }).catch((error) => {
      console.error('打手创建API调用失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    });
  },

  /** 更新打手 */
  update(id: string, data: WorkerForm) {
    // 转换字段名称以匹配后端API
    const backendData: any = {
      name: data.nickname, // 昵称
      real_name: data.realName, // 真实姓名
      id_number: data.idCard, // 身份证号
      phone: data.phone, // 手机号
      bank_account: data.bankCard, // 银行卡号
      bank_name: data.bankName, // 开户行名称
      account_name: data.accountName, // 开户姓名
      price_hour: data.hourlyRate, // 小时费率
      type: '跑刀', // 默认类型
      status: data.status || '可用', // 状态转换
      level: data.level || 'A', // 级别
      skills: data.skills || [] // 技能标签
    };

    return request({
      url: `${WORKER_BASE_URL}/${id}`,
      method: 'put',
      data: backendData
    });
  },

  /** 取消打手（软删除） */
  delete(id: string, data?: { cancel_reason?: string }) {
    return request({
      url: `${WORKER_BASE_URL}/${id}`,
      method: 'delete',
      data
    });
  },

  /** 启用/禁用打手 */
  updateStatus(id: string, status: string) {
    return request({
      url: `${WORKER_BASE_URL}/${id}/status`,
      method: 'put',
      data: { status }
    });
  },

  /** 获取打手订单记录 */
  getOrderRecords(workerId: string, params?: { page?: number; limit?: number }) {
    // 转换参数名称以匹配后端API
    const backendParams: any = { worker_id: workerId };
    if (params) {
      backendParams.page = params.page;
      backendParams.limit = params.limit;
    }

    return request<any, any>({
      url: `${WORKER_BASE_URL}/${workerId}/orders`,
      method: 'get',
      params: backendParams
    }).then(response => {
      // response 现在是实际数据，直接使用
      if (response && response.list !== undefined) {
        return {
          list: response.list,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('获取打手订单记录失败:', error);
      throw error;
    });
  },

  /** 获取打手收入统计 */
  getIncomeStats(workerId: string) {
    return request<any, any>({
      url: `${WORKER_BASE_URL}/${workerId}/income-stats`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      return response;
    }).catch((error) => {
      console.error('获取打手收入统计失败:', error);
      throw error;
    });
  },

  /** 获取打手统计数据 */
  getStats() {
    return request<any, any>({
      url: `${WORKER_BASE_URL}/stats`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      return response;
    }).catch((error) => {
      console.error('获取打手统计数据失败:', error);
      throw error;
    });
  },

  /** 获取打手下拉选项（用于选择器） */
  getOptions(): Promise<Array<{ value: number; label: string }>> {
    const pageSize = 100; // 后端限制 limit <= 100
    const maxFetch = 1000; // 保护上限，防止无限请求
    let page = 1;
    let collected: any[] = [];

    const fetchPage = (): Promise<any> => {
      return request<any, any>({
        url: WORKER_BASE_URL,
        method: 'get',
        params: { page, limit: pageSize }
      }).then((response) => {
        const list = Array.isArray(response?.list) ? response.list : [];
        const total = Number(response?.total || 0);
        collected = collected.concat(list);
        const fetched = collected.length;
        const reachedMax = fetched >= total || fetched >= maxFetch;
        if (!reachedMax) {
          page += 1;
          return fetchPage();
        }
        return collected;
      });
    };

    return fetchPage()
      .then((all: any[]) => all.map((item: any) => ({
        value: Number(item.id),
        label: String(item.name || item.nickname || item.real_name || item.phone || item.id)
      })))
      .catch((error) => {
        console.error('获取打手选项失败:', error);
        return [];
      });
  },

  /** 获取可用打手列表 */
  getAvailableWorkers() {
    return request<any, any>({
      url: `${WORKER_BASE_URL}/available`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      if (Array.isArray(response)) {
        return response.map(mapWorkerFromBackend);
      }
      return [];
    }).catch((error) => {
      console.error('获取可用打手列表失败:', error);
      throw error;
    });
  },

  /** 导出打手列表 */
  export(params: WorkerQuery) {
    return request({
      url: `${WORKER_BASE_URL}/export`,
      method: 'get',
      params,
      responseType: 'blob'
    });
  }
};

export default WorkerAPI;