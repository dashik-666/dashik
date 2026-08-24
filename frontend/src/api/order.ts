import request from '@/utils/request';

const ORDER_BASE_URL = '/orders';

export interface OrderQuery {
  keyword?: string;
  payMethod?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  limit?: number;
}

export interface OrderVO {
  id: string;
  orderNo: string;
  memberId: string;
  memberUsername: string;
  memberNickname: string;
  workerId: string;
  workerUsername: string;
  workerNickname: string;
  serviceHours: number;
  amount: number;
  payMethod: string;
  status: string;
  statusText: string;
  statusColor: string;
  createTime: string;
  startTime?: string;
  endTime?: string;
  remark?: string;
  discountReason?: string; // 优惠原因
}

export interface OrderForm {
  id?: string;
  memberId: string;
  workerId: string;
  serviceHours: number;
  amount: number;
  payMethod: string;
  payBalance?: number;
  payScan?: number;
  remark?: string;
  discountReason?: string; // 优惠原因
}

export interface OrderStats {
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
function mapOrderFromBackend(item: any): OrderVO {
  console.log('映射订单数据，原始数据:', item);
  
  // 订单状态映射
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待上钟',
      'in_service': '服务中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  };

  // 订单状态颜色映射
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': '#909399',    // 灰色
      'in_service': '#E6A23C', // 橙色
      'completed': '#67C23A',  // 绿色
      'cancelled': '#F56C6C'   // 红色
    };
    return colorMap[status] || '#909399';
  };

  const mappedData = {
    id: String(item.id),
    orderNo: item.order_number || item.order_no || item.orderNo || '',
    memberId: String(item.member_id || item.memberId || ''),
    memberUsername: item.member?.username || item.memberUsername || '',
    memberNickname: item.member?.nickname || item.memberNickname || '',
    workerId: String(item.worker_id || item.workerId || ''),
    workerUsername: item.worker?.username || item.workerUsername || '',
    workerNickname: item.worker?.name || item.workerNickname || '',
    serviceHours: Number(item.duration || item.serviceHours || 0),
    amount: Number(item.price_final || item.amount || 0),
    payMethod: item.pay_method || item.payMethod || '', // 保持原始枚举值
    status: item.status || 'pending',
    statusText: getStatusText(item.status || 'pending'),
    statusColor: getStatusColor(item.status || 'pending'),
    createTime: item.created_at || item.createdAt || item.createTime || '',
    startTime: item.start_time || item.startTime || '',
    endTime: item.end_time || item.endTime || '',
    remark: item.remark || '',
    discountReason: item.discount_reason || item.discountReason || ''
  };
  
  console.log('映射后的订单数据:', mappedData);
  return mappedData;
}

