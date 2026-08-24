import request from '@/utils/request';

const COMMISSION_RULE_BASE_URL = '/commission-rules';

export interface CommissionRuleQuery {
  keyword?: string;
  type?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CommissionRuleVO {
  id: string;
  name: string;
  type: 'global' | 'level' | 'custom';
  worker_level?: string;
  worker_id?: number;
  worker?: {
    id: number;
    name: string;
    real_name: string;
  };
  commission_rate: number;
  min_amount?: number;
  max_amount?: number;
  status: 'active' | 'inactive';
  priority: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRuleForm {
  id?: string;
  name: string;
  type: 'global' | 'level' | 'custom';
  worker_level?: string;
  worker_id?: number;
  commission_rate: number;
  min_amount?: number;
  max_amount?: number;
  priority: number;
  status: 'active' | 'inactive';
  remark?: string;
}

export interface CommissionCalculationParams {
  worker_id: number;
  amount: number;
  worker_level?: string;
}

export interface CommissionCalculationResult {
  rule: CommissionRuleVO | null;
  commission_rate: number;
  commission_amount: number;
  platform_amount: number;
  total_amount: number;
}

const CommissionRuleAPI = {
  /** 获取分成规则分页列表 */
  getPage(params: CommissionRuleQuery) {
    const backendParams: any = {};
    
    if (params.page) backendParams.page = params.page;
    if (params.limit) backendParams.limit = params.limit;
    if (params.keyword && params.keyword.trim()) backendParams.keyword = params.keyword.trim();
    if (params.type && params.type.trim()) backendParams.type = params.type.trim();
    if (params.status && params.status.trim()) backendParams.status = params.status.trim();

    return request<any, any>({
      url: COMMISSION_RULE_BASE_URL,
      method: 'get',
      params: backendParams
    }).then(response => {
      if (response && response.list !== undefined) {
        return {
          list: response.list,
          total: Number(response.total || 0)
        };
      }
      return { list: [], total: 0 };
    });
  },

  /** 获取分成规则详情 */
  getDetail(id: string) {
    return request<any, CommissionRuleVO>({
      url: `${COMMISSION_RULE_BASE_URL}/${id}`,
      method: 'get'
    });
  },

  /** 创建分成规则 */
  create(data: CommissionRuleForm) {
    return request<any, CommissionRuleVO>({
      url: COMMISSION_RULE_BASE_URL,
      method: 'post',
      data
    });
  },

  /** 更新分成规则 */
  update(id: string, data: Partial<CommissionRuleForm>) {
    return request<any, CommissionRuleVO>({
      url: `${COMMISSION_RULE_BASE_URL}/${id}`,
      method: 'put',
      data
    });
  },

  /** 删除分成规则 */
  delete(id: string) {
    return request({
      url: `${COMMISSION_RULE_BASE_URL}/${id}`,
      method: 'delete'
    });
  },

  /** 计算打手分成 */
  calculate(params: CommissionCalculationParams) {
    return request<any, CommissionCalculationResult>({
      url: `${COMMISSION_RULE_BASE_URL}/calculate`,
      method: 'post',
      data: params
    });
  }
};

export default CommissionRuleAPI;
