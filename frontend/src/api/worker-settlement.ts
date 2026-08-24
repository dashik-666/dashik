import request from "@/utils/request";

const SETTLEMENT_BASE_URL = "/worker-settlements";

const WorkerSettlementAPI = {
  /**
   * 获取对账分页列表
   *
   * @param queryParams 查询参数
   */
  getPage(queryParams: SettlementPageQuery) {
    return request<any, PageResult<SettlementPageVO[]>>({
      url: `${SETTLEMENT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取对账详情
   *
   * @param id 对账ID
   */
  getDetail(id: number) {
    return request<any, SettlementDetailVO>({
      url: `${SETTLEMENT_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /**
   * 创建对账记录
   *
   * @param data 对账表单数据
   */
  create(data: SettlementForm) {
    return request({
      url: `${SETTLEMENT_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 更新对账记录
   *
   * @param id 对账ID
   * @param data 对账表单数据
   */
  update(id: number, data: SettlementForm) {
    return request({
      url: `${SETTLEMENT_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 确认核账
   *
   * @param id 对账ID
   * @param note 核账备注
   */
  confirm(id: number, note?: string) {
    return request({
      url: `${SETTLEMENT_BASE_URL}/${id}/confirm`,
      method: "put",
      data: { note },
    });
  },

  /**
   * 标记争议
   *
   * @param id 对账ID
   * @param reason 争议原因
   */
  dispute(id: number, reason: string) {
    return request({
      url: `${SETTLEMENT_BASE_URL}/${id}/dispute`,
      method: "put",
      data: { reason },
    });
  },

  /**
   * 删除对账记录
   *
   * @param id 对账ID
   */
  delete(id: number) {
    return request({
      url: `${SETTLEMENT_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default WorkerSettlementAPI;

export interface SettlementPageQuery {
  /** 页码 */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
  /** 打手ID */
  workerId?: number;
  /** 状态 */
  status?: string;
  /** 结算类型 */
  settlementType?: string;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
}

export interface SettlementPageVO {
  /** 对账ID */
  id: number;
  /** 打手ID */
  workerId: number;
  /** 打手姓名 */
  workerName: string;
  /** 打手真实姓名 */
  workerRealName: string;
  /** 打手电话 */
  workerPhone: string;
  /** 结算类型 */
  settlementType: string;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 订单数量 */
  orderCount: number;
  /** 订单金额 */
  orderAmount: number;
  /** 总小时数 */
  totalHours: number;
  /** 小时单价 */
  hourlyRate: number;
  /** 应得金额 */
  expectedAmount: number;
  /** 实发金额 */
  actualAmount: number;
  /** 差额 */
  differenceAmount: number;
  /** 差额说明 */
  differenceReason?: string;
  /** 状态 */
  status: string;
  /** 核账人ID */
  confirmedBy?: number;
  /** 核账人用户名 */
  confirmedByUsername?: string;
  /** 核账时间 */
  confirmedAt?: string;
  /** 核账备注 */
  confirmationNote?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

export interface SettlementDetailVO extends SettlementPageVO {
  /** 打手小时单价 */
  workerHourlyRate: number;
  /** 订单列表 */
  orders: SettlementOrder[];
}

export interface SettlementOrder {
  /** 订单ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 订单金额 */
  priceFinal: number;
  /** 服务小时数 */
  serviceHours: number;
  /** 创建时间 */
  createTime: string;
}

export interface SettlementForm {
  /** 打手ID */
  workerId: number;
  /** 结算类型 */
  settlementType: string;
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
  /** 实发金额 */
  actualAmount: number;
  /** 差额说明 */
  differenceReason?: string;
}

export interface PageResult<T> {
  /** 数据列表 */
  list: T;
  /** 总数 */
  total: number;
  /** 页码 */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
}
