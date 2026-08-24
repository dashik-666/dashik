import request from '@/utils/request';

const MEMBER_BASE_URL = '/members';

export interface MemberQuery {
  keywords?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface MemberVO {
  id: string;
  username: string;
  nickname: string;
  phone: string;
  email?: string;
  avatar?: string;
  balance: number;
  totalRecharge: number;
  totalConsume: number;
  status: number;
  createTime: string;
  updateTime: string;
}

export interface MemberForm {
  id?: string;
  username: string;
  nickname: string;
  phone: string;
  email?: string;
  avatar?: string;
  status: number;
}

export interface RechargeRecord {
  id: string;
  memberId: string;
  amount: number;
  payMethod: string;
  balanceChange: number;
  createTime: string;
  remark?: string;
}

export interface ConsumeRecord {
  id: string;
  memberId: string;
  orderId: string;
  amount: number;
  payMethod: string;
  balanceChange: number;
  createTime: string;
  remark?: string;
}

// Helpers to map status and field names between backend and frontend
function backendStatusToNumber(status: string | number | undefined): number {
  if (status === 'active') return 1;
  if (status === 'disabled') return 0;
  return typeof status === 'number' ? status : 1;
}

function numberStatusToBackend(status: number | string | undefined): 'active' | 'disabled' | undefined {
  if (status === 1 || status === 'active') return 'active';
  if (status === 0 || status === 'disabled') return 'disabled';
  return undefined;
}

function mapMemberFromBackend(item: any): MemberVO {
  return {
    id: String(item.id),
    username: item.username || '',
    nickname: item.nickname || '',
    phone: item.phone || '',
    email: item.email,
    avatar: item.avatar,
    balance: Number(item.balance ?? 0),
    totalRecharge: Number(item.totalRecharge ?? item.total_recharge ?? 0),
    totalConsume: Number(item.totalConsume ?? item.total_consume ?? 0),
    status: backendStatusToNumber(item.status),
    createTime: item.createdAt || item.created_at || item.createTime || '',
    updateTime: item.updatedAt || item.updated_at || item.updateTime || ''
  };
}

function mapMemberToBackendPayload(data: MemberForm): any {
  const payload: any = {
    username: data.username,
    nickname: data.nickname,
    phone: data.phone,
    status: numberStatusToBackend(data.status)
  };
  if (data.email !== undefined) payload.email = data.email;
  if (data.avatar !== undefined) payload.avatar = data.avatar;
  return payload;
}

function mapRechargeRecordFromBackend(item: any): RechargeRecord {
  return {
    id: String(item.id),
    memberId: String(item.memberId ?? item.member_id ?? ''),
    amount: Number(item.amount ?? 0),
    payMethod: item.payMethod || item.payment_method || item.pay_method || '',
    balanceChange: Number(item.balanceChange ?? item.balance_change ?? 0),
    createTime: item.createdAt || item.created_at || '',
    remark: item.remark
  };
}

function mapConsumeRecordFromBackend(item: any): ConsumeRecord {
  return {
    id: String(item.id),
    memberId: String(item.memberId ?? item.member_id ?? ''),
    orderId: String(item.orderId ?? item.order_id ?? ''),
    amount: Number(item.amount ?? item.actual_amount ?? 0),
    payMethod: item.payMethod || item.payment_method || item.pay_method || '',
    balanceChange: Number(item.balanceChange ?? item.balance_change ?? 0),
    createTime: item.createdAt || item.created_at || '',
    remark: item.remark
  };
}

const MemberAPI = {
  /** 获取会员分页列表 */
  getPage(params: MemberQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {
      page: params.pageNum || 1,
      limit: params.pageSize || 10
    };

    // 只添加非空的关键词
    if (params.keywords && params.keywords.trim()) {
      backendParams.keyword = params.keywords.trim();
    }

    // 转换状态查询参数（前端 1/0 -> 后端 'active'/'disabled'）
    if (params.status !== undefined) {
      backendParams.status = numberStatusToBackend(params.status);
    }

    console.log('会员API调用参数:', backendParams);

    return request<any, any>({
      url: MEMBER_BASE_URL,
      method: 'get',
      params: backendParams
    }).then((response) => {
      // 处理后端响应格式 { list: [], pagination: {} }
      console.log('会员API响应数据:', response);
      console.log('响应类型:', typeof response);
      console.log('响应字段:', Object.keys(response || {}));
      
      // 检查响应结构
      if (response && response.list) {
        const { list = [], pagination = {} } = response;
        console.log('解析的list:', list);
        console.log('解析的pagination:', pagination);
        
        const result = {
          list: Array.isArray(list) ? list.map(mapMemberFromBackend) : [],
          total: Number(pagination.total ?? 0)
        };
        
        console.log('返回结果:', result);
        return result;
      }
      
      console.log('响应数据格式不正确，返回空结果');
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('获取会员列表失败:', error);
      throw error;
    });
  },

  /** 获取会员详情 */
  getDetail(id: string) {
    return request<any, any>({
      url: `${MEMBER_BASE_URL}/${id}`,
      method: 'get'
    }).then((response) => {
      // 处理后端响应格式 { member }
      if (response) {
        return mapMemberFromBackend(response);
      }
      throw new Error('会员详情数据格式错误');
    }).catch((error) => {
      console.error('获取会员详情失败:', error);
      throw error;
    });
  },

  /** 新增会员 */
  create(data: MemberForm) {
    const payload = mapMemberToBackendPayload(data);
    
    console.log('创建会员API调用:', {
      url: MEMBER_BASE_URL,
      method: 'POST',
      inputData: data,
      payload: payload
    });
    
    return request<any, any>({
      url: MEMBER_BASE_URL,
      method: 'post',
      data: payload
    }).then((response) => {
      // 响应拦截器已经处理了成功情况，response 就是会员数据
      console.log('创建会员API响应:', response);
      if (response) {
        return mapMemberFromBackend(response);
      }
      throw new Error('创建会员响应格式错误');
    }).catch((error) => {
      console.error('创建会员失败:', error);
      throw error;
    });
  },

  /** 更新会员 */
  update(id: string, data: MemberForm) {
    const payload = mapMemberToBackendPayload(data);
    
    return request<any, any>({
      url: `${MEMBER_BASE_URL}/${id}`,
      method: 'put',
      data: payload
    }).then((response) => {
      // 响应拦截器已经处理了成功情况，response 就是会员数据
      if (response) {
        return mapMemberFromBackend(response);
      }
      throw new Error('更新会员响应格式错误');
    }).catch((error) => {
      console.error('更新会员失败:', error);
      throw error;
    });
  },



  /** 切换会员状态（禁用/启用） */
  toggleStatus(id: string, status: number) {
    return request<any, any>({
      url: `${MEMBER_BASE_URL}/${id}/toggle-status`,
      method: 'patch',
      data: { status }
    }).then((response) => {
      // 响应拦截器已经处理了成功情况，这里直接返回
      return response;
    }).catch((error) => {
      console.error('切换会员状态失败:', error);
      throw error;
    });
  },

  /** 获取会员充值记录 */
  getRechargeRecords(memberId: string, params?: { pageNum?: number; pageSize?: number }) {
    const backendParams: any = {
      page: params?.pageNum || 1,
      limit: params?.pageSize || 10
    };

    return request<any, any>({
      url: `${MEMBER_BASE_URL}/${memberId}/recharges`,
      method: 'get',
      params: backendParams
    }).then((response) => {
      // 响应拦截器已经处理了成功情况，response 就是数据
      if (response && response.list) {
        return {
          list: Array.isArray(response.list) ? response.list.map(mapRechargeRecordFromBackend) : [],
          total: Number(response.pagination?.total ?? 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('获取充值记录失败:', error);
      throw error;
    });
  },

  /** 获取会员消费记录 */
  getConsumeRecords(memberId: string, params?: { pageNum?: number; pageSize?: number }) {
    const backendParams: any = {
      page: params?.pageNum || 1,
      limit: params?.pageSize || 10
    };

    return request<any, any>({
      url: `${MEMBER_BASE_URL}/${memberId}/orders`,
      method: 'get',
      params: backendParams
    }).then((response) => {
      // 响应拦截器已经处理了成功情况，response 就是数据
      if (response && response.list) {
        return {
          list: Array.isArray(response.list) ? response.list.map(mapConsumeRecordFromBackend) : [],
          total: Number(response.pagination?.total ?? 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('获取消费记录失败:', error);
      throw error;
    });
  },

  /** 导出会员列表 */
  export(params: MemberQuery) {
    // 转换参数名称以匹配后端API
    const backendParams: any = {
      page: params.pageNum,
      limit: params.pageSize,
      keyword: params.keywords,
      start_date: params.startTime,
      end_date: params.endTime
    };
    if (params.status !== undefined) {
      backendParams.status = numberStatusToBackend(params.status);
    }

    return request({
      url: `${MEMBER_BASE_URL}/export`,
      method: 'get',
      params: backendParams,
      responseType: 'blob'
    });
  }
};

export default MemberAPI;