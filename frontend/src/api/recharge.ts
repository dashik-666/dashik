import request from '@/utils/request';

const RECHARGE_BASE_URL = '/recharges';

export interface RechargeQuery {
  keyword?: string;
  payMethod?: string;
  startTime?: string;
  endTime?: string;
  page: number;
  limit: number;
}

export interface RechargeVO {
  id: string;
  rechargeNo: string;
  memberId: string;
  memberUsername: string;
  memberNickname: string;
  amount: number;
  payMethod: string;
  balanceChange: number;
  createTime: string;
  operatorName?: string;
  status?: string;
  remark?: string;
}

export interface RechargeForm {
  id?: string;
  memberId: string;
  amount: number;
  payMethod: string;
  remark?: string;
}

export interface RechargeStats {
  todayAmount: number;
  todayCount: number;
  monthAmount: number;
  monthCount: number;
  balancePayAmount: number;
  balancePayCount: number;
  qrcodePayAmount: number;
  qrcodePayCount: number;
}

// 数据映射函数
function mapRechargeFromBackend(item: any): RechargeVO {
  return {
    id: String(item.id),
    rechargeNo: item.recharge_no || item.rechargeNo || '',
    memberId: String(item.member_id || item.memberId || ''),
    memberUsername: item.member?.username || item.memberUsername || '',
    memberNickname: item.member?.nickname || item.memberNickname || '',
    amount: Number(item.amount || 0),
    payMethod: item.method || item.payMethod || '', // 保持原始枚举值
    balanceChange: Number(item.amount || 0), // 充值记录余额变动等于充值金额
    createTime: item.created_at || item.createdAt || item.createTime || '',
    operatorName: item.operator_name || item.operatorName || '',
    status: item.status || 'active',
    remark: item.remark || ''
  };
}

const RechargeAPI = {
  /** 获取充值记录分页列表 */
  getPage(params: RechargeQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 只添加非空参数
    if (params.page) backendParams.page = params.page;
    if (params.limit) backendParams.limit = params.limit;
    if (params.keyword && params.keyword.trim()) backendParams.keyword = params.keyword.trim();
    if (params.payMethod && params.payMethod.trim()) backendParams.method = params.payMethod.trim();
    if (params.startTime && params.startTime.trim()) backendParams.start_date = params.startTime.trim();
    if (params.endTime && params.endTime.trim()) backendParams.end_date = params.endTime.trim();

    console.log('充值记录API调用:', {
      url: RECHARGE_BASE_URL,
      params: backendParams,
      originalParams: params
    });

    return request<any, any>({
      url: RECHARGE_BASE_URL,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 处理后端响应格式 { list: [], total: number }
      console.log('充值记录API响应数据:', response);
      
      // response 现在是实际数据，直接使用
      if (response && response.list !== undefined) {
        const mappedList = Array.isArray(response.list) ? response.list.map(mapRechargeFromBackend) : [];
        return {
          list: mappedList,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('充值记录API调用失败:', error);
      throw error;
    });
  },

  /** 获取充值详情 */
  getDetail(id: string) {
    return request<any, any>({
      url: `${RECHARGE_BASE_URL}/${id}`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      if (response) {
        return mapRechargeFromBackend(response);
      }
      throw new Error('充值详情数据格式错误');
    }).catch((error) => {
      console.error('获取充值详情失败:', error);
      throw error;
    });
  },

  /** 新增充值记录 */
  create(data: RechargeForm) {
    // 转换参数名称以匹配后端API
    const backendData = {
      member_id: data.memberId,
      amount: data.amount,
      method: data.payMethod,
      remark: data.remark
    };

    console.log('充值创建API调用:', {
      url: RECHARGE_BASE_URL,
      data: backendData,
      originalData: data
    });

    return request({
      url: RECHARGE_BASE_URL,
      method: 'post',
      data: backendData
    }).then(response => {
      console.log('充值创建API响应:', response);
      console.log('响应类型:', typeof response);
      console.log('响应字段:', Object.keys(response || {}));
      
      // 验证响应数据
      if (response && (response as any).id) {
        console.log('充值创建成功，返回充值记录:', response);
        return response;
      } else {
        console.error('充值创建响应数据格式错误:', response);
        throw new Error('充值创建响应数据格式错误');
      }
    }).catch((error) => {
      console.error('充值创建API调用失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    });
  },

  /** 更新充值记录 */
  update(id: string, data: RechargeForm) {
    // 只允许修改备注
    const backendData = {
      remark: data.remark
    };

    return request({
      url: `${RECHARGE_BASE_URL}/${id}`,
      method: 'put',
      data: backendData
    });
  },

  /** 删除充值记录 */
  delete(id: string) {
    return request({
      url: `${RECHARGE_BASE_URL}/${id}`,
      method: 'delete'
    });
  },

  /** 获取充值统计数据 */
  getStats() {
    return request<any, any>({
      url: `${RECHARGE_BASE_URL}/stats/summary`,
      method: 'get'
    }).then(response => {
      // 处理后端响应格式 { stats }
      // response 现在是实际数据，直接返回
      if (response) {
        return response;
      }
      throw new Error('充值统计数据格式错误');
    }).catch((error) => {
      console.error('获取充值统计数据失败:', error);
      throw error;
    });
  },

  /** 导出充值记录 */
  export(params: RechargeQuery) {
    return request({
      url: `${RECHARGE_BASE_URL}/export`,
      method: 'get',
      params,
      responseType: 'blob'
    }).then(response => {
      // 对于blob响应，直接返回
      return response;
    });
  }
};

export default RechargeAPI;