const OrderAPI = {
  /** 获取订单分页列表 */
  getPage(params: OrderQuery) {
    // 转换参数名称以匹配后端API，并过滤空值
    const backendParams: any = {};
    
    // 只添加非空参数
    if (params.page) backendParams.page = params.page;
    if (params.limit) backendParams.limit = params.limit;
    if (params.keyword && params.keyword.trim()) backendParams.keyword = params.keyword.trim();
    if (params.payMethod && params.payMethod.trim()) {
      // 统一支付方式映射
      const payMethod = params.payMethod.trim();
      if (payMethod === 'qrcode') {
        backendParams.pay_method = 'scan';
      } else {
        backendParams.pay_method = payMethod;
      }
    }
    if (params.startTime && params.startTime.trim()) backendParams.start_date = params.startTime.trim();
    if (params.endTime && params.endTime.trim()) backendParams.end_date = params.endTime.trim();

    console.log('订单API调用:', {
      url: ORDER_BASE_URL,
      params: backendParams,
      originalParams: params
    });

    // 添加时间戳避免缓存
    backendParams._t = Date.now();
    
    return request<any, any>({
      url: ORDER_BASE_URL,
      method: 'get',
      params: backendParams
    }).then(response => {
      // 直接返回数据，不做复杂处理
      if (response && response.list) {
        const mappedList = response.list.map((item: any) => mapOrderFromBackend(item));
        return {
          list: mappedList,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    }).catch((error) => {
      console.error('订单API调用失败:', error);
      throw error;
    });
  },

  /** 获取订单详情 */
  getDetail(id: string) {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/${id}`,
      method: 'get'
    }).then(response => {
      console.log('订单详情API响应:', response);
      
      // 后端返回格式: { code: '00000', message: '...', data: {...} }
      if (response && response.data) {
        return mapOrderFromBackend(response.data);
      } else if (response) {
        // 兼容直接返回数据的情况
        return mapOrderFromBackend(response);
      }
      throw new Error('订单详情数据格式错误');
    }).catch((error) => {
      console.error('获取订单详情失败:', error);
      throw error;
    });
  },

  /** 新增订单 */
  create(data: OrderForm) {
    // 转换参数名称以匹配后端API
    const backendData: any = {
      member_id: data.memberId,
      worker_id: data.workerId,
      duration: data.serviceHours,
      pay_method: data.payMethod,
      remark: data.remark,
      // 直接发送amount字段，让后端处理支付金额分配
      amount: data.amount
    };

    // 根据支付方式设置支付方式
    if (data.payMethod === 'balance') {
      backendData.pay_method = 'balance';
    } else if (data.payMethod === 'qrcode' || data.payMethod === 'scan') {
      backendData.pay_method = 'scan'; // 统一映射为后端期望的值
    } else if (data.payMethod === 'mixed') {
      backendData.pay_method = 'mixed';
      // 混合支付需要提供具体的支付金额
      backendData.pay_balance = data.payBalance || 0;
      backendData.pay_scan = data.payScan || 0;
    }

    // 添加优惠原因
    if (data.discountReason) {
      backendData.discount_reason = data.discountReason;
    }

    // 计算优惠金额（原价 - 实付）
    // 注意：这里需要前端传入原价，或者通过API获取打手单价计算
    // 暂时不计算discount，让后端根据price_origin和price_final计算

    console.log('转换后的后端数据:', backendData);

    console.log('订单创建API调用:', {
      url: ORDER_BASE_URL,
      data: backendData,
      originalData: data
    });

    return request<any, any>({
      url: ORDER_BASE_URL,
      method: 'post',
      data: backendData
    }).then((response: any) => {
      console.log('订单创建API响应:', response);
      
      // 验证响应数据 - request工具已经解包了data字段，response本身就是订单对象
      if (response && response.id) {
        console.log('订单创建成功，返回订单记录:', response);
        return response;
      } else {
        console.error('订单创建响应数据格式错误:', response);
        throw new Error('订单创建响应数据格式错误');
      }
    }).catch((error) => {
      console.error('订单创建API调用失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    });
  },

  /** 更新订单 */
  update(id: string, data: OrderForm) {
    // 转换参数名称以匹配后端API
    const backendData: any = {
      member_id: data.memberId,
      worker_id: data.workerId,
      duration: data.serviceHours,
      pay_method: data.payMethod,
      remark: data.remark,
      // 直接发送amount字段，让后端处理支付金额分配
      amount: data.amount
    };

    // 根据支付方式设置支付方式
    if (data.payMethod === 'balance') {
      backendData.pay_method = 'balance';
    } else if (data.payMethod === 'qrcode' || data.payMethod === 'scan') {
      backendData.pay_method = 'scan'; // 统一映射为后端期望的值
    } else if (data.payMethod === 'mixed') {
      backendData.pay_method = 'mixed';
      // 混合支付需要提供具体的支付金额
      backendData.pay_balance = data.payBalance || 0;
      backendData.pay_scan = data.payScan || 0;
    }

    // 添加优惠原因
    if (data.discountReason) {
      backendData.discount_reason = data.discountReason;
    }

    console.log('更新订单API调用:', {
      url: `${ORDER_BASE_URL}/${id}`,
      data: backendData,
      originalData: data
    });

    return request({
      url: `${ORDER_BASE_URL}/${id}`,
      method: 'put',
      data: backendData
    });
  },

  /** 删除订单 */
  delete(id: string) {
    return request({
      url: `${ORDER_BASE_URL}/${id}`,
      method: 'delete'
    });
  },

  /** 获取订单统计数据 */
  getStats() {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/stats/summary`,
      method: 'get'
    }).then(response => {
      // response 现在是实际数据，直接使用
      return response;
    }).catch((error) => {
      console.error('获取订单统计数据失败:', error);
      throw error;
    });
  },

  /** 计算订单金额 */
  calculateAmount(workerId: string, serviceHours: number) {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/calculate-price`,
      method: 'post',
      data: { worker_id: workerId, duration: serviceHours }
    }).then(response => {
      console.log('计算价格API响应:', response);
      // 后端返回的是 { data: { price_final: number } }
      return { amount: response.data?.price_final || 0 };
    });
  },

  /** 上钟 - 设置订单开始时间 */
  startOrder(orderId: string, startTime?: string) {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/${orderId}/start`,
      method: 'post',
      data: startTime ? { start_time: startTime } : {}
    }).then(response => {
      console.log('上钟API响应:', response);
      return response;
    }).catch((error) => {
      console.error('上钟失败:', error);
      throw error;
    });
  },

  /** 下钟 - 设置订单结束时间 */
  endOrder(orderId: string, endTime?: string) {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/${orderId}/end`,
      method: 'post',
      data: endTime ? { end_time: endTime } : {}
    }).then(response => {
      console.log('下钟API响应:', response);
      return response;
    }).catch((error) => {
      console.error('下钟失败:', error);
      throw error;
    });
  },

  /** 获取即将下钟的订单列表 */
  getEndingSoonOrders(minutes: number = 10) {
    return request<any, any>({
      url: `${ORDER_BASE_URL}/ending-soon`,
      method: 'get',
      params: { minutes }
    }).then(response => {
      console.log('获取即将下钟订单API响应:', response);
      return response;
    }).catch((error) => {
      console.error('获取即将下钟订单失败:', error);
      throw error;
    });
  },

  /** 导出订单列表 */
  export(params: OrderQuery) {
    // 转换参数名称以匹配后端API
    const backendParams: any = {};
    
    // 只添加非空参数
    if (params.page) backendParams.page = params.page;
    if (params.limit) backendParams.limit = params.limit;
    if (params.keyword && params.keyword.trim()) backendParams.keyword = params.keyword.trim();
    if (params.payMethod && params.payMethod.trim()) {
      // 统一支付方式映射
      const payMethod = params.payMethod.trim();
      if (payMethod === 'qrcode') {
        backendParams.pay_method = 'scan';
      } else {
        backendParams.pay_method = payMethod;
      }
    }
    if (params.startTime && params.startTime.trim()) backendParams.start_date = params.startTime.trim();
    if (params.endTime && params.endTime.trim()) backendParams.end_date = params.endTime.trim();

    return request({
      url: `${ORDER_BASE_URL}/export`,
      method: 'get',
      params: backendParams,
      responseType: 'blob'
    }).then(response => {
      // 直接返回blob响应
      return response;
    }).catch((error) => {
      console.error('导出订单失败:', error);
      throw error;
    });
  }
};

export default OrderAPI;