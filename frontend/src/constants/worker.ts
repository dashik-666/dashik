/**
 * 打手状态常量
 * 与后端 WorkerStatus 枚举保持一致
 */
export const WORKER_STATUS = {
  AVAILABLE: '可用',
  BUSY: '忙碌',
  REST: '休息',
  DISABLED: '禁用'
} as const;

/**
 * 打手类型常量
 * 与后端 WorkerType 枚举保持一致
 */
export const WORKER_TYPE = {
  RUNNER: '跑刀',
  COMPANION: '陪玩',
  TRAINER: '陪练',
  OTHER: '其他'
} as const;

/**
 * 状态标签类型映射
 */
export const WORKER_STATUS_TAG_TYPE = {
  [WORKER_STATUS.AVAILABLE]: 'success',
  [WORKER_STATUS.BUSY]: 'warning',
  [WORKER_STATUS.REST]: 'info',
  [WORKER_STATUS.DISABLED]: 'danger'
} as const;

/**
 * 状态文本映射
 */
export const WORKER_STATUS_TEXT = {
  [WORKER_STATUS.AVAILABLE]: '可用',
  [WORKER_STATUS.BUSY]: '忙碌',
  [WORKER_STATUS.REST]: '休息',
  [WORKER_STATUS.DISABLED]: '禁用'
} as const;
