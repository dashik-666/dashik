// 支付方式工具函数

/**
 * 获取支付方式显示文本
 * @param method 支付方式枚举值
 * @returns 显示文本
 */
export function getPaymentMethodText(method: string): string {
  const textMap: Record<string, string> = {
    balance: '余额支付',
    scan: '扫码支付',
    qrcode: '扫码支付' // 兼容旧值
  }
  return textMap[method] || '未知'
}

/**
 * 获取支付方式标签类型
 * @param method 支付方式枚举值
 * @returns Element Plus 标签类型
 */
export function getPaymentMethodType(method: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' {
  const typeMap: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    balance: 'warning',
    scan: 'success',
    qrcode: 'success' // 兼容旧值
  }
  return typeMap[method] || 'info'
}

/**
 * 支付方式选项列表
 */
export const PAYMENT_METHOD_OPTIONS = [
  { label: '余额支付', value: 'balance' },
  { label: '扫码支付', value: 'scan' }
]
