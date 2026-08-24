import request from "@/utils/request";

const ROLE_BASE_URL = "/roles";

const RoleAPI = {
  /**
   * 获取角色分页列表
   *
   * @param queryParams 查询参数
   */
  getPage(queryParams: RolePageQuery) {
    return request<any, PageResult<RolePageVO[]>>({
      url: `${ROLE_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /**
   * 获取角色表单详情
   *
   * @param roleId 角色ID
   * @returns 角色表单详情
   */
  getFormData(roleId: number) {
    return request<any, RoleForm>({
      url: `${ROLE_BASE_URL}/${roleId}/form`,
      method: "get",
    });
  },

  /**
   * 添加角色
   *
   * @param data 角色表单数据
   */
  create(data: RoleForm) {
    return request({
      url: `${ROLE_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /**
   * 修改角色
   *
   * @param id 角色ID
   * @param data 角色表单数据
   */
  update(id: number, data: RoleForm) {
    return request({
      url: `${ROLE_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 批量删除角色，多个以英文逗号(,)分割
   *
   * @param ids 角色ID字符串，多个以英文逗号(,)分割
   */
  deleteByIds(ids: string) {
    return request({
      url: `${ROLE_BASE_URL}/${ids}`,
      method: "delete",
    });
  },

  /**
   * 获取角色下拉数据源
   */
  getOptions() {
    return request<any, OptionType[]>({
      url: `${ROLE_BASE_URL}/options`,
      method: "get",
    });
  },
};

export default RoleAPI;

export interface RolePageQuery {
  /** 搜索关键字 */
  keywords?: string;
  /** 状态 */
  status?: string;
  /** 页码 */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
}

export interface RolePageVO {
  /** 角色ID */
  id: number;
  /** 角色名称 */
  name: string;
  /** 角色编码 */
  code: string;
  /** 角色描述 */
  description?: string;
  /** 状态 */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

export interface RoleForm {
  /** 角色ID */
  id?: number;
  /** 角色名称 */
  name: string;
  /** 角色编码 */
  code: string;
  /** 角色描述 */
  description?: string;
  /** 状态 */
  status: string;
}

export interface OptionType {
  /** 选项值 */
  value: number | string;
  /** 选项标签 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
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